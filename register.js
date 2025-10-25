// Form validation and modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const modal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close');
    
    // Close modal when X is clicked
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Get form values
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const username = document.getElementById('username').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        
        let isValid = true;
        
        // Validate first name
        if (firstName === '') {
            document.getElementById('firstNameError').textContent = 'First name is required';
            isValid = false;
        }
        
        // Validate last name
        if (lastName === '') {
            document.getElementById('lastNameError').textContent = 'Last name is required';
            isValid = false;
        }
        
        // Validate username
        if (username === '') {
            document.getElementById('usernameError').textContent = 'Username is required';
            isValid = false;
        }
        
        // Validate contact number
        if (contact === '') {
            document.getElementById('contactError').textContent = 'Contact number is required';
            isValid = false;
        } else if (!/^\d{10,}$/.test(contact)) {
            document.getElementById('contactError').textContent = 'Please enter a valid contact number';
            isValid = false;
        }
        
        // Validate email
        if (email === '') {
            document.getElementById('emailError').textContent = 'Email is required';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            document.getElementById('emailError').textContent = 'Please enter a valid email address';
            isValid = false;
        }
        
        // Validate password
        if (password === '') {
            document.getElementById('passwordError').textContent = 'Password is required';
            isValid = false;
        } else if (password.length < 8) {
            document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
            isValid = false;
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
            document.getElementById('passwordError').textContent = 'Password must contain letters, numbers, and symbols';
            isValid = false;
        }
        
        // Validate confirm password
        if (confirmPassword === '') {
            document.getElementById('confirmPasswordError').textContent = 'Please confirm your password';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
            isValid = false;
        }
        
        // Check if username or email already exists
        const users = JSON.parse(localStorage.getItem('ctms_users') || '[]');
        if (users.find(u => u.username === username)) {
            document.getElementById('usernameError').textContent = 'Username already exists';
            isValid = false;
        }
        if (users.find(u => u.email === email)) {
            document.getElementById('emailError').textContent = 'Email already registered';
            isValid = false;
        }
        
        // Validate terms
        if (!terms) {
            document.getElementById('termsError').textContent = 'You must agree to the terms and conditions';
            isValid = false;
        }
        
        // If form is valid, save user and show success modal
        if (isValid) {
            // Save user to localStorage
            const newUser = {
                firstName,
                lastName,
                username,
                contact,
                email,
                password, // In real app, this should be hashed
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('ctms_users', JSON.stringify(users));
            
            // Store current user session
            localStorage.setItem('ctms_current_user', JSON.stringify({
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }));
            
            modal.style.display = 'flex';
        }
    });
    
    // Redirect to login when "Continue to Login" is clicked
    document.querySelector('.modal-footer .btn').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'login.html';
    });

});