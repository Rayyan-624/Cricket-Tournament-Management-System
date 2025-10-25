// auth.js - Authentication utilities
function checkAuth() {
    const currentUser = localStorage.getItem('ctms_current_user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

function logout() {
    localStorage.removeItem('ctms_current_user');
    window.location.href = 'login.html';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('ctms_current_user') || 'null');
}

// Check if user is authenticated on dashboard pages
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('tournaments.html') ||
    window.location.pathname.includes('teams.html') ||
    window.location.pathname.includes('matches.html') ||
    window.location.pathname.includes('statistics.html')) {
    const user = checkAuth();
    if (user) {
        // Update welcome message with user's name
        const welcomeElement = document.querySelector('.welcome-section h1');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome, ${user.firstName} ${user.lastName}!`;
        }
    }
}