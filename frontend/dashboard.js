// dashboard.js - Dashboard with Advanced DBMS Integration
class DashboardManager {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.stats = {};
        this.recentTournaments = [];
        this.recentMatches = [];
        this.init();
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('ctms_token');
        const user = JSON.parse(localStorage.getItem('ctms_current_user') || '{}');
        
        if (!token || !user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update welcome message
        this.updateWelcomeMessage(user);
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Add interactive effects
        this.addInteractiveEffects();
        
        // Start auto-refresh for live data
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadRecentTournaments(),
                this.loadRecentMatches()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Using sample data.');
            // Load sample data when API fails
            this.loadSampleData();
        }
    }

    // Load sample data when API is unavailable
    loadSampleData() {
        this.stats = {
            total_users: 1,
            total_tournaments: 0,
            total_teams: 0,
            total_matches: 0
        };
        
        this.recentTournaments = [];
        
        this.updateStats();
        this.renderRecentTournaments();
        this.renderRecentMatches();
    }

    // API request helper with authentication
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('ctms_token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        try {
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('ctms_token');
                    localStorage.removeItem('ctms_current_user');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Load dashboard statistics from API
    async loadDashboardStats() {
        try {
            const stats = await this.apiRequest('/dashboard/stats');
            this.stats = stats || {};
            this.updateStats();
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Set default values if API fails
            this.stats = {
                total_users: 1,
                total_tournaments: 0,
                total_teams: 0,
                total_matches: 0
            };
            this.updateStats();
        }
    }

    // Update statistics display
    updateStats() {
        const elements = {
            totalTournaments: this.stats.total_tournaments || 0,
            totalTeams: this.stats.total_teams || 0,
            totalUsers: this.stats.total_users || 1,
            totalMatches: this.stats.total_matches || 0
        };

        // Update DOM elements with animation
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const currentValue = parseInt(element.textContent) || 0;
                const newValue = elements[id];
                
                if (currentValue !== newValue) {
                    this.animateCounter(element, currentValue, newValue);
                }
            }
        });
    }

    // Animate counter from old to new value
    animateCounter(element, start, end) {
        const duration = 1000; // ms
        const steps = 60;
        const stepValue = (end - start) / steps;
        let current = start;
        const stepTime = duration / steps;

        const timer = setInterval(() => {
            current += stepValue;
            if ((stepValue > 0 && current >= end) || (stepValue < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, stepTime);
    }

    // Load recent tournaments from API
    async loadRecentTournaments() {
        try {
            const tournaments = await this.apiRequest('/tournaments');
            // Get latest 3 tournaments sorted by start date
            this.recentTournaments = tournaments
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                .slice(0, 3);
            this.renderRecentTournaments();
        } catch (error) {
            console.error('Error loading recent tournaments:', error);
            this.showTournamentsError();
        }
    }

    // Render recent tournaments
    renderRecentTournaments() {
        const container = document.getElementById('recentTournaments');
        if (!container) return;

        if (this.recentTournaments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <h3>No Tournaments Yet</h3>
                    <p>Get started by creating your first tournament!</p>
                    <button class="btn btn-primary" onclick="window.location.href='tournaments.html'">Create Tournament</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recentTournaments.map(tournament => `
            <div class="tournament-item" data-id="${tournament.tournament_id}">
                <div class="tournament-info">
                    <div class="tournament-header">
                        <h3>
                            <span class="tournament-icon">🏆</span>
                            ${tournament.tournament_name}
                        </h3>
                        <span class="status-badge status-${tournament.status || 'upcoming'}">
                            ${this.capitalizeFirst(tournament.status || 'upcoming')}
                        </span>
                    </div>
                    <div class="tournament-details">
                        <p class="tournament-date">
                            <i class="calendar-icon">📅</i>
                            ${this.formatDate(tournament.start_date)} - ${this.formatDate(tournament.end_date)}
                        </p>
                        <p class="tournament-location">
                            <i class="location-icon">📍</i>
                            ${tournament.venue || 'Venue TBD'}
                        </p>
                        <p class="tournament-teams">
                            <i class="teams-icon">👥</i>
                            ${tournament.total_teams || 0} Teams • ${tournament.format || 'T20'}
                        </p>
                    </div>
                </div>
                <div class="tournament-actions">
                    <a href="tournament-detail.html?id=${tournament.tournament_id}" class="btn btn-primary">
                        ${(tournament.status === 'ongoing') ? 'Manage' : 'View'}
                    </a>
                </div>
            </div>
        `).join('');
    }

    // Load recent matches from API
    async loadRecentMatches() {
        try {
            this.recentMatches = await this.getUpcomingMatches();
            this.renderRecentMatches();
        } catch (error) {
            console.error('Error loading recent matches:', error);
            this.showMatchesError();
        }
    }

    // Get upcoming matches
    async getUpcomingMatches() {
        try {
            const matches = await this.apiRequest('/matches');
            return matches.slice(0, 2);
        } catch (error) {
            // Return empty array if API not available
            return [];
        }
    }

    // Render recent matches
    renderRecentMatches() {
        const container = document.getElementById('recentMatches');
        if (!container) return;

        if (this.recentMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏐</div>
                    <h3>No Upcoming Matches</h3>
                    <p>Matches will appear here once scheduled</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recentMatches.map(match => `
            <div class="match-card" data-id="${match.match_id}">
                <div class="match-header">
                    <span class="match-status ${match.match_status}">
                        ${match.match_status === 'ongoing' ? 'LIVE' : 'UPCOMING'}
                    </span>
                    <span class="match-time">${this.formatMatchDate(match.match_date)}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <div class="team-logo ${this.getTeamAbbreviation(match.team1_name)}"></div>
                        <span class="team-name">${match.team1_name}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <div class="team-logo ${this.getTeamAbbreviation(match.team2_name)}"></div>
                        <span class="team-name">${match.team2_name}</span>
                    </div>
                </div>
                <div class="match-info">
                    <p class="match-venue">
                        <i class="venue-icon">🏟️</i>
                        ${match.venue || 'Venue TBD'}
                    </p>
                </div>
                <div class="match-actions">
                    <button class="btn btn-secondary" onclick="window.location.href='match-detail.html?id=${match.match_id}'">
                        ${match.match_status === 'ongoing' ? 'Live Score' : 'View Details'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update welcome message with user data
    updateWelcomeMessage(user) {
        const welcomeMessage = document.getElementById('welcome-message');
        const userRole = document.getElementById('user-role');
        
        if (welcomeMessage && user) {
            const displayName = user.username || 'User';
            welcomeMessage.textContent = `Welcome back, ${displayName}!`;
        }
        
        if (userRole && user) {
            userRole.textContent = this.capitalizeFirst(user.role || 'user');
        }
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    formatMatchDate(dateTimeString) {
        if (!dateTimeString) return 'Time TBD';
        try {
            const date = new Date(dateTimeString);
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === now.toDateString()) {
                return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            } else if (date.toDateString() === tomorrow.toDateString()) {
                return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            } else {
                return date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            return 'Invalid Date';
        }
    }

    capitalizeFirst(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getTeamAbbreviation(teamName) {
        if (!teamName) return 'default';
        return teamName.split(' ').map(word => word[0]).join('').toLowerCase();
    }

    // Interactive effects
    addInteractiveEffects() {
        const cards = document.querySelectorAll('.stat-card, .tournament-item, .match-card');
        cards.forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
        
        const tournamentItems = document.querySelectorAll('.tournament-item');
        tournamentItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            });
        });

        const liveIndicators = document.querySelectorAll('.match-status.ongoing');
        liveIndicators.forEach(indicator => {
            indicator.style.animation = 'pulse 1.5s infinite';
        });
    }

    // Auto-refresh data every 30 seconds
    startAutoRefresh() {
        setInterval(async () => {
            try {
                await this.loadDashboardStats();
                await this.loadRecentMatches();
                console.log('Dashboard data auto-refreshed at', new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }, 30000);
    }

    // Error handling
    showError(message) {
        console.error('Dashboard Error:', message);
        this.showToast(message, 'error');
    }

    showTournamentsError() {
        const container = document.getElementById('recentTournaments');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load tournaments</p>
                    <button class="btn btn-outline" onclick="dashboardManager.loadRecentTournaments()">Retry</button>
                </div>
            `;
        }
    }

    showMatchesError() {
        const container = document.getElementById('recentMatches');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <p>Failed to load matches</p>
                    <button class="btn btn-outline" onclick="dashboardManager.loadRecentMatches()">Retry</button>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        const existingToasts = document.querySelectorAll('.dashboard-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `dashboard-toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .match-status.ongoing {
        background: #e74c3c;
        animation: pulse 1.5s infinite;
    }
    
    .stat-card, .tournament-item, .match-card {
        transition: all 0.3s ease;
    }
    
    .empty-state, .error-state {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    
    .empty-icon, .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.7;
    }

    .empty-state h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1.2rem;
    }

    .empty-state p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(dashboardStyle);
let dashboardManager;

document.addEventListener('DOMContentLoaded', function() {
    dashboardManager = new DashboardManager();
});