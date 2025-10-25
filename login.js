// login.js - Authentication for login page
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Reset error message
        errorMsg.textContent = '';
        
        // Basic validation
        if (!username || !password) {
            errorMsg.textContent = 'Please fill in all fields';
            return;
        }
        
        // Check if user exists in localStorage
        const users = JSON.parse(localStorage.getItem('ctms_users') || '[]');
        const user = users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );
        
        if (user) {
            // Store current user session
            localStorage.setItem('ctms_current_user', JSON.stringify({
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = 'Invalid username/email or password';
        }
    });
});