import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input, decode_predictions

# Load a pre-trained ResNet50 model (this includes weights trained on ImageNet)
model = ResNet50(weights='imagenet')

# Function to load and preprocess the image
def prepare_image(img_path):
    # Load the image with target size for ResNet50 input (224x224)
    img = image.load_img(img_path, target_size=(224, 224))
    # Convert the image to a numpy array
    img_array = image.img_to_array(img)
    # Add an extra dimension for batch size (as the model expects a batch of images)
    img_array = np.expand_dims(img_array, axis=0)
    # Preprocess the image (rescale, normalize)
    img_array = preprocess_input(img_array)
    return img_array

# Function to predict plant species from an image
def predict_species(img_path):
    # Prepare the image for the model
    img_array = prepare_image(img_path)
    
    # Make a prediction with the pre-trained model
    predictions = model.predict(img_array)
    
    # Decode the predictions (top-5 predicted classes)
    decoded_predictions = decode_predictions(predictions, top=5)[0]
    
    # Display the top 5 predictions
    print("Top 5 Predictions:")
    for i, (imagenet_id, label, score) in enumerate(decoded_predictions):
        print(f"{i+1}. {label} ({score*100:.2f}%)")
    
    # Plot the image along with predictions
    img = image.load_img(img_path)
    plt.imshow(img)
    plt.axis('off')
    plt.show()

# Example: Replace 'plant_image.jpg' with the path to your image
img_path =r"D:\Hack_AI-ML\lemon.jpg"
predict_species(img_path)