// tournaments.js - Tournament Management with Proper Backend Integration
class TournamentManager {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.tournaments = [];
        this.currentEditingTournament = null;
        this.init();
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('ctms_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        this.setMinDates();
        this.setupEventListeners();
        this.createPopupStyles();
        
        // Load tournaments
        await this.loadTournaments();
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
            console.log(`Making API request to: ${this.API_BASE}${endpoint}`);
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('ctms_token');
                    localStorage.removeItem('ctms_current_user');
                    window.location.href = 'login.html';
                    return;
                }
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async loadTournaments() {
        try {
            console.log('Loading tournaments from API...');
            const tournaments = await this.apiRequest('/tournaments');
            this.tournaments = tournaments;
            this.renderTournaments();
            console.log(`✅ Loaded ${tournaments.length} tournaments successfully`);
        } catch (err) {
            console.error('Error loading tournaments from API:', err);
            this.showErrorPopup('Failed to load tournaments. Please check if the server is running on port 5000.');
        }
    }

    setupEventListeners() {
        // Form submissions
        const tournamentForm = document.getElementById('tournamentForm');
        const editTournamentForm = document.getElementById('editTournamentForm');
        
        if (tournamentForm) {
            tournamentForm.addEventListener('submit', e => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        if (editTournamentForm) {
            editTournamentForm.addEventListener('submit', e => {
                e.preventDefault();
                this.handleEditFormSubmit();
            });
        }

        // Date validation
        ['startDate','endDate','editStartDate','editEndDate'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    if(id.includes('edit')) {
                        this.validateDates('editStartDate','editEndDate');
                    } else {
                        this.validateDates('startDate','endDate');
                    }
                });
            }
        });

        // Close modal when clicking outside
        ['createTournamentModal','editTournamentModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', e => {
                    if(e.target.id === modalId) {
                        this[`close${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`]();
                    }
                });
            }
        });

        // Escape key closes modals
        document.addEventListener('keydown', e => {
            if(e.key === 'Escape') this.closeAllModals();
        });

        // Search functionality
        const searchInput = document.getElementById('tournamentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTournaments(e.target.value);
            });
        }
    }

    closeAllModals() {
        this.closeCreateTournamentModal();
        this.closeEditTournamentModal();
    }

    setMinDates() {
        const today = new Date().toISOString().split('T')[0];
        ['startDate','endDate','editStartDate','editEndDate'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.min = today;
            }
        });
    }

    validateDates(startId, endId) {
        const startElement = document.getElementById(startId);
        const endElement = document.getElementById(endId);
        
        if (startElement && endElement) {
            const start = startElement.value;
            const end = endElement.value;
            
            if(start && end) {
                if(new Date(start) > new Date(end)) {
                    endElement.setCustomValidity('End date must be after start date');
                } else {
                    endElement.setCustomValidity('');
                }
            }
        }
    }

    async handleFormSubmit() {
        const name = document.getElementById('tournamentName').value;
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        const venue = document.getElementById('location').value;
        const format = document.getElementById('format').value;
        const status = document.getElementById('status').value;

        // Validation
        if (!name || !start || !end || !venue) {
            this.showErrorPopup('Please fill in all required fields');
            return;
        }

        if(new Date(start) > new Date(end)) {
            this.showErrorPopup('End date must be after start date');
            return;
        }

        try {
            const tournamentData = {
                tournament_name: name,
                start_date: start,
                end_date: end,
                venue: venue,
                format: format,
                status: status
            };

            console.log('Creating tournament:', tournamentData);
            
            const newTournament = await this.apiRequest('/tournaments', {
                method: 'POST',
                body: JSON.stringify(tournamentData)
            });

            await this.loadTournaments();
            this.closeCreateTournamentModal();
            this.showSuccessPopup(`Tournament "${name}" created successfully!`);
            
        } catch(err) {
            console.error('Error creating tournament:', err);
            this.showErrorPopup(`Failed to create tournament: ${err.message}`);
        }
    }

    async handleEditFormSubmit() {
        const id = document.getElementById('editTournamentId').value;
        const name = document.getElementById('editTournamentName').value;
        const start = document.getElementById('editStartDate').value;
        const end = document.getElementById('editEndDate').value;
        const venue = document.getElementById('editLocation').value;
        const format = document.getElementById('editFormat').value;
        const status = document.getElementById('editStatus').value;

        if (!name || !start || !end || !venue) {
            this.showErrorPopup('Please fill in all required fields');
            return;
        }

        if(new Date(start) > new Date(end)) {
            this.showErrorPopup('End date must be after start date');
            return;
        }

        try {
            const tournamentData = {
                tournament_name: name,
                start_date: start,
                end_date: end,
                venue: venue,
                format: format,
                status: status
            };

            console.log('Updating tournament:', id, tournamentData);

            await this.apiRequest(`/tournaments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(tournamentData)
            });

            await this.loadTournaments();
            this.closeEditTournamentModal();
            this.showSuccessPopup(`Tournament "${name}" updated successfully!`);
            
        } catch(err) {
            console.error('Error updating tournament:', err);
            this.showErrorPopup(`Failed to update tournament: ${err.message}`);
        }
    }

    renderTournaments() {
        const container = document.getElementById('tournamentsContainer');
        const emptyState = document.getElementById('emptyState');

        if(!container) return;

        if(this.tournaments.length === 0) {
            container.style.display = 'none';
            if(emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🏆</div>
                        <h3>No Tournaments Yet</h3>
                        <p>Get started by creating your first tournament!</p>
                        <button class="btn btn-primary" onclick="openCreateTournamentModal()">Create Tournament</button>
                    </div>
                `;
            }
            return;
        }

        container.style.display = 'grid';
        if(emptyState) emptyState.style.display = 'none';
        container.innerHTML = '';

        this.tournaments.forEach(t => container.appendChild(this.createTournamentCard(t)));
    }

    createTournamentCard(t) {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.setAttribute('data-id', t.tournament_id);

        const statusClass = `status-${t.status || 'upcoming'}`;
        const statusText = this.capitalizeFirst(t.status || 'upcoming');

        card.innerHTML = `
            <div class="tournament-header">
                <div class="tournament-title">
                    <h3>${t.tournament_name}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="tournament-meta">
                    <span class="tournament-format">${t.format || 'T20'}</span>
                </div>
            </div>
            <div class="tournament-details">
                <div class="detail-item">
                    <span class="detail-icon">📅</span>
                    <span class="detail-text">
                        ${this.formatDate(t.start_date)} - ${this.formatDate(t.end_date)}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">📍</span>
                    <span class="detail-text">${t.venue || 'Venue TBD'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">👥</span>
                    <span class="detail-text">${t.total_teams || 0} Teams</span>
                </div>
                ${t.created_by_name ? `
                <div class="detail-item">
                    <span class="detail-icon">👤</span>
                    <span class="detail-text">Created by ${t.created_by_name}</span>
                </div>
                ` : ''}
            </div>
            <div class="tournament-actions">
                <a href="tournament-detail.html?id=${t.tournament_id}" class="btn btn-primary">
                    ${(t.status === 'ongoing') ? 'Manage' : 'View Details'}
                </a>
                <button class="btn btn-outline" onclick="tournamentManager.editTournament('${t.tournament_id}')">
                    Edit
                </button>
                <button class="btn btn-danger" onclick="tournamentManager.deleteTournament('${t.tournament_id}')">
                    Delete
                </button>
            </div>
        `;
        return card;
    }

    // Filter tournaments by search term
    filterTournaments(searchTerm) {
        const filteredTournaments = this.tournaments.filter(tournament => 
            tournament.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tournament.venue && tournament.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (tournament.format && tournament.format.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderFilteredTournaments(filteredTournaments);
    }

    renderFilteredTournaments(filteredTournaments) {
        const container = document.getElementById('tournamentsContainer');
        const emptyState = document.getElementById('emptyState');

        if(!container) return;

        if(filteredTournaments.length === 0) {
            container.style.display = 'none';
            if(emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No tournaments found</h3>
                        <p>Try adjusting your search terms</p>
                    </div>
                `;
            }
            return;
        }

        container.style.display = 'grid';
        if(emptyState) emptyState.style.display = 'none';
        container.innerHTML = '';

        filteredTournaments.forEach(t => container.appendChild(this.createTournamentCard(t)));
    }

    editTournament(id) {
        const tournament = this.tournaments.find(t => t.tournament_id == id);
        if(tournament) {
            this.openEditTournamentModal(tournament);
        }
    }

    async deleteTournament(id) {
        const tournament = this.tournaments.find(t => t.tournament_id == id);
        if(!tournament) return;

        if(confirm(`Are you sure you want to delete "${tournament.tournament_name}"? This action cannot be undone.`)) {
            try {
                await this.apiRequest(`/tournaments/${id}`, {
                    method: 'DELETE'
                });

                await this.loadTournaments();
                this.showSuccessPopup(`Tournament "${tournament.tournament_name}" deleted successfully!`);
                
            } catch(err) {
                console.error('Error deleting tournament:', err);
                this.showErrorPopup(`Failed to delete tournament: ${err.message}`);
            }
        }
    }

    formatDate(date) {
        if(!date) return 'TBD';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short', 
                day: 'numeric', 
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    capitalizeFirst(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    openCreateTournamentModal() {
        const modal = document.getElementById('createTournamentModal');
        if (modal) {
            modal.style.display = 'block';
            
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const startDateElement = document.getElementById('startDate');
            const endDateElement = document.getElementById('endDate');
            
            if (startDateElement) startDateElement.value = today;
            if (endDateElement) endDateElement.value = nextWeek;
            
            const tournamentNameElement = document.getElementById('tournamentName');
            if (tournamentNameElement) tournamentNameElement.focus();
        }
    }

    closeCreateTournamentModal() {
        const modal = document.getElementById('createTournamentModal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('tournamentForm');
            if (form) form.reset();
        }
    }

    openEditTournamentModal(tournament) {
        this.currentEditingTournament = tournament;

        document.getElementById('editTournamentId').value = tournament.tournament_id;
        document.getElementById('editTournamentName').value = tournament.tournament_name;
        document.getElementById('editStartDate').value = tournament.start_date;
        document.getElementById('editEndDate').value = tournament.end_date;
        document.getElementById('editLocation').value = tournament.venue || '';
        document.getElementById('editFormat').value = tournament.format || 'T20';
        document.getElementById('editStatus').value = tournament.status || 'upcoming';

        const modal = document.getElementById('editTournamentModal');
        if (modal) {
            modal.style.display = 'block';
            const editTournamentNameElement = document.getElementById('editTournamentName');
            if (editTournamentNameElement) editTournamentNameElement.focus();
        }
    }

    closeEditTournamentModal() {
        const modal = document.getElementById('editTournamentModal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('editTournamentForm');
            if (form) form.reset();
            this.currentEditingTournament = null;
        }
    }

    createPopupStyles() {
        if(document.getElementById('tournament-popup-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tournament-popup-styles';
        style.textContent = `
            .tournament-popup {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 1100;
                color: white;
                font-weight: 500;
                transform: translateX(150%);
                transition: transform 0.4s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 400px;
            }
            
            .tournament-success-popup {
                background: linear-gradient(135deg, #2ecc71, #27ae60);
            }
            
            .tournament-error-popup {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            
            .tournament-popup.show {
                transform: translateX(0);
            }

            .tournament-card {
                transition: all 0.3s ease;
            }

            .tournament-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }

            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }

            .status-upcoming { background: #3498db; color: white; }
            .status-ongoing { background: #2ecc71; color: white; }
            .status-completed { background: #95a5a6; color: white; }
            .status-cancelled { background: #e74c3c; color: white; }

            .empty-state {
                text-align: center;
                padding: 3rem 2rem;
                color: white;
            }

            .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }

            .empty-state h3 {
                margin: 0 0 10px 0;
                color: white;
                font-size: 1.5rem;
            }

            .empty-state p {
                margin: 0 0 20px 0;
                color: rgba(255,255,255,0.8);
                font-size: 1rem;
            }

            .tournament-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
            }

            .tournament-title h3 {
                margin: 0 0 5px 0;
                color: white;
            }

            .tournament-meta {
                font-size: 0.9rem;
                color: #848b8cff;
                font-weight: bold;
            }

            .detail-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                font-size: 0.9rem;
            }

            .detail-icon {
                margin-right: 8px;
                width: 20px;
                text-align: center;
            }

            .detail-text {
                color: #555;
            }
        `;
        document.head.appendChild(style);
    }

    showSuccessPopup(message) {
        this.showPopup(message, 'success');
    }

    showErrorPopup(message) {
        this.showPopup(message, 'error');
    }

    showPopup(message, type = 'success') {
        // Remove existing popups
        const existingPopups = document.querySelectorAll('.tournament-popup');
        existingPopups.forEach(popup => popup.remove());

        const popup = document.createElement('div');
        popup.className = `tournament-popup tournament-${type}-popup`;
        popup.textContent = message;
        
        document.body.appendChild(popup);

        // Trigger animation
        setTimeout(() => popup.classList.add('show'), 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 400);
        }, 3000);
    }
}

// Initialize Tournament Manager
let tournamentManager;

document.addEventListener('DOMContentLoaded', () => {
    tournamentManager = new TournamentManager();
});

// Global functions for onclick attributes
function openCreateTournamentModal() {
    if (tournamentManager) {
        tournamentManager.openCreateTournamentModal();
    }
}

function closeCreateTournamentModal() {
    if (tournamentManager) {
        tournamentManager.closeCreateTournamentModal();
    }
}

function closeEditTournamentModal() {
    if (tournamentManager) {
        tournamentManager.closeEditTournamentModal();
    }
}