class MatchManager {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.matches = [];
        this.filteredMatches = [];
        this.tournaments = [];
        this.teams = [];
        this.filters = {
            tournament: '',
            status: '',
            date: ''
        };
        this.init();
    }

    async init() {
        // Check authentication first
        const token = localStorage.getItem('ctms_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadTournaments();
        await this.loadTeams();
        await this.loadMatches();
        this.setupEventListeners();
        this.populateFilters();
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
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
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
            const tournaments = await this.apiRequest('/tournaments');
            this.tournaments = tournaments;
            this.populateTournamentSelects();
        } catch (error) {
            console.error('Error loading tournaments:', error);
            this.showError('Failed to load tournaments. Please check your connection and try again.');
        }
    }

    async loadTeams() {
        try {
            const teams = await this.apiRequest('/teams');
            this.teams = teams;
            this.populateTeamSelects();
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showError('Failed to load teams');
        }
    }

    async loadMatches() {
        this.showLoading(true);
        try {
            const matches = await this.apiRequest('/matches');
            this.matches = matches;
            this.filteredMatches = [...matches];
            this.renderMatches();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading matches:', error);
            this.showError('Failed to load matches');
            this.showLoading(false);
        }
    }

    populateTournamentSelects() {
        const tournamentSelect = document.getElementById('tournamentSelect');
        const editTournamentSelect = document.getElementById('editTournamentSelect');
        const tournamentFilter = document.getElementById('tournamentFilter');
        
        if (tournamentSelect) {
            tournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
            this.tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.tournament_id;
                option.textContent = tournament.tournament_name;
                tournamentSelect.appendChild(option);
            });
        }
        
        if (editTournamentSelect) {
            editTournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
            this.tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.tournament_id;
                option.textContent = tournament.tournament_name;
                editTournamentSelect.appendChild(option);
            });
        }
        
        if (tournamentFilter) {
            tournamentFilter.innerHTML = '<option value="">All Tournaments</option>';
            this.tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.tournament_id;
                option.textContent = tournament.tournament_name;
                tournamentFilter.appendChild(option);
            });
        }
    }

    populateTeamSelects() {
        const team1Select = document.getElementById('team1Select');
        const team2Select = document.getElementById('team2Select');
        const editTeam1Select = document.getElementById('editTeam1Select');
        const editTeam2Select = document.getElementById('editTeam2Select');
        
        if (team1Select && team2Select) {
            team1Select.innerHTML = '<option value="">Select Team 1</option>';
            team2Select.innerHTML = '<option value="">Select Team 2</option>';
            
            // Get selected tournament
            const tournamentSelect = document.getElementById('tournamentSelect');
            const selectedTournamentId = tournamentSelect ? tournamentSelect.value : null;
            
            // Filter teams by tournament if a tournament is selected
            let teamsToShow = this.teams;
            if (selectedTournamentId) {
                teamsToShow = this.teams.filter(team => team.tournament_id == selectedTournamentId);
            }
            
            teamsToShow.forEach(team => {
                const option1 = document.createElement('option');
                option1.value = team.team_id;
                option1.textContent = team.team_name;
                team1Select.appendChild(option1.cloneNode(true));
                
                const option2 = option1.cloneNode(true);
                team2Select.appendChild(option2);
            });
        }

        if (editTeam1Select && editTeam2Select) {
            editTeam1Select.innerHTML = '<option value="">Select Team 1</option>';
            editTeam2Select.innerHTML = '<option value="">Select Team 2</option>';
            
            this.teams.forEach(team => {
                const option1 = document.createElement('option');
                option1.value = team.team_id;
                option1.textContent = team.team_name;
                editTeam1Select.appendChild(option1.cloneNode(true));
                
                const option2 = option1.cloneNode(true);
                editTeam2Select.appendChild(option2);
            });
        }
    }

    populateFilters() {
        // Filters are populated in populateTournamentSelects
    }

    setupEventListeners() {
        const matchForm = document.getElementById('matchForm');
        if (matchForm) {
            matchForm.addEventListener('submit', (e) => this.handleMatchFormSubmit(e));
        }

        const editMatchForm = document.getElementById('editMatchForm');
        if (editMatchForm) {
            editMatchForm.addEventListener('submit', (e) => this.handleEditMatchFormSubmit(e));
        }

        // Update teams when tournament selection changes
        const tournamentSelect = document.getElementById('tournamentSelect');
        if (tournamentSelect) {
            tournamentSelect.addEventListener('change', () => {
                this.populateTeamSelects();
            });
        }

        // Filter functionality
        const tournamentFilter = document.getElementById('tournamentFilter');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        if (tournamentFilter) {
            tournamentFilter.addEventListener('change', () => this.filterMatches());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterMatches());
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterMatches());
        }
    }

    async handleMatchFormSubmit(e) {
        e.preventDefault();
        
        // Get team names from the select elements
        const team1Select = document.getElementById('team1Select');
        const team2Select = document.getElementById('team2Select');
        const team1Name = team1Select.options[team1Select.selectedIndex].text;
        const team2Name = team2Select.options[team2Select.selectedIndex].text;
        
        const formData = {
            team1: team1Name,
            team2: team2Name,
            matchDate: document.getElementById('matchDateTime').value,
            venue: document.getElementById('venue').value,
            matchType: document.getElementById('matchType').value
        };
        
        console.log('📤 Sending match data:', formData);
        
        // Validation
        if (!formData.team1 || !formData.team2 || !formData.matchDate || !formData.venue || !formData.matchType) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (formData.team1 === formData.team2) {
            this.showError('Team 1 and Team 2 cannot be the same');
            return;
        }
        
        try {
            const result = await this.apiRequest('/matches', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.showMessage('Match scheduled successfully!', 'success');
            this.closeCreateMatchModal();
            
            // Reload matches to show the new one
            await this.loadMatches();
            
        } catch (error) {
            console.error('Error creating match:', error);
            this.showError('Failed to schedule match: ' + error.message);
        }
    }

    async handleEditMatchFormSubmit(e) {
        e.preventDefault();
        
        const matchId = document.getElementById('editMatchId').value;
        const formData = {
            tournament_id: document.getElementById('editTournamentSelect').value,
            team1_id: document.getElementById('editTeam1Select').value,
            team2_id: document.getElementById('editTeam2Select').value,
            match_date: document.getElementById('editMatchDateTime').value,
            venue: document.getElementById('editVenue').value,
            match_type: document.getElementById('editMatchType').value,
            match_status: document.getElementById('editMatchStatus').value
        };
        
        // Validation
        if (!formData.tournament_id || !formData.team1_id || !formData.team2_id || !formData.match_date || !formData.venue) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (formData.team1_id === formData.team2_id) {
            this.showError('Team 1 and Team 2 cannot be the same');
            return;
        }
        
        try {
            await this.apiRequest(`/matches/${matchId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            this.showMessage('Match updated successfully!', 'success');
            this.closeEditMatchModal();
            
            // Reload matches to show the updated one
            await this.loadMatches();
            
        } catch (error) {
            console.error('Error updating match:', error);
            this.showError('Failed to update match: ' + error.message);
        }
    }

    renderMatches() {
        const container = document.getElementById('matchesContainer');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');
        
        if (!container) return;
        
        if (this.filteredMatches.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            loadingState.style.display = 'none';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        loadingState.style.display = 'none';
        
        container.innerHTML = '';
        
        this.filteredMatches.forEach(match => {
            const card = this.createMatchCard(match);
            container.appendChild(card);
        });
    }

    createMatchCard(match) {
        const card = document.createElement('div');
        card.className = `match-card ${match.match_status}`;
        
        const team1 = this.teams.find(t => t.team_id == match.team1_id);
        const team2 = this.teams.find(t => t.team_id == match.team2_id);
        const tournament = this.tournaments.find(t => t.tournament_id == match.tournament_id);
        
        const team1Name = team1 ? team1.team_name : 'Team 1';
        const team2Name = team2 ? team2.team_name : 'Team 2';
        const tournamentName = tournament ? tournament.tournament_name : 'No Tournament';
        
        const team1Abbr = this.getTeamAbbreviation(team1Name);
        const team2Abbr = this.getTeamAbbreviation(team2Name);
        
        const isLive = match.match_status === 'ongoing';
        const isCompleted = match.match_status === 'completed';
        const isScheduled = match.match_status === 'scheduled';
        
        // Handle missing columns gracefully
        const team1Score = match.team1_score !== undefined ? match.team1_score : '0';
        const team2Score = match.team2_score !== undefined ? match.team2_score : '0';
        const team1Wickets = match.team1_wickets !== undefined ? match.team1_wickets : '0';
        const team2Wickets = match.team2_wickets !== undefined ? match.team2_wickets : '0';
        const winnerName = match.winner_name || '';
        const manOfMatch = match.man_of_the_match || '';
        
        card.innerHTML = `
            <div class="match-header">
                <div class="match-tournament">${tournamentName}</div>
                <div class="match-type">${this.formatMatchType(match.match_type)}</div>
            </div>
            
            <div class="match-teams">
                <div class="team">
                    <div class="team-logo ${team1Abbr}"></div>
                    <div class="team-name">${team1Name}</div>
                    ${isCompleted ? `<div class="team-score">${team1Score}/${team1Wickets}</div>` : ''}
                </div>
                
                <div class="vs-container">
                    <div class="vs">VS</div>
                    <div class="match-status status-${match.match_status}">
                        ${isLive ? '<span class="live-indicator"><span class="live-dot"></span> LIVE</span>' : match.match_status}
                    </div>
                </div>
                
                <div class="team">
                    <div class="team-logo ${team2Abbr}"></div>
                    <div class="team-name">${team2Name}</div>
                    ${isCompleted ? `<div class="team-score">${team2Score}/${team2Wickets}</div>` : ''}
                </div>
            </div>
            
            ${isCompleted && winnerName ? `
                <div class="match-result winner">
                    🏆 ${winnerName} won the match
                    ${manOfMatch ? `<br><small>Man of the Match: ${manOfMatch}</small>` : ''}
                </div>
            ` : ''}
            
            <div class="match-info">
                <div class="match-info-item">
                    <i>📅</i>
                    <span>${this.formatMatchDate(match.match_date)}</span>
                </div>
                <div class="match-info-item">
                    <i>📍</i>
                    <span>${match.venue || 'TBD'}</span>
                </div>
                <div class="match-info-item">
                    <i>⏰</i>
                    <span>${this.formatMatchTime(match.match_date)}</span>
                </div>
                <div class="match-info-item">
                    <i>🏆</i>
                    <span>${match.match_type || 'Group Stage'}</span>
                </div>
            </div>
            
            <div class="match-actions">
                ${isLive ? `
                    <button class="btn btn-primary" onclick="matchManager.startLiveScoring(${match.match_id})">
                        Live Scoring
                    </button>
                ` : ''}
                
                ${isScheduled ? `
                    <button class="btn btn-secondary" onclick="matchManager.startMatch(${match.match_id})">
                        Start Match
                    </button>
                ` : ''}
                
                <button class="btn btn-outline" onclick="matchManager.editMatch('${match.match_id}')">
                    Edit
                </button>
                
                <button class="btn btn-outline" onclick="matchManager.deleteMatch('${match.match_id}')">
                    Delete
                </button>
            </div>
        `;
        
        return card;
    }

    filterMatches() {
        const tournamentFilter = document.getElementById('tournamentFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        this.filters = {
            tournament: tournamentFilter,
            status: statusFilter,
            date: dateFilter
        };
        
        this.filteredMatches = this.matches.filter(match => {
            let passesTournament = true;
            let passesStatus = true;
            let passesDate = true;
            
            if (tournamentFilter) {
                passesTournament = match.tournament_id == tournamentFilter;
            }
            
            if (statusFilter) {
                passesStatus = match.match_status === statusFilter;
            }
            
            if (dateFilter) {
                const matchDate = new Date(match.match_date).toDateString();
                const filterDate = new Date(dateFilter).toDateString();
                passesDate = matchDate === filterDate;
            }
            
            return passesTournament && passesStatus && passesDate;
        });
        
        this.renderMatches();
    }

    // Live Scoring Function
    startLiveScoring(matchId) {
        const match = this.matches.find(m => m.match_id == matchId);
        if (!match) {
            this.showError('Match not found');
            return;
        }

        const team1 = this.teams.find(t => t.team_id == match.team1_id);
        const team2 = this.teams.find(t => t.team_id == match.team2_id);
        const tournament = this.tournaments.find(t => t.tournament_id == match.tournament_id);

        // Build URL parameters for live scoring
        const params = new URLSearchParams({
            matchId: matchId,
            team1: team1 ? team1.team_name : 'Team 1',
            team2: team2 ? team2.team_name : 'Team 2',
            tournament: tournament ? tournament.tournament_name : 'Tournament',
            venue: match.venue || 'Venue'
        });

        // Redirect to live scoring page
        window.location.href = `live-scoring.html?${params.toString()}`;
    }

    clearFilters() {
        document.getElementById('tournamentFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';
        this.filterMatches();
    }

    // UPDATED: Improved startMatch function
    async startMatch(matchId) {
    try {
        const match = this.matches.find(m => m.match_id == matchId);
        if (!match) {
            this.showError('Match not found');
            return;
        }

        // Get team names for the request
        const team1 = this.teams.find(t => t.team_id == match.team1_id);
        const team2 = this.teams.find(t => t.team_id == match.team2_id);

        // Format date for MySQL (convert from ISO to MySQL datetime format)
        const formatDateForMySQL = (dateString) => {
            if (!dateString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            try {
                const date = new Date(dateString);
                return date.toISOString().slice(0, 19).replace('T', ' ');
            } catch (error) {
                console.error('Error formatting date:', error);
                return new Date().toISOString().slice(0, 19).replace('T', ' ');
            }
        };

        // Prepare match data with field names that match the server expectations
        const matchData = {
            // Use field names that match the server's PUT endpoint
            team1: team1 ? team1.team_name : 'Team 1',
            team2: team2 ? team2.team_name : 'Team 2',
            matchDate: formatDateForMySQL(match.match_date),
            venue: match.venue || 'TBD',
            matchType: match.match_type || 'group',
            status: 'ongoing'
        };

        console.log('📤 Sending match update data:', matchData);

        // Update match status to ongoing
        await this.apiRequest(`/matches/${matchId}`, {
            method: 'PUT',
            body: JSON.stringify(matchData)
        });

        this.showMessage('Match started! Redirecting to live scoring...', 'success');
        
        // Use the new startLiveScoring function
        this.startLiveScoring(matchId);
        
        // Reload matches
        await this.loadMatches();
        
    } catch (error) {
        console.error('Error starting match:', error);
        this.showError('Failed to start match: ' + error.message);
    }
}

    editMatch(matchId) {
        const match = this.matches.find(m => m.match_id == matchId);
        if (match) {
            this.openEditMatchModal(match);
        }
    }

    openEditMatchModal(match) {
        document.getElementById('editMatchId').value = match.match_id;
        document.getElementById('editTournamentSelect').value = match.tournament_id;
        document.getElementById('editTeam1Select').value = match.team1_id;
        document.getElementById('editTeam2Select').value = match.team2_id;
        document.getElementById('editMatchDateTime').value = match.match_date.replace(' ', 'T');
        document.getElementById('editVenue').value = match.venue;
        document.getElementById('editMatchType').value = match.match_type;
        document.getElementById('editMatchStatus').value = match.match_status;

        document.getElementById('editMatchModal').style.display = 'block';
    }

    closeEditMatchModal() {
        document.getElementById('editMatchModal').style.display = 'none';
        document.getElementById('editMatchForm').reset();
    }

    deleteMatch(matchId) {
        const match = this.matches.find(m => m.match_id == matchId);
        if (!match) return;

        const team1 = this.teams.find(t => t.team_id == match.team1_id);
        const team2 = this.teams.find(t => t.team_id == match.team2_id);
        const matchName = `${team1?.team_name || 'Team 1'} vs ${team2?.team_name || 'Team 2'}`;

        // Show custom delete confirmation modal
        this.showDeleteConfirmation(matchName, matchId);
    }

    showDeleteConfirmation(matchName, matchId) {
        const modal = document.getElementById('deleteMatchModal');
        const message = document.getElementById('deleteMatchMessage');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        // Update message
        message.textContent = `Are you sure you want to delete the match "${matchName}"? This action cannot be undone.`;
        
        // Set up confirmation handler
        confirmBtn.onclick = async () => {
            try {
                await this.apiRequest(`/matches/${matchId}`, {
                    method: 'DELETE'
                });

                await this.loadMatches();
                this.showMessage('Match deleted successfully!', 'success');
                this.closeDeleteMatchModal();
                
            } catch (error) {
                console.error('Error deleting match:', error);
                this.showError('Failed to delete match: ' + error.message);
            }
        };
        
        // Show modal
        modal.style.display = 'block';
    }

    closeDeleteMatchModal() {
        document.getElementById('deleteMatchModal').style.display = 'none';
    }

    // Utility functions
    getTeamAbbreviation(teamName) {
        if (!teamName) return 'default';
        return teamName.split(' ').map(word => word[0]).join('').toLowerCase();
    }

    formatMatchType(type) {
        const types = {
            'group': 'Group Stage',
            'quarterfinal': 'Quarter Final',
            'semifinal': 'Semi Final',
            'final': 'Final'
        };
        return types[type] || 'Group Stage';
    }

    formatMatchDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    formatMatchTime(dateString) {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'Invalid Time';
        }
    }

    // UI helpers
    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const matchesContainer = document.getElementById('matchesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (show) {
            loadingState.style.display = 'flex';
            matchesContainer.style.display = 'none';
            emptyState.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    closeCreateMatchModal() {
        const modal = document.getElementById('createMatchModal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('matchForm');
            if (form) form.reset();
        }
    }
}

// Initialize Match Manager
let matchManager;

document.addEventListener('DOMContentLoaded', function() {
    matchManager = new MatchManager();
});