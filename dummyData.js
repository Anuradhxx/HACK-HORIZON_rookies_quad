document.addEventListener('DOMContentLoaded', () => {
    // This function checks if a default plant image exists
    // If not, it displays a plant icon in the sidebar 
    // when a plant is selected
    function setupPlantPlaceholders() {
        const plantIcons = document.querySelectorAll('.plant-marker');
        
        if (plantIcons.length === 0) return;
        
        plantIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                // Check if there's a plant info element
                const plantInfo = document.getElementById('plant-info');
                if (!plantInfo) return;
                
                // Check if there's an image element in the plant info
                let plantImage = plantInfo.querySelector('.plant-image');
                
                // If no image exists, create one
                if (!plantImage) {
                    plantImage = document.createElement('div');
                    plantImage.className = 'plant-image';
                    plantImage.innerHTML = '<i class="fas fa-leaf"></i>';
                    
                    // Insert at the beginning of plant info
                    plantInfo.insertBefore(plantImage, plantInfo.firstChild);
                    
                    // Add some inline styles for the placeholder
                    const style = document.createElement('style');
                    style.textContent = `
                        .plant-image {
                            width: 100%;
                            height: 150px;
                            background-color: var(--primary-light);
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: var(--spacing-md);
                        }
                        
                        .plant-image i {
                            font-size: 3rem;
                            color: var(--primary-color);
                        }
                    `;
                    document.head.appendChild(style);
                }
            });
        });
    }
    
    // Call the function when the map loads
    // Use MutationObserver to detect when plant markers are added
    const mapView = document.getElementById('map');
    if (mapView) {
        const observer = new MutationObserver((mutations) => {
            setupPlantPlaceholders();
        });
        
        observer.observe(mapView, { 
            childList: true,
            subtree: true
        });
        
        // Also run it once initially
        setTimeout(setupPlantPlaceholders, 2000);
    }
});