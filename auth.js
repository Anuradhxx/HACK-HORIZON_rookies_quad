document.addEventListener('DOMContentLoaded', () => {
    // Get tab elements
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const responseMessage = document.getElementById('response-message');
    
    // Forms
    const loginFormElement = document.getElementById('login');
    const signupFormElement = document.getElementById('signup');

    // Tab switching functionality
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        clearMessages();
    });

    signupTab.addEventListener('click', () => {
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        clearMessages();
    });

    // Clear error messages and response message
    function clearMessages() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
        
        responseMessage.textContent = '';
        responseMessage.className = 'response-message';
        responseMessage.style.display = 'none';
    }

    // Show error message
    function showError(message) {
        responseMessage.textContent = message;
        responseMessage.className = 'response-message error';
        responseMessage.style.display = 'block';
    }
    
    // Show success message
    function showSuccess(message) {
        responseMessage.textContent = message;
        responseMessage.className = 'response-message success';
        responseMessage.style.display = 'block';
    }

    // Handle form validation errors
    function displayErrors(errors, formType) {
        for (const field in errors) {
            let errorElementId;
            if (formType === 'login') {
                errorElementId = `${field}-error`;
            } else {
                // For signup form, handle confirm_password field specially
                errorElementId = `signup-${field}-error`;
            }
            
            const errorElement = document.getElementById(errorElementId);
            if (errorElement) {
                errorElement.textContent = errors[field].join(', ');
            } else {
                console.error(`Error element not found for field: ${field}, formType: ${formType}, elementId: ${errorElementId}`);
            }
        }
    }

    // Handle login form submission
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const formData = new FormData(loginFormElement);
        
        try {
            const response = await fetch(loginFormElement.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                
                // Show success message
                showSuccess('Login successful! Redirecting...');
                
                // Redirect to the specified page
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                if (data.error) {
                    showError(data.error);
                } else if (data.errors) {
                    displayErrors(data.errors, 'login');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again.');
        }
    });

    // Handle signup form submission
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const formData = new FormData(signupFormElement);
        
        try {
            const response = await fetch(signupFormElement.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                
                // Show success message
                showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to the specified page
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                if (data.error) {
                    showError(data.error);
                } else if (data.errors) {
                    displayErrors(data.errors, 'signup');
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('An error occurred. Please try again.');
        }
    });
});
