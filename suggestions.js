document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const suggestionsForm = document.getElementById('suggestions-form');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const getLocationBtn = document.getElementById('get-location');
    const locationCoordinates = document.getElementById('location-coordinates');
    const loader = document.getElementById('loader');
    const suggestionsResults = document.getElementById('suggestions-results');
    const areaDescription = document.getElementById('area-description');
    const recommendedPlantsList = document.getElementById('recommended-plants-list');
    const errorMessage = document.getElementById('error-message');
    
    // Get user's location
    function getUserLocation() {
        if (navigator.geolocation) {
            loader.style.display = 'flex';
            suggestionsResults.style.display = 'none';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    // Update form values
                    latitudeInput.value = latitude;
                    longitudeInput.value = longitude;
                    locationCoordinates.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    
                    // Load suggestions data
                    loadSuggestions(latitude, longitude);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    loader.style.display = 'none';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            showError('Location permission denied. Please enable location services in your browser settings.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            showError('Location information is unavailable. Please try again or enter coordinates manually.');
                            break;
                        case error.TIMEOUT:
                            showError('Location request timed out. Please try again.');
                            break;
                        default:
                            showError('An error occurred while getting your location. Please try again.');
                    }
                }
            );
        } else {
            showError('Geolocation is not supported by your browser');
        }
    }
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    // Load suggestions data
    async function loadSuggestions(lat, lng) {
        // Show loader
        loader.style.display = 'flex';
        suggestionsResults.style.display = 'none';
        
        try {
            const response = await fetch(`/api/suggest?lat=${lat}&long=${lng}`);
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Display suggestions
            displaySuggestions(data);
            
        } catch (error) {
            console.error('Error loading suggestions:', error);
            showError('Failed to load reforestation suggestions. Please try again.');
        } finally {
            loader.style.display = 'none';
        }
    }
    
    // Display suggestions
    function displaySuggestions(data) {
        // Set area description
        areaDescription.textContent = data.description || 'No area description available.';
        
        // Clear existing plant recommendations
        recommendedPlantsList.innerHTML = '';
        
        // Add each recommended plant to the list
        if (data.recommended_plants && data.recommended_plants.length > 0) {
            data.recommended_plants.forEach(plant => {
                const listItem = document.createElement('li');
                listItem.textContent = plant;
                recommendedPlantsList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'No plant recommendations available for this area.';
            recommendedPlantsList.appendChild(listItem);
        }
        
        // Show the results section
        suggestionsResults.style.display = 'block';
        
        // Smooth scroll to results
        suggestionsResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Get location button click
    getLocationBtn.addEventListener('click', getUserLocation);
    
    // Handle form submission
    suggestionsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            showError('Please provide valid latitude and longitude coordinates');
            return;
        }
        
        // Update location display
        locationCoordinates.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Load suggestions data
        loadSuggestions(lat, lng);
    });
    
    // Initialize - attempt to get user location on page load
    getUserLocation();
});
