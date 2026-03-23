document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registrationForm');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');

    // Test backend connection on page load
    async function testBackendConnection() {
        try {
            console.log('Testing backend connection...');
            const response = await fetch('http://localhost:5000/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connection successful:', data);
            } else {
                console.warn('⚠️ Backend responded with error:', response.status);
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            errorMsg.textContent = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
        }
    }

    // Test connection when page loads
    testBackendConnection();

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        try {
            // Clear previous messages
            errorMsg.textContent = '';
            successMsg.textContent = '';

            // Basic validations
            if (!username || !email || !password || !role) {
                throw new Error("All fields are required");
            }
            
            if (username.length < 3) {
                throw new Error("Username must be at least 3 characters");
            }
            
            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters");
            }
            
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }
            
            if (!document.getElementById('terms').checked) {
                throw new Error("You must agree to the terms and conditions");
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Please enter a valid email address");
            }

            // Show loader
            const btnLoader = document.querySelector('.btn-loader');
            const btnText = document.querySelector('.btn-text');
            if (btnLoader && btnText) {
                btnLoader.style.display = 'inline-block';
                btnText.textContent = 'Creating Account...';
            }

            console.log('Sending registration request...', { username, email, role });

            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || `Registration failed (Status: ${response.status})`);
            }

            // Success
            successMsg.textContent = data.message || 'Registration successful! You can login now.';
            successMsg.style.color = 'green';
            errorMsg.textContent = '';
            
            // Show success modal
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.style.display = 'block';
            }
            
            registerForm.reset();

        } catch (err) {
            console.error('Registration error:', err);
            
            if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
                errorMsg.textContent = 'Cannot connect to server. Please make sure: 1) Backend is running on port 5000, 2) No CORS issues, 3) Network connection is active.';
            } else {
                errorMsg.textContent = err.message;
            }
            
            errorMsg.style.color = 'red';
            successMsg.textContent = '';
        } finally {
            // Hide loader
            const btnLoader = document.querySelector('.btn-loader');
            const btnText = document.querySelector('.btn-text');
            if (btnLoader && btnText) {
                btnLoader.style.display = 'none';
                btnText.textContent = 'Create Account';
            }
        }
    });

    // Modal close functionality
    const modal = document.getElementById('successModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                // Redirect to login page after successful registration
                window.location.href = 'login.html';
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                window.location.href = 'login.html';
            }
        });
    }
});

// Function to manually test backend connection (for debugging)
window.testConnection = async function() {
    try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        alert(`Backend status: ${data.status}\nMessage: ${data.message}`);
        console.log('Backend test:', data);
    } catch (error) {
        alert('Backend connection failed: ' + error.message);
        console.error('Backend test failed:', error);
    }

};