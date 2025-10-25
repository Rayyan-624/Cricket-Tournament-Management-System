// dashboard.js - Dashboard specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = JSON.parse(localStorage.getItem('ctms_current_user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update welcome message with user's name
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.firstName} ${user.lastName}!`;
    }
    
    // Load user-specific data
    loadUserData();
});

function loadUserData() {
    // Here you can load user-specific tournaments, matches, etc.
    // For now, we'll just use the static data
    console.log('Loading user data...');
    
    // Simulate live stats updates
    setInterval(() => {
        const liveMatchesElement = document.querySelector('.stat-card:nth-child(3) h3');
        if (liveMatchesElement) {
            const currentCount = parseInt(liveMatchesElement.textContent);
            // Randomly update the live matches count
            const newCount = Math.max(1, (currentCount + Math.floor(Math.random() * 3) - 1) % 12);
            liveMatchesElement.textContent = newCount;
            
            // Add a subtle animation
            liveMatchesElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                liveMatchesElement.style.transform = 'scale(1)';
            }, 300);
        }
    }, 10000);
}

// Add interactive effects for cards
document.addEventListener('DOMContentLoaded', function() {
    // Add click effects to cards
    const cards = document.querySelectorAll('.card, .stat-card, .match-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add hover effects to tournament items
    const tournamentItems = document.querySelectorAll('.tournament-item');
    tournamentItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});