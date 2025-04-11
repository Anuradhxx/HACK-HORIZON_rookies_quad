import os
import requests
import json
from geopy.geocoders import Nominatim
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Path to your plant species dataset
dataset_dir = r"D:\Hack_AI-ML\plant_species_model"

# Prepare your dataset (Assuming it's organized in subfolders where each folder is a species)
train_datagen = ImageDataGenerator(
    rescale=1./255,  # Normalize image pixels to [0, 1]
    shear_range=0.2,  # Random shearing of images
    zoom_range=0.2,   # Random zooming of images
    horizontal_flip=True  # Random horizontal flip
)

# For validation and test sets, we typically don't apply augmentation
valid_datagen = ImageDataGenerator(rescale=1./255)
test_datagen = ImageDataGenerator(rescale=1./255)

# Data generators for training, validation, and test data
train_generator = train_datagen.flow_from_directory(
    os.path.join(dataset_dir, 'train'),  # Path to training data
    target_size=(224, 224),  # Resize images to 224x224
    batch_size=32,  # Number of images per batch
    class_mode='categorical'  # Multi-class classification
)

valid_generator = valid_datagen.flow_from_directory(
    os.path.join(dataset_dir, 'valid'),  # Path to validation data
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical'
)

test_generator = test_datagen.flow_from_directory(
    os.path.join(dataset_dir, 'test'),  # Path to test data
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical'
)

# Load the pre-trained ResNet50 model without the top (final classification layers)
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Freeze the layers of ResNet50 (no training on these layers)
for layer in base_model.layers:
    layer.trainable = False

# Add custom layers on top of ResNet50
model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(1024, activation='relu'),  # Fully connected layer
    Dense(train_generator.num_classes, activation='softmax')  # Output layer (number of species as classes)
])

# Compile the model (fix for learning rate)
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

# Train the model on your plant species dataset
model.fit(train_generator, epochs=10, validation_data=valid_generator, steps_per_epoch=train_generator.samples // 32)

# Save the model (optional)
model.save('plant_species_model.h5')

# Function to load and preprocess the uploaded image
def prepare_image(img_path):
    """Load and preprocess the image to match ResNet50 input requirements."""
    img = image.load_img(img_path, target_size=(224, 224))  # Resize image to 224x224
    img_array = image.img_to_array(img)  # Convert image to numpy array
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = preprocess_input(img_array)  # Preprocess for ResNet50
    return img_array

# Function to get geolocation data (latitude and longitude)
def get_location():
    """Get the current location (latitude, longitude)."""
    geolocator = Nominatim(user_agent="plant_identifier")
    location = geolocator.geocode("Jamshedpur, India")  # Replace with real user input or GPS
    if location:
        return location.latitude, location.longitude
    else:
        print("Location not found.")
        return None, None

# Function to get weather data based on latitude and longitude
def get_weather_data(latitude, longitude):
    """Fetch weather data based on geolocation using OpenWeather API."""
    api_key = "2ce86a5603mshfbe1a7315d9cb97p11b2e4jsn67dc1fe51995"  # Replace with your OpenWeatherMap API key
    url = f"https://open-weather13.p.rapidapi.com/city/jamshedpur/EN"
    response = requests.get(url)
    weather_data = response.json()
    return weather_data

# Function to predict the species of an uploaded plant image
def predict_and_log_species(img_path):
    """Predict the species of a plant and log related data including geolocation and weather."""
    img_array = prepare_image(img_path)  # Preprocess the image
    predictions = model.predict(img_array)  # Predict the species
    predicted_class_index = np.argmax(predictions, axis=1)[0]
    class_label = list(train_generator.class_indices.keys())[list(train_generator.class_indices.values()).index(predicted_class_index)]

    # Get geolocation (latitude, longitude)
    latitude, longitude = get_location()
    if latitude is None or longitude is None:
        print("Unable to retrieve location. Exiting...")
        return
    
    # Get weather data using the geolocation
    weather = get_weather_data(latitude, longitude)

    # Log the plant species prediction, geolocation, and weather data
    data = {
        "species_prediction": class_label,  # Predicted species
        "location": {"latitude": latitude, "longitude": longitude},  # Latitude, longitude
        "weather": weather  # Weather data for the location
    }

    # Print the data for review
    print("\nPrediction and Log Data:")
    print(json.dumps(data, indent=4))

    # Plot the image along with the prediction
    img = image.load_img(img_path)
    plt.imshow(img)
    plt.title(f"Predicted Species: {class_label}")
    plt.axis('off')
    plt.show()

# Example usage: Predict species from an uploaded image
img_path = input("Please upload the plant image (provide path to the image): ")  # Get image path from user
predict_and_log_species(img_path)
