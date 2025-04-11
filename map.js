document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const mapElement = document.getElementById('map');
    const mapSidebar = document.getElementById('map-sidebar');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const locationForm = document.getElementById('location-form');
    const getCurrentLocationBtn = document.getElementById('get-current-location');
    const suggestionsLoading = document.getElementById('loading-suggestions');
    const suggestionsList = document.getElementById('suggestions-list');
    const plantInfo = document.getElementById('plant-info');
    const plantSpecies = document.getElementById('plant-species');
    const plantCoordinates = document.getElementById('plant-coordinates');
    const plantDate = document.getElementById('plant-date');
    
    // Map variables
    let map;
    let userMarker;
    let plantMarkers = [];
    
    // Default coordinates (centered on Lucknow city, India)
    const defaultLat = 26.8467;
    const defaultLng = 80.9462;
    
    // Initialize map
    function initMap(lat, lng) {
        // If map already exists, set view to new coordinates
        if (map) {
            map.setView([lat, lng], 13);
            return;
        }
        
        // Create a new map
        map = L.map(mapElement).setView([lat, lng], 13);
        
        // Add the base map layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Add user marker
        userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-marker',
                html: '<i class="fas fa-map-marker-alt"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map);
        
        // Update marker position when map is clicked
        map.on('click', (e) => {
            updateUserLocation(e.latlng.lat, e.latlng.lng);
        });
    }
    
    // Update user location marker and form inputs
    function updateUserLocation(lat, lng) {
        latitudeInput.value = lat;
        longitudeInput.value = lng;
        
        if (userMarker) {
            userMarker.setLatLng([lat, lng]);
        }
        
        // Fetch new data for the updated location
        loadMapData(lat, lng);
    }
    
    // Get user's current location
    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    updateUserLocation(latitude, longitude);
                    map.setView([latitude, longitude], 13);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Could not get your current location. Please allow location access or enter coordinates manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    }
    
    // Clear existing plant markers
    function clearPlantMarkers() {
        plantMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        plantMarkers = [];
    }
    
    // Display plant on the map
    function displayPlants(plants) {
        clearPlantMarkers();
        
        plants.forEach(plant => {
            const marker = L.marker([plant.latitude, plant.longitude], {
                icon: L.divIcon({
                    className: 'plant-marker',
                    html: '<i class="fas fa-leaf"></i>',
                    iconSize: [25, 25],
                    iconAnchor: [12, 25]
                }),
                title: plant.species // This adds a hover tooltip with the species name
            }).addTo(map);
            
            // Format date
            const date = new Date(plant.identified_at);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Add click event to show plant details
            marker.on('click', () => {
                plantSpecies.textContent = plant.species;
                plantCoordinates.textContent = `${plant.latitude.toFixed(6)}, ${plant.longitude.toFixed(6)}`;
                plantDate.textContent = formattedDate;
                plantInfo.style.display = 'block';
                
                // Highlight the selected marker
                plantMarkers.forEach(m => {
                    m.getElement().classList.remove('selected');
                });
                marker.getElement().classList.add('selected');
            });
            
            plantMarkers.push(marker);
        });
    }
    
    // Display suggestions in the sidebar
    function displaySuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        suggestionsLoading.style.display = 'none';
        
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const listItem = document.createElement('li');
                listItem.textContent = suggestion;
                suggestionsList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'No suggestions available for this area';
            suggestionsList.appendChild(listItem);
        }
    }
    
    // Load map data from API
    async function loadMapData(lat, lng) {
        suggestionsLoading.style.display = 'flex';
        plantInfo.style.display = 'none';
        
        try {
            const response = await fetch(`/api/map?lat=${lat}&long=${lng}`);
            const data = await response.json();
            
            if (data.error) {
                alert(`Error: ${data.error}`);
                return;
            }
            
            // Display plants on map
            displayPlants(data.plants);
            
            // Display suggestions in sidebar
            displaySuggestions(data.suggestions);
            
        } catch (error) {
            console.error('Error loading map data:', error);
            alert('Failed to load plants and suggestions. Please try again.');
            suggestionsLoading.style.display = 'none';
        }
    }
    
    // No toggle sidebar functionality - sidebar always shown
    // Trigger map resize to ensure correct dimensions
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
    
    // Handle location form submission
    locationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            alert('Please enter valid latitude and longitude values');
            return;
        }
        
        updateUserLocation(lat, lng);
        map.setView([lat, lng], 13);
    });
    
    // Get current location button
    getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    
    // Initialize map with default or URL parameters
    function initialize() {
        // Get coordinates from URL if available
        const urlParams = new URLSearchParams(window.location.search);
        const urlLat = parseFloat(urlParams.get('lat'));
        const urlLng = parseFloat(urlParams.get('lng'));
        
        if (!isNaN(urlLat) && !isNaN(urlLng)) {
            initMap(urlLat, urlLng);
            updateUserLocation(urlLat, urlLng);
        } else {
            // Try to get user's location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        initMap(latitude, longitude);
                        updateUserLocation(latitude, longitude);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        // Use default location
                        initMap(defaultLat, defaultLng);
                        updateUserLocation(defaultLat, defaultLng);
                    }
                );
            } else {
                // Use default location if geolocation is not available
                initMap(defaultLat, defaultLng);
                updateUserLocation(defaultLat, defaultLng);
            }
        }
    }
    
    // Initialize the map
    initialize();
    
    // Add CSS for markers
    const style = document.createElement('style');
    style.textContent = `
        .user-marker {
            color: #e91e63;
            font-size: 30px;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }
        .plant-marker {
            color: #4caf50;
            font-size: 25px;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
            transition: transform 0.2s ease, color 0.2s ease;
        }
        .plant-marker:hover {
            transform: scale(1.2);
            color: #81c784;
        }
        .plant-marker.selected {
            color: #ffd54f;
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);
});
