class TournamentManager {
    constructor() {
        this.tournaments = JSON.parse(localStorage.getItem('ctms-tournaments')) || [
            {
                id: this.generateId(),
                name: "PSL 2025",
                startDate: "Oct 25, 2025",
                endDate: "Nov 20, 2025",
                location: "Pakistan",
                teams: 6,
                matches: 35,
                status: "ongoing"
            },
            {
                id: this.generateId(),
                name: "University Cup 2024",
                startDate: "Jan 10, 2024",
                endDate: "Feb 5, 2024",
                location: "Karachi",
                teams: 8,
                matches: 30,
                status: "completed"
            },
            {
                id: this.generateId(),
                name: "T20 Champions League 2026",
                startDate: "Mar 1, 2026",
                endDate: "Apr 15, 2026",
                location: "Lahore",
                teams: 10,
                matches: 45,
                status: "upcoming"
            }
        ];
        
        this.init();
    }

    init() {
        this.renderTournaments();
        this.setupEventListeners();
        this.setMinDates();
        this.createPopupStyles();
    }

    // Create popup styles dynamically
    createPopupStyles() {
        if (document.getElementById('popup-styles')) return;
        
        const styles = `
            .tournament-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: linear-gradient(135deg, #2ECC71, #27AE60);
                color: white;
                padding: 25px 35px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 2000;
                text-align: center;
                opacity: 0;
                transition: all 0.3s ease;
                min-width: 300px;
                border: 3px solid rgba(255,255,255,0.2);
            }
            
            .tournament-popup.delete-popup {
                background: linear-gradient(135deg, #E74C3C, #C0392B);
            }
            
            .tournament-popup.edit-popup {
                background: linear-gradient(135deg, #3498DB, #2980B9);
            }
            
            .tournament-popup.confirm-popup {
                background: linear-gradient(135deg, #F39C12, #E67E22);
                min-width: 350px;
            }
            
            .tournament-popup.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .tournament-popup h3 {
                margin: 0 0 10px 0;
                font-size: 1.4rem;
                font-weight: 600;
            }
            
            .tournament-popup p {
                margin: 0;
                font-size: 1rem;
                opacity: 0.9;
            }
            
            .tournament-popup-icon {
                font-size: 3rem;
                margin-bottom: 15px;
                display: block;
            }
            
            .popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(5px);
                z-index: 1999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .popup-overlay.show {
                opacity: 1;
            }
            
            .popup-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .popup-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 80px;
            }
            
            .popup-btn.confirm {
                background: #E74C3C;
                color: white;
            }
            
            .popup-btn.confirm:hover {
                background: #C0392B;
                transform: translateY(-2px);
            }
            
            .popup-btn.cancel {
                background: #95A5A6;
                color: white;
            }
            
            .popup-btn.cancel:hover {
                background: #7F8C8D;
                transform: translateY(-2px);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'popup-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Show tournament creation popup
    showTournamentPopup(tournamentName, type = 'create') {
        // Create overlay
        let overlay = document.getElementById('popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        
        // Create popup
        let popup = document.getElementById('tournament-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'tournament-popup';
            popup.className = 'tournament-popup';
            document.body.appendChild(popup);
        }
        
        const popupConfig = {
            create: {
                icon: '✔',
                title: 'Tournament Created!',
                message: `"${tournamentName}" has been successfully created`,
                className: ''
            },
            delete: {
                icon: '🗑️',
                title: 'Tournament Deleted!',
                message: `"${tournamentName}" has been successfully deleted`,
                className: 'delete-popup'
            },
            edit: {
                icon: '🖍',
                title: 'Tournament Edited!',
                message: `"${tournamentName}" has been successfully updated`,
                className: 'edit-popup'
            }
        };
        
        const config = popupConfig[type];
        
        popup.className = `tournament-popup ${config.className}`;
        popup.innerHTML = `
            <div class="tournament-popup-icon">${config.icon}</div>
            <h3>${config.title}</h3>
            <p>${config.message}</p>
        `;
        
        // Show popup and overlay
        overlay.classList.add('show');
        popup.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.hideTournamentPopup();
        }, 3000);
        
        // Also hide when clicking overlay
        overlay.addEventListener('click', () => {
            this.hideTournamentPopup();
        });
    }

    // Show confirmation popup for delete
    showDeleteConfirmation(tournamentName, tournamentId) {
        // Create overlay
        let overlay = document.getElementById('popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        
        // Create popup
        let popup = document.getElementById('tournament-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'tournament-popup';
            popup.className = 'tournament-popup confirm-popup';
            document.body.appendChild(popup);
        }
        
        popup.className = 'tournament-popup confirm-popup';
        popup.innerHTML = `
            <div class="tournament-popup-icon">⚠️</div>
            <h3>Delete Tournament</h3>
            <p>Are you sure you want to delete "${tournamentName}"?</p>
            <div class="popup-buttons">
                <button class="popup-btn cancel" onclick="tournamentManager.hideTournamentPopup()">Cancel</button>
                <button class="popup-btn confirm" onclick="tournamentManager.confirmDelete('${tournamentId}')">Delete</button>
            </div>
        `;
        
        // Show popup and overlay
        overlay.classList.add('show');
        popup.classList.add('show');
        
        // Also hide when clicking overlay
        overlay.addEventListener('click', () => {
            this.hideTournamentPopup();
        });
    }

    // Confirm delete action
    confirmDelete(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (tournament) {
            this.tournaments = this.tournaments.filter(t => t.id !== tournamentId);
            this.saveToLocalStorage();
            this.renderTournaments();
            this.hideTournamentPopup();
            this.showTournamentPopup(tournament.name, 'delete');
        }
    }

    // Hide tournament popup
    hideTournamentPopup() {
        const popup = document.getElementById('tournament-popup');
        const overlay = document.getElementById('popup-overlay');
        
        if (popup) {
            popup.classList.remove('show');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        }
        
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // Generate unique ID for tournaments
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('tournamentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Edit form submission
        document.getElementById('editTournamentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditFormSubmit();
        });

        // Start date change listener
        document.getElementById('startDate').addEventListener('change', () => {
            this.updateEndDateMin();
        });

        // Edit start date change listener
        document.getElementById('editStartDate').addEventListener('change', () => {
            this.updateEditEndDateMin();
        });

        // Close modal when clicking outside
        document.getElementById('createTournamentModal').addEventListener('click', (e) => {
            if (e.target.id === 'createTournamentModal') {
                this.closeCreateTournamentModal();
            }
        });

        // Close edit modal when clicking outside
        document.getElementById('editTournamentModal').addEventListener('click', (e) => {
            if (e.target.id === 'editTournamentModal') {
                this.closeEditTournamentModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCreateTournamentModal();
                this.closeEditTournamentModal();
            }
        });
    }

    // Set minimum dates for date inputs
    setMinDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').min = today;
        document.getElementById('editStartDate').min = today;
    }

    // Update end date minimum based on start date
    updateEndDateMin() {
        const startDate = document.getElementById('startDate').value;
        if (startDate) {
            document.getElementById('endDate').min = startDate;
        }
    }

    // Update edit end date minimum based on start date
    updateEditEndDateMin() {
        const startDate = document.getElementById('editStartDate').value;
        if (startDate) {
            document.getElementById('editEndDate').min = startDate;
        }
    }

    // Format date for display
    formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Parse date from display format
    parseDate(displayDate) {
        return new Date(displayDate);
    }

    // Handle form submission
    handleFormSubmit() {
        const name = document.getElementById('tournamentName').value;
        const startDate = this.formatDate(document.getElementById('startDate').value);
        const endDate = this.formatDate(document.getElementById('endDate').value);
        const location = document.getElementById('location').value;
        const teams = parseInt(document.getElementById('teamsCount').value);
        const matches = parseInt(document.getElementById('matchesCount').value);
        const status = document.getElementById('status').value;
        
        const newTournament = {
            id: this.generateId(),
            name,
            startDate,
            endDate,
            location,
            teams,
            matches,
            status
        };
        
        this.addTournament(newTournament);
        this.closeCreateTournamentModal();
        
        // Show the new popup instead of success message
        this.showTournamentPopup(name, 'create');
    }

    // Handle edit form submission
    handleEditFormSubmit() {
        const tournamentId = document.getElementById('editTournamentId').value;
        const name = document.getElementById('editTournamentName').value;
        const startDate = this.formatDate(document.getElementById('editStartDate').value);
        const endDate = this.formatDate(document.getElementById('editEndDate').value);
        const location = document.getElementById('editLocation').value;
        const teams = parseInt(document.getElementById('editTeamsCount').value);
        const matches = parseInt(document.getElementById('editMatchesCount').value);
        const status = document.getElementById('editStatus').value;
        
        const updatedTournament = {
            id: tournamentId,
            name,
            startDate,
            endDate,
            location,
            teams,
            matches,
            status
        };
        
        this.updateTournament(updatedTournament);
        this.closeEditTournamentModal();
        this.showTournamentPopup(name, 'edit');
    }

    // Add new tournament
    addTournament(tournamentData) {
        this.tournaments.push(tournamentData);
        this.saveToLocalStorage();
        this.renderTournaments();
        
        // Highlight the new tournament
        this.highlightNewTournament();
    }

    // Update existing tournament
    updateTournament(updatedTournament) {
        const index = this.tournaments.findIndex(t => t.id === updatedTournament.id);
        if (index !== -1) {
            this.tournaments[index] = updatedTournament;
            this.saveToLocalStorage();
            this.renderTournaments();
        }
    }

    // Save tournaments to localStorage
    saveToLocalStorage() {
        localStorage.setItem('ctms-tournaments', JSON.stringify(this.tournaments));
    }

    // Highlight newly added tournament
    highlightNewTournament() {
        const newCard = document.querySelector('.tournament-card:last-child');
        if (newCard) {
            newCard.classList.add('new-tournament');
            
            setTimeout(() => {
                newCard.classList.remove('new-tournament');
            }, 2000);
        }
    }

    // Render all tournaments
    renderTournaments() {
        const container = document.getElementById('tournamentsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.tournaments.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = '';
        
        this.tournaments.forEach(tournament => {
            const card = this.createTournamentCard(tournament);
            container.appendChild(card);
        });
    }

    // Create tournament card element
    createTournamentCard(tournament) {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.setAttribute('data-id', tournament.id);
        
        const statusClass = `status-${tournament.status}`;
        const statusText = tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1);
        
        card.innerHTML = `
            <div class="tournament-header">
                <h3>${tournament.name}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="tournament-details">
                <p><strong>Dates:</strong> ${tournament.startDate} - ${tournament.endDate}</p>
                <p><strong>Location:</strong> ${tournament.location}</p>
                <p><strong>Teams:</strong> ${tournament.teams}</p>
                <p><strong>Matches:</strong> ${tournament.matches}</p>
            </div>
            <div class="tournament-actions">
                <a href="tournament-detail.html?id=${tournament.id}" class="btn btn-primary">${tournament.status === 'completed' ? 'View' : 'Manage'}</a>
                <button class="btn btn-outline" onclick="tournamentManager.editTournament('${tournament.id}')">Edit</button>
                <button class="btn btn-outline" onclick="tournamentManager.deleteTournament('${tournament.id}')">Delete</button>
            </div>
        `;
        
        return card;
    }

    // Edit tournament
    editTournament(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (tournament) {
            this.openEditTournamentModal(tournament);
        }
    }

    // Open edit tournament modal
    openEditTournamentModal(tournament) {
        // Convert display dates back to input format
        const startDateInput = this.parseDate(tournament.startDate).toISOString().split('T')[0];
        const endDateInput = this.parseDate(tournament.endDate).toISOString().split('T')[0];
        
        // Fill the form with current tournament data
        document.getElementById('editTournamentId').value = tournament.id;
        document.getElementById('editTournamentName').value = tournament.name;
        document.getElementById('editStartDate').value = startDateInput;
        document.getElementById('editEndDate').value = endDateInput;
        document.getElementById('editLocation').value = tournament.location;
        document.getElementById('editTeamsCount').value = tournament.teams;
        document.getElementById('editMatchesCount').value = tournament.matches;
        document.getElementById('editStatus').value = tournament.status;
        
        // Show the modal
        document.getElementById('editTournamentModal').style.display = 'block';
        document.getElementById('editTournamentName').focus();
    }

    // Close edit tournament modal
    closeEditTournamentModal() {
        document.getElementById('editTournamentModal').style.display = 'none';
        document.getElementById('editTournamentForm').reset();
    }

    // Delete tournament
    deleteTournament(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (tournament) {
            // Show confirmation popup instead of browser confirm
            this.showDeleteConfirmation(tournament.name, tournamentId);
        }
    }

    // Show success message (kept for compatibility)
    showSuccessMessage(message) {
        // Create or get success message element
        let successMsg = document.getElementById('successMessage');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.id = 'successMessage';
            successMsg.className = 'success-message';
            document.body.appendChild(successMsg);
        }
        
        successMsg.textContent = message;
        successMsg.classList.add('show');
        
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    }

    // Modal functions
    openCreateTournamentModal() {
        document.getElementById('createTournamentModal').style.display = 'block';
        document.getElementById('tournamentName').focus();
    }

    closeCreateTournamentModal() {
        document.getElementById('createTournamentModal').style.display = 'none';
        document.getElementById('tournamentForm').reset();
    }
}

// Initialize Tournament Manager when DOM is loaded
let tournamentManager;

document.addEventListener('DOMContentLoaded', function() {
    tournamentManager = new TournamentManager();
});

// Global functions for HTML onclick attributes
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

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }

}