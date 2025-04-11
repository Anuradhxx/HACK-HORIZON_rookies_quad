import requests
import json
from geopy.geocoders import Nominatim
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input, decode_predictions

# Load the pre-trained ResNet50 model
model = ResNet50(weights='imagenet')

# Function to load and preprocess the image
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
    location = geolocator.geocode("Jamshedpur,India")  # Replace with real user input or GPS
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

# Function to predict plant species and log data
def predict_and_log_species(img_path):
    """Predict the species of a plant and log related data including geolocation and weather."""
    img_array = prepare_image(img_path)  # Preprocess the image
    predictions = model.predict(img_array)  # Predict the species
    decoded_predictions = decode_predictions(predictions, top=5)[0]  # Decode top 5 predictions

    # Convert predictions scores to regular Python floats (instead of numpy float32)
    for i in range(len(decoded_predictions)):
        decoded_predictions[i] = (decoded_predictions[i][0], decoded_predictions[i][1], float(decoded_predictions[i][2]))

    # Get geolocation (latitude, longitude)
    latitude, longitude = get_location()
    if latitude is None or longitude is None:
        print("Unable to retrieve location. Exiting...")
        return
    
    # Get weather data using the geolocation
    weather = get_weather_data(latitude, longitude)

    # Log the plant species prediction, geolocation, and weather data
    data = {
        "species_predictions": decoded_predictions,  # List of top 5 species predictions
        "location": {"latitude": latitude, "longitude": longitude},  # Latitude, longitude
        "weather": weather  # Weather data for the location
    }

    # Print the data for review
    print("\nPrediction and Log Data:")
    print(json.dumps(data, indent=4))

    # Plot the image along with the predictions
    img = image.load_img(img_path)
    plt.imshow(img)
    plt.title("Top 5 Predictions:")
    plt.axis('off')
    plt.show()

# Example usage (Replace 'plant_image.jpg' with your actual image path)
img_path =r"D:\Hack_AI-ML\lemon.jpg"  # Update this path with your image
predict_and_log_species(img_path)