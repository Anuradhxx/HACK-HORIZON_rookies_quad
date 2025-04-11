document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const nearbyForm = document.getElementById('nearby-form');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const distanceSelect = document.getElementById('distance');
    const getLocationBtn = document.getElementById('get-location');
    const locationCoordinates = document.getElementById('location-coordinates');
    const plantsGrid = document.getElementById('plants-grid');
    const noPlants = document.getElementById('no-plants-message');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    
    // Default distance value
    let selectedDistance = 500;
    
    // Get user's location
    function getUserLocation() {
        if (navigator.geolocation) {
            loader.style.display = 'flex';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    // Update form values
                    latitudeInput.value = latitude;
                    longitudeInput.value = longitude;
                    locationCoordinates.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    
                    // Update selected distance
                    selectedDistance = parseInt(distanceSelect.value);
                    
                    // Load plants data
                    loadNearbyPlants(latitude, longitude, selectedDistance);
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
    
    // Load nearby plants data
    async function loadNearbyPlants(lat, lng, dist) {
        // Show loader
        loader.style.display = 'flex';
        plantsGrid.innerHTML = '';
        noPlants.style.display = 'none';
        
        try {
            const response = await fetch(`/api/nearby-plants?lat=${lat}&long=${lng}&dist=${dist}`);
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Display plants
            displayPlants(data.plants);
            
        } catch (error) {
            console.error('Error loading nearby plants:', error);
            showError('Failed to load nearby plants. Please try again.');
        } finally {
            loader.style.display = 'none';
        }
    }
    
    // Display plants in the grid
    function displayPlants(plants) {
        plantsGrid.innerHTML = '';
        
        if (!plants || plants.length === 0) {
            noPlants.style.display = 'block';
            return;
        }
        
        plants.forEach(plant => {
            // Create plant card
            const card = document.createElement('div');
            card.className = 'plant-card';
            
            // Format date
            const date = new Date(plant.identified_at);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Build card HTML
            card.innerHTML = `
                <div class="plant-card-header">
                    <h3>${plant.species}</h3>
                    <span class="distance-badge">${plant.distance}m away</span>
                </div>
                <div class="plant-card-body">
                    <p><strong>Coordinates:</strong> ${plant.latitude.toFixed(6)}, ${plant.longitude.toFixed(6)}</p>
                    <p><strong>Identified:</strong> ${formattedDate}</p>
                </div>
            `;
            
            plantsGrid.appendChild(card);
        });
    }
    
    // Get location button click
    getLocationBtn.addEventListener('click', getUserLocation);
    
    // Handle form submission
    nearbyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        const dist = parseInt(distanceSelect.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            showError('Please provide valid latitude and longitude coordinates');
            return;
        }
        
        // Update location display
        locationCoordinates.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Load plants data
        loadNearbyPlants(lat, lng, dist);
    });
    
    // Initialize - attempt to get user location on page load
    getUserLocation();
});
