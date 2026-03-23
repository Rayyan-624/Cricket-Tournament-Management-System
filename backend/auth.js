// auth.js
const API_BASE = 'http://localhost:3000/api';

// Check auth
function checkAuth() {
    const currentUser = localStorage.getItem('ctms_current_user');
    const token = localStorage.getItem('ctms_token');
    if (!currentUser || !token) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Logout
function logout() {
    localStorage.removeItem('ctms_current_user');
    localStorage.removeItem('ctms_token');
    window.location.href = 'login.html';
}

// Get token
function getAuthToken() {
    return localStorage.getItem('ctms_token');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };
    const response = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });
    if (!response.ok) throw new Error('API error: ' + response.status);
    return response.json();
}
