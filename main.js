document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Transform hamburger to X
            const bars = mobileMenu.querySelectorAll('.bar');
            bars.forEach(bar => bar.classList.toggle('active'));
        });
    }
    
    // Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
                
                // Reset hamburger icon
                const bars = mobileMenu.querySelectorAll('.bar');
                bars.forEach(bar => bar.classList.remove('active'));
            }
        });
    });
    
    // Handle auto-dismissing flash messages
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.remove();
        }, 4000);
    });
    
    // JWT token handling
    function getToken() {
        return localStorage.getItem('token');
    }
    
    // Check if user is logged in based on token presence
    function isLoggedIn() {
        return !!getToken();
    }
    
    // Update UI based on login state
    function updateUIForLoginState() {
        const authButtons = document.querySelectorAll('[data-auth="login-required"]');
        
        authButtons.forEach(button => {
            if (isLoggedIn()) {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        });
    }
    
    // Call this on page load
    updateUIForLoginState();
    
    // Add event listeners for forms with AJAX submission
    document.querySelectorAll('form[data-ajax="true"]').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
            
            const formData = new FormData(form);
            const url = form.getAttribute('action') || window.location.href;
            const method = form.getAttribute('method') || 'POST';
            
            try {
                const response = await fetch(url, {
                    method: method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                // Handle custom success callback if provided
                const successCallback = form.getAttribute('data-success-callback');
                if (successCallback && window[successCallback]) {
                    window[successCallback](data);
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                
                // Handle custom error callback if provided
                const errorCallback = form.getAttribute('data-error-callback');
                if (errorCallback && window[errorCallback]) {
                    window[errorCallback](error);
                }
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    });
});
