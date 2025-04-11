document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const placeholderMessage = document.getElementById('placeholder-message');
    const getLocationBtn = document.getElementById('get-location');
    const locationCoordinates = document.getElementById('location-coordinates');
    const locationAddress = document.getElementById('location-address');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const submitButton = document.getElementById('submit-button');
    const plantForm = document.getElementById('plant-form');
    const resultsContainer = document.getElementById('results-container');
    const speciesName = document.getElementById('species-name');
    const plantId = document.getElementById('plant-id');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const permissionAlerts = document.getElementById('permission-alerts');

    // Variables to track permissions
    let hasLocationPermission = false;
    let hasImageSelected = false;

    // Check if geolocation is available
    if (!navigator.geolocation) {
        showAlert('warning', 'Geolocation is not supported by your browser. You will need to enter coordinates manually.');
    }

    // Function to show alerts
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            alertDiv.remove();
        });
        
        alertDiv.appendChild(closeBtn);
        permissionAlerts.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Function to get address from coordinates using OpenStreetMap Nominatim API
    async function getAddressFromCoordinates(latitude, longitude) {
        try {
            locationAddress.textContent = "Loading address...";
            
            // Use OpenStreetMap Nominatim API for reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch address');
            }
            
            const data = await response.json();
            
            if (data && data.display_name) {
                // Format the address
                locationAddress.textContent = data.display_name;
                return data.display_name;
            } else {
                throw new Error('Address not found');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            locationAddress.textContent = "Address lookup failed";
            return null;
        }
    }
    
    // Function to get user's location
    function getLocation() {
        loader.style.display = 'flex';
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Set the values in the form
                latitudeInput.value = latitude;
                longitudeInput.value = longitude;
                locationCoordinates.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                
                // Fetch and display the address
                await getAddressFromCoordinates(latitude, longitude);
                
                hasLocationPermission = true;
                updateSubmitButton();
                
                loader.style.display = 'none';
                showAlert('success', 'Location detected successfully!');
            },
            (error) => {
                console.error('Error getting location:', error);
                loader.style.display = 'none';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showAlert('warning', 'Location permission denied. Please enable location services in your browser settings.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showAlert('warning', 'Location information is unavailable. Please try again or enter coordinates manually.');
                        break;
                    case error.TIMEOUT:
                        showAlert('warning', 'Location request timed out. Please try again.');
                        break;
                    default:
                        showAlert('warning', 'An error occurred while getting your location. Please try again.');
                }
            }
        );
    }

    // Update submit button state
    function updateSubmitButton() {
        submitButton.disabled = !(hasLocationPermission && hasImageSelected);
    }

    // Handle get location button click
    getLocationBtn.addEventListener('click', getLocation);

    // Handle image selection
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                placeholderMessage.style.display = 'none';
                
                hasImageSelected = true;
                updateSubmitButton();
            };
            
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
            placeholderMessage.style.display = 'flex';
            
            hasImageSelected = false;
            updateSubmitButton();
        }
    });

    // Handle form submission
    plantForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!hasLocationPermission || !hasImageSelected) {
            showAlert('warning', 'Please provide both location and image before submitting.');
            return;
        }
        
        // Show loader
        loader.style.display = 'flex';
        resultsContainer.style.display = 'none';
        errorMessage.textContent = '';
        
        try {
            const formData = new FormData(plantForm);
            
            const response = await fetch('/log', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Display the results
                speciesName.textContent = data.species;
                plantId.textContent = data.plant_id;
                
                // If we received an address from the server, update the address display
                if (data.address && locationAddress) {
                    locationAddress.textContent = data.address;
                }
                
                resultsContainer.style.display = 'block';
            } else {
                errorMessage.textContent = data.error || 'An error occurred. Please try again.';
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
        } finally {
            loader.style.display = 'none';
        }
    });

    // Attempt to get location on page load
    getLocation();
});
