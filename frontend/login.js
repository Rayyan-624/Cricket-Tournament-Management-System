document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    const demoToggle = document.getElementById('demoToggle');
    const demoInfo = document.getElementById('demoInfo');
    const loginBtn = document.getElementById('loginBtn');

    // Show/hide demo credentials
    if (demoToggle) {
        demoToggle.addEventListener('click', () => {
            demoInfo.style.display = demoInfo.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        console.log('Login attempt:', { email, password }); // Debug log

        errorMsg.textContent = '';
        successMsg.textContent = '';

        // Disable button and show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In...';

        try {
            console.log('Sending request to server...'); // Debug log
            
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Response status:', res.status); // Debug log

            const data = await res.json();
            console.log('Response data:', data); // Debug log

            if (!res.ok) {
                throw new Error(data.error || `Login failed with status: ${res.status}`);
            }

            // Save token & user info
            localStorage.setItem('ctms_current_user', JSON.stringify(data.user));
            localStorage.setItem('ctms_token', data.token);

            console.log('Login successful, token saved'); // Debug log

            // Show success message in bold shiny green
            successMsg.innerHTML = '<strong style="color: #5CFF5C;font-size: 1rem;">Login successful! Redirecting...</strong>';
            errorMsg.textContent = '';

            setTimeout(() => {
                console.log('Redirecting to dashboard...'); // Debug log
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (err) {
            console.error('Login error:', err); // Debug log
            errorMsg.textContent = err.message;
            
            // Re-enable button on error
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });

    if (demoToggle) {
        // Auto-fill admin credentials when demo info is shown
        demoToggle.addEventListener('click', () => {
            if (demoInfo.style.display === 'block') {
                document.getElementById('email').value = 'admin@ctms.com';
                document.getElementById('password').value = 'admin123';
            }
        });
    }
});