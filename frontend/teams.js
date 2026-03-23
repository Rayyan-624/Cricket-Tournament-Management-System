class TeamManager {
    constructor() {
        this.teams = [];
        this.newTeamPlayers = [];
        this.coaches = [];
        this.tournaments = [];
        this.API_BASE = 'http://localhost:5000/api';
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadTeamsFromDatabase();
        this.setupEventListeners();
        this.createPopupStyles();
    }

    // Check authentication
    async checkAuth() {
        const token = localStorage.getItem('ctms_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            await this.loadCoaches();
            await this.loadTournaments();
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    // Load teams from database with fallback to sample data
    async loadTeamsFromDatabase() {
        try {
            const teams = await this.apiRequest('/teams');
            if (teams && teams.length > 0) {
                // Convert database teams to local format
                this.teams = teams.map(team => ({
                    id: team.team_id.toString(),
                    name: team.team_name,
                    abbreviation: team.team_abbreviation,
                    captain: team.captain || 'Not Set',
                    city: team.city,
                    stadium: team.home_ground,
                    matchesPlayed: team.matches_played || 0,
                    matchesWon: team.matches_won || 0,
                    netRunRate: team.net_run_rate || 0,
                    players: team.players || []
                }));
            } else {
                // Use sample data if no teams in database
                this.loadSampleTeams();
            }
            this.renderTeams();
        } catch (error) {
            console.error('Error loading teams from database:', error);
            // Use sample data if database fails
            this.loadSampleTeams();
            this.renderTeams();
        }
    }

    // Load sample teams when database is empty or unavailable
    loadSampleTeams() {
        this.teams = [
            {
                id: this.generateId(),
                name: "Karachi Kings",
                abbreviation: "KK",
                captain: "David Warner",
                city: "Karachi",
                stadium: "National Stadium",
                matchesPlayed: 15,
                matchesWon: 9,
                netRunRate: 0.845,
                players: [
                    { id: this.generateId(), name: "Babar Azam", role: "Batsman", runs: 450, strikeRate: 135.2, average: 45.0, matches: 12 },
                    { id: this.generateId(), name: "Imad Wasim", role: "All-rounder", runs: 210, wickets: 12, strikeRate: 125.5, average: 21.0, matches: 14 },
                    { id: this.generateId(), name: "Mohammad Amir", role: "Bowler", wickets: 18, economy: 7.8, matches: 15 }
                ]
            },
            {
                id: this.generateId(),
                name: "Lahore Qalandars",
                abbreviation: "LQ",
                captain: "Shaheen Afridi",
                city: "Lahore",
                stadium: "Gaddafi Stadium",
                matchesPlayed: 14,
                matchesWon: 8,
                netRunRate: 0.765,
                players: [
                    { id: this.generateId(), name: "Shaheen Afridi", role: "Bowler", wickets: 22, economy: 7.2, matches: 14 },
                    { id: this.generateId(), name: "Fakhar Zaman", role: "Batsman", runs: 380, strikeRate: 142.5, average: 38.0, matches: 13 },
                    { id: this.generateId(), name: "Rashid Khan", role: "Bowler", wickets: 16, economy: 6.8, matches: 12 }
                ]
            },
            {
                id: this.generateId(),
                name: "Islamabad United",
                abbreviation: "IU",
                captain: "Shadab Khan",
                city: "Islamabad",
                stadium: "Rawalpindi Cricket Stadium",
                matchesPlayed: 15,
                matchesWon: 10,
                netRunRate: 1.025,
                players: [
                    { id: this.generateId(), name: "Shadab Khan", role: "All-rounder", runs: 180, wickets: 14, strikeRate: 130.5, average: 18.0, matches: 15 },
                    { id: this.generateId(), name: "Alex Hales", role: "Batsman", runs: 420, strikeRate: 148.3, average: 42.0, matches: 14 },
                    { id: this.generateId(), name: "Naseem Shah", role: "Bowler", wickets: 19, economy: 7.5, matches: 15 }
                ]
            },
            {
                id: this.generateId(),
                name: "Peshawar Zalmi",
                abbreviation: "PZ",
                captain: "Babar Azam",
                city: "Peshawar",
                stadium: "Arbab Niaz Stadium",
                matchesPlayed: 14,
                matchesWon: 7,
                netRunRate: 0.586,
                players: [
                    { id: this.generateId(), name: "Babar Azam", role: "Batsman", runs: 390, strikeRate: 138.5, average: 39.0, matches: 14 },
                    { id: this.generateId(), name: "Wahab Riaz", role: "Bowler", wickets: 15, economy: 8.2, matches: 13 },
                    { id: this.generateId(), name: "Mohammad Haris", role: "Batsman", runs: 280, strikeRate: 145.8, average: 28.0, matches: 12 }
                ]
            }
        ];
        
        // Save sample teams to localStorage for persistence
        this.saveToLocalStorage();
    }

    // API request helper
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
                    localStorage.removeItem('ctms_token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Load coaches from database
    async loadCoaches() {
        try {
            this.coaches = await this.apiRequest('/coaches');
            this.updateCoachDropdowns();
        } catch (error) {
            console.error('Error loading coaches:', error);
            // Fallback to sample coaches
            this.coaches = [
                { coach_id: 1, coach_name: "Mickey Arthur", specialization: "Batting", experience_years: 15, nationality: "Australian" },
                { coach_id: 2, coach_name: "Andy Flower", specialization: "Fielding", experience_years: 12, nationality: "Zimbabwean" },
                { coach_id: 3, coach_name: "Darren Sammy", specialization: "Bowling", experience_years: 8, nationality: "West Indian" }
            ];
            this.updateCoachDropdowns();
        }
    }

    // Load tournaments from database
    async loadTournaments() {
        try {
            this.tournaments = await this.apiRequest('/tournaments');
            this.updateTournamentDropdowns();
        } catch (error) {
            console.error('Error loading tournaments:', error);
            // Fallback to sample tournaments
            this.tournaments = [
                { tournament_id: 1, tournament_name: "Pakistan Super League 2024" },
                { tournament_id: 2, tournament_name: "ICC T20 World Cup" },
                { tournament_id: 3, tournament_name: "Asia Cup 2024" }
            ];
            this.updateTournamentDropdowns();
        }
    }

    // Update coach dropdowns in forms
    updateCoachDropdowns() {
        const coachSelect = document.getElementById('teamCoach');
        if (coachSelect) {
            coachSelect.innerHTML = '<option value="">Select Coach</option>';
            this.coaches.forEach(coach => {
                const option = document.createElement('option');
                option.value = coach.coach_id;
                option.textContent = `${coach.coach_name} (${coach.specialization || 'General'}, ${coach.experience_years || 0} years, ${coach.nationality || 'N/A'})`;
                coachSelect.appendChild(option);
            });
        }

        const editCoachSelect = document.getElementById('editTeamCoach');
        if (editCoachSelect) {
            editCoachSelect.innerHTML = '<option value="">Select Coach</option>';
            this.coaches.forEach(coach => {
                const option = document.createElement('option');
                option.value = coach.coach_id;
                option.textContent = `${coach.coach_name} (${coach.specialization || 'General'}, ${coach.experience_years || 0} years, ${coach.nationality || 'N/A'})`;
                editCoachSelect.appendChild(option);
            });
        }
    }

    // Update tournament dropdowns in forms
    updateTournamentDropdowns() {
        const tournamentSelect = document.getElementById('teamTournament');
        if (tournamentSelect) {
            tournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
            this.tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.tournament_id;
                option.textContent = tournament.tournament_name;
                tournamentSelect.appendChild(option);
            });
        }

        const editTournamentSelect = document.getElementById('editTeamTournament');
        if (editTournamentSelect) {
            editTournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
            this.tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.tournament_id;
                option.textContent = tournament.tournament_name;
                editTournamentSelect.appendChild(option);
            });
        }
    }

    // Create popup styles dynamically
    createPopupStyles() {
        if (document.getElementById('popup-styles')) return;
        
        const styles = `
            .team-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: linear-gradient(135deg, #4CAF50, #45a049);
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
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .team-popup.delete-popup {
                background: linear-gradient(135deg, #F44336, #D32F2F);
            }
            
            .team-popup.edit-popup {
                background: linear-gradient(135deg, #FF9800, #F57C00);
            }
            
            .team-popup.confirm-popup {
                background: linear-gradient(135deg, #9C27B0, #7B1FA2);
                min-width: 350px;
            }
            
            .team-popup.player-popup {
                background: linear-gradient(135deg, #2196F3, #1976D2);
            }
            
            .team-popup.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .team-popup h3 {
                margin: 0 0 10px 0;
                font-size: 1.4rem;
                font-weight: 600;
                color: white;
            }
            
            .team-popup p {
                margin: 0;
                font-size: 1rem;
                opacity: 0.9;
                color: white;
                line-height: 1.4;
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
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .popup-btn.confirm {
                background: #F44336;
                color: white;
            }
            
            .popup-btn.confirm:hover {
                background: #D32F2F;
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

    // Show team creation popup
    showTeamPopup(teamName, type = 'create') {
        let overlay = document.getElementById('popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        
        let popup = document.getElementById('team-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'team-popup';
            popup.className = 'team-popup';
            document.body.appendChild(popup);
        }
        
        const popupConfig = {
            create: {
                title: 'Team Created!',
                message: `"${teamName}" has been successfully created`,
                className: ''
            },
            delete: {
                title: 'Team Deleted!',
                message: `"${teamName}" has been successfully deleted`,
                className: 'delete-popup'
            },
            edit: {
                title: 'Team Updated!',
                message: `"${teamName}" has been successfully updated`,
                className: 'edit-popup'
            }
        };
        
        const config = popupConfig[type];
        
        popup.className = `team-popup ${config.className}`;
        popup.innerHTML = `
            <h3>${config.title}</h3>
            <p>${config.message}</p>
        `;
        
        overlay.classList.add('show');
        popup.classList.add('show');
        
        setTimeout(() => {
            this.hideTeamPopup();
        }, 3000);
        
        overlay.addEventListener('click', () => {
            this.hideTeamPopup();
        });
    }

    // Show player popup - FIXED: Now uses consistent styling
    showPlayerPopup(playerName, type = 'create') {
        let overlay = document.getElementById('popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        
        let popup = document.getElementById('player-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'player-popup';
            popup.className = 'team-popup player-popup';
            document.body.appendChild(popup);
        }
        
        const popupConfig = {
            create: {
                title: 'Player Added!',
                message: `"${playerName}" has been successfully added`,
                className: 'player-popup'
            },
            delete: {
                title: 'Player Removed!',
                message: `"${playerName}" has been removed from the team`,
                className: 'delete-popup'
            },
            edit: {
                title: 'Player Updated!',
                message: `"${playerName}" has been successfully updated`,
                className: 'edit-popup'
            }
        };
        
        const config = popupConfig[type];
        
        popup.className = `team-popup ${config.className}`;
        popup.innerHTML = `
            <h3>${config.title}</h3>
            <p>${config.message}</p>
        `;
        
        overlay.classList.add('show');
        popup.classList.add('show');
        
        setTimeout(() => {
            this.hidePlayerPopup();
        }, 3000);
        
        overlay.addEventListener('click', () => {
            this.hidePlayerPopup();
        });
    }

    // Show confirmation popup for delete
    showDeleteConfirmation(teamName, teamId) {
        let overlay = document.getElementById('popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            document.body.appendChild(overlay);
        }
        
        let popup = document.getElementById('team-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'team-popup';
            popup.className = 'team-popup confirm-popup';
            document.body.appendChild(popup);
        }
        
        popup.className = 'team-popup confirm-popup';
        popup.innerHTML = `
            <h3>Delete Team</h3>
            <p>Are you sure you want to delete "${teamName}"?</p>
            <div class="popup-buttons">
                <button class="popup-btn cancel" onclick="teamManager.hideTeamPopup()">Cancel</button>
                <button class="popup-btn confirm" onclick="teamManager.confirmDelete('${teamId}')">Delete</button>
            </div>
        `;
        
        overlay.classList.add('show');
        popup.classList.add('show');
        
        overlay.addEventListener('click', () => {
            this.hideTeamPopup();
        });
    }

    // Hide player popup
    hidePlayerPopup() {
        const popup = document.getElementById('player-popup');
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

    // Confirm delete action - FIXED: Now deletes from database too
    async confirmDelete(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            try {
                // Delete from database first
                await this.apiRequest(`/teams/${teamId}`, {
                    method: 'DELETE'
                });
                
                // Then delete locally
                this.teams = this.teams.filter(t => t.id !== teamId);
                this.saveToLocalStorage();
                this.renderTeams();
                this.hideTeamPopup();
                this.showTeamPopup(team.name, 'delete');
                
                // Refresh dashboard data if dashboard manager exists
                if (typeof dashboardManager !== 'undefined') {
                    await dashboardManager.loadDashboardStats();
                }
                
            } catch (error) {
                console.error('Error deleting team from database:', error);
                // Fallback to local deletion only
                this.teams = this.teams.filter(t => t.id !== teamId);
                this.saveToLocalStorage();
                this.renderTeams();
                this.hideTeamPopup();
                this.showTeamPopup(team.name, 'delete');
            }
        }
    }

    // Hide team popup
    hideTeamPopup() {
        const popup = document.getElementById('team-popup');
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

    // Generate unique ID for teams
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('teamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Edit form submission
        document.getElementById('editTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditFormSubmit();
        });

        // Player form submission
        document.getElementById('playerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlayerFormSubmit();
        });

        // Edit player form submission
        document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditPlayerFormSubmit();
        });

        // New team player form submission
        document.getElementById('playerToNewTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewTeamPlayerFormSubmit();
        });

        // Close modal when clicking outside
        document.getElementById('createTeamModal').addEventListener('click', (e) => {
            if (e.target.id === 'createTeamModal') {
                this.closeCreateTeamModal();
            }
        });

        document.getElementById('editTeamModal').addEventListener('click', (e) => {
            if (e.target.id === 'editTeamModal') {
                this.closeEditTeamModal();
            }
        });

        document.getElementById('playersModal').addEventListener('click', (e) => {
            if (e.target.id === 'playersModal') {
                this.closePlayersModal();
            }
        });

        document.getElementById('addPlayerModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPlayerModal') {
                this.closeAddPlayerModal();
            }
        });

        document.getElementById('editPlayerModal').addEventListener('click', (e) => {
            if (e.target.id === 'editPlayerModal') {
                this.closeEditPlayerModal();
            }
        });

        document.getElementById('addPlayerToNewTeamModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPlayerToNewTeamModal') {
                this.closeAddPlayerToNewTeamModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCreateTeamModal();
                this.closeEditTeamModal();
                this.closePlayersModal();
                this.closeAddPlayerModal();
                this.closeEditPlayerModal();
                this.closeAddPlayerToNewTeamModal();
            }
        });

        // Role change listeners for new team player form
        document.getElementById('newTeamPlayerRole').addEventListener('change', () => {
            this.updateNewTeamPlayerFormFields();
        });
    }

    // Handle form submission - Save to database
    async handleFormSubmit() {
        const name = document.getElementById('teamName').value;
        const abbreviation = document.getElementById('teamAbbr').value;
        const captain = document.getElementById('captainName').value;
        const city = document.getElementById('city').value;
        const stadium = document.getElementById('stadium').value;
        const matchesPlayed = parseInt(document.getElementById('matchesPlayed').value);
        const matchesWon = parseInt(document.getElementById('matchesWon').value);
        const netRunRate = parseFloat(document.getElementById('netRunRate').value);
        const coachId = document.getElementById('teamCoach').value;
        const tournamentId = document.getElementById('teamTournament').value;
        
        try {
            // Prepare team data for database
            const teamData = {
                team_name: name,
                team_abbreviation: abbreviation,
                city: city,
                home_ground: stadium,
                established_year: new Date().getFullYear(),
                coach_id: coachId || null,
                tournament_id: tournamentId,
                players: this.newTeamPlayers.map(player => {
                    // For bowlers: include batting_style as null and bowling_style
                    if (player.role === 'Bowler') {
                        return {
                            player_name: player.name,
                            date_of_birth: null,
                            nationality: '',
                            batting_style: null,  // Explicitly null for bowlers
                            bowling_style: player.bowlingStyle || 'Fast',  // Use selected bowling style
                            role: player.role.toLowerCase(),
                            is_captain: player.name === captain
                        };
                    }
                    // For batsmen, wicketkeepers: include batting_style and bowling_style as null
                    else if (player.role === 'Batsman' || player.role === 'Wicketkeeper') {
                        return {
                            player_name: player.name,
                            date_of_birth: null,
                            nationality: '',
                            batting_style: player.battingStyle || 'Right-handed',  // Use selected batting style
                            bowling_style: null,  // Explicitly null for non-bowlers
                            role: player.role.toLowerCase(),
                            is_captain: player.name === captain
                        };
                    }
                    // For all-rounders: both batting_style and bowling_style
                    else if (player.role === 'All-rounder') {
                        return {
                            player_name: player.name,
                            date_of_birth: null,
                            nationality: '',
                            batting_style: player.battingStyle || 'Right-handed',
                            bowling_style: player.bowlingStyle || 'Fast',
                            role: player.role.toLowerCase(),
                            is_captain: player.name === captain
                        };
                    }
                })
            };

            console.log('Sending team data:', JSON.stringify(teamData, null, 2));

            // Save to database
            const savedTeam = await this.apiRequest('/teams', {
                method: 'POST',
                body: JSON.stringify(teamData)
            });

            // Also save locally for immediate UI update
            const newTeam = {
                id: savedTeam.team_id ? savedTeam.team_id.toString() : this.generateId(),
                name,
                abbreviation,
                captain,
                city,
                stadium,
                matchesPlayed,
                matchesWon,
                netRunRate,
                players: [...this.newTeamPlayers]
            };
            
            this.addTeam(newTeam);
            this.closeCreateTeamModal();
            this.showTeamPopup(name, 'create');
            this.newTeamPlayers = [];
            
        } catch (error) {
            console.error('Error creating team in database:', error);
            // Fallback to local storage only
            const newTeam = {
                id: this.generateId(),
                name,
                abbreviation,
                captain,
                city,
                stadium,
                matchesPlayed,
                matchesWon,
                netRunRate,
                players: [...this.newTeamPlayers]
            };
            
            this.addTeam(newTeam);
            this.closeCreateTeamModal();
            this.showTeamPopup(name, 'create');
            this.newTeamPlayers = [];
        }
    }

    // Handle edit form submission - Update database
    async handleEditFormSubmit() {
        const teamId = document.getElementById('editTeamId').value;
        const name = document.getElementById('editTeamName').value;
        const abbreviation = document.getElementById('editTeamAbbr').value;
        const captain = document.getElementById('editCaptainName').value;
        const city = document.getElementById('editCity').value;
        const stadium = document.getElementById('editStadium').value;
        const matchesPlayed = parseInt(document.getElementById('editMatchesPlayed').value);
        const matchesWon = parseInt(document.getElementById('editMatchesWon').value);
        const netRunRate = parseFloat(document.getElementById('editNetRunRate').value);
        const coachId = document.getElementById('editTeamCoach').value;
        const tournamentId = document.getElementById('editTeamTournament').value;
        
        try {
            // Prepare updated team data for database
            const teamData = {
                team_name: name,
                team_abbreviation: abbreviation,
                city: city,
                home_ground: stadium,
                coach_id: coachId || null,
                tournament_id: tournamentId
            };

            // Update in database
            await this.apiRequest(`/teams/${teamId}`, {
                method: 'PUT',
                body: JSON.stringify(teamData)
            });

            // Also update locally for immediate UI update
            const updatedTeam = {
                id: teamId,
                name,
                abbreviation,
                captain,
                city,
                stadium,
                matchesPlayed,
                matchesWon,
                netRunRate,
                players: this.teams.find(t => t.id === teamId).players || []
            };
            
            this.updateTeam(updatedTeam);
            this.closeEditTeamModal();
            this.showTeamPopup(name, 'edit');
            
        } catch (error) {
            console.error('Error updating team in database:', error);
            // Fallback to local storage only
            const updatedTeam = {
                id: teamId,
                name,
                abbreviation,
                captain,
                city,
                stadium,
                matchesPlayed,
                matchesWon,
                netRunRate,
                players: this.teams.find(t => t.id === teamId).players || []
            };
            
            this.updateTeam(updatedTeam);
            this.closeEditTeamModal();
            this.showTeamPopup(name, 'edit');
        }
    }

    // Handle player form submission - Save to database
    async handlePlayerFormSubmit() {
        const teamId = document.getElementById('playerTeamId').value;
        const name = document.getElementById('playerName').value;
        const role = document.getElementById('playerRole').value;
        const runs = parseInt(document.getElementById('playerRuns').value) || 0;
        const wickets = parseInt(document.getElementById('playerWickets').value) || 0;
        const strikeRate = parseFloat(document.getElementById('playerStrikeRate').value) || 0;
        const economy = parseFloat(document.getElementById('playerEconomy').value) || 0;
        const average = parseFloat(document.getElementById('playerAverage').value) || 0;
        const matches = parseInt(document.getElementById('playerMatches').value) || 0;
        
        try {
            // Prepare player data for database
            const playerData = {
                player_name: name,
                role: role.toLowerCase(),
                runs: runs,
                wickets: wickets,
                strike_rate: strikeRate,
                economy_rate: economy,
                matches_played: matches,
                team_id: teamId
            };

            // Save to database
            await this.apiRequest('/players', {
                method: 'POST',
                body: JSON.stringify(playerData)
            });

            // Also save locally for immediate UI update
            const newPlayer = {
                id: this.generateId(),
                name,
                role,
                runs,
                wickets,
                strikeRate,
                economy,
                average,
                matches
            };
            
            this.addPlayer(teamId, newPlayer);
            this.closeAddPlayerModal();
            this.showPlayerPopup(name, 'create');
            
        } catch (error) {
            console.error('Error creating player in database:', error);
            // Fallback to local storage only
            const newPlayer = {
                id: this.generateId(),
                name,
                role,
                runs,
                wickets,
                strikeRate,
                economy,
                average,
                matches
            };
            
            this.addPlayer(teamId, newPlayer);
            this.closeAddPlayerModal();
            this.showPlayerPopup(name, 'create');
        }
    }

    // Handle new team player form submission
    handleNewTeamPlayerFormSubmit() {
        const name = document.getElementById('newTeamPlayerName').value;
        const role = document.getElementById('newTeamPlayerRole').value;
        const battingStyle = document.getElementById('newTeamPlayerBattingStyle').value;
        const bowlingStyle = document.getElementById('newTeamPlayerBowlingStyle').value;
        const runs = parseInt(document.getElementById('newTeamPlayerRuns').value) || 0;
        const wickets = parseInt(document.getElementById('newTeamPlayerWickets').value) || 0;
        const strikeRate = parseFloat(document.getElementById('newTeamPlayerStrikeRate').value) || 0;
        const economy = parseFloat(document.getElementById('newTeamPlayerEconomy').value) || 0;
        const average = parseFloat(document.getElementById('newTeamPlayerAverage').value) || 0;
        const matches = parseInt(document.getElementById('newTeamPlayerMatches').value) || 0;
        
        const newPlayer = {
            id: this.generateId(),
            name,
            role,
            battingStyle: (role === 'Batsman' || role === 'All-rounder' || role === 'Wicketkeeper') ? battingStyle : null,
            bowlingStyle: (role === 'Bowler' || role === 'All-rounder') ? bowlingStyle : null,
            runs,
            wickets,
            strikeRate,
            economy,
            average,
            matches
        };
        
        this.newTeamPlayers.push(newPlayer);
        this.renderNewTeamPlayersList();
        this.closeAddPlayerToNewTeamModal();
    }

    // Handle edit player form submission - Update database
    async handleEditPlayerFormSubmit() {
        const teamId = document.getElementById('editPlayerTeamId').value;
        const playerId = document.getElementById('editPlayerId').value;
        const name = document.getElementById('editPlayerName').value;
        const role = document.getElementById('editPlayerRole').value;
        const runs = parseInt(document.getElementById('editPlayerRuns').value) || 0;
        const wickets = parseInt(document.getElementById('editPlayerWickets').value) || 0;
        const strikeRate = parseFloat(document.getElementById('editPlayerStrikeRate').value) || 0;
        const economy = parseFloat(document.getElementById('editPlayerEconomy').value) || 0;
        const average = parseFloat(document.getElementById('editPlayerAverage').value) || 0;
        const matches = parseInt(document.getElementById('editPlayerMatches').value) || 0;
        
        try {
            // Prepare updated player data for database
            const playerData = {
                player_name: name,
                role: role.toLowerCase(),
                runs: runs,
                wickets: wickets,
                strike_rate: strikeRate,
                economy_rate: economy,
                matches_played: matches
            };

            // Update in database
            await this.apiRequest(`/players/${playerId}`, {
                method: 'PUT',
                body: JSON.stringify(playerData)
            });

            // Also update locally for immediate UI update
            const updatedPlayer = {
                id: playerId,
                name,
                role,
                runs,
                wickets,
                strikeRate,
                economy,
                average,
                matches
            };
            
            this.updatePlayer(teamId, playerId, updatedPlayer);
            this.closeEditPlayerModal();
            this.showPlayerPopup(name, 'edit');
            
        } catch (error) {
            console.error('Error updating player in database:', error);
            // Fallback to local storage only
            const updatedPlayer = {
                id: playerId,
                name,
                role,
                runs,
                wickets,
                strikeRate,
                economy,
                average,
                matches
            };
            
            this.updatePlayer(teamId, playerId, updatedPlayer);
            this.closeEditPlayerModal();
            this.showPlayerPopup(name, 'edit');
        }
    }

    // Add new team
    addTeam(teamData) {
        this.teams.push(teamData);
        this.saveToLocalStorage();
        this.renderTeams();
        this.highlightNewTeam();
    }

    // Update existing team
    updateTeam(updatedTeam) {
        const index = this.teams.findIndex(t => t.id === updatedTeam.id);
        if (index !== -1) {
            this.teams[index] = updatedTeam;
            this.saveToLocalStorage();
            this.renderTeams();
        }
    }

    // Add player to team
    addPlayer(teamId, playerData) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            if (!team.players) team.players = [];
            team.players.push(playerData);
            this.saveToLocalStorage();
            this.openPlayersModal(team);
        }
    }

    // Update player in team
    updatePlayer(teamId, playerId, updatedPlayer) {
        const team = this.teams.find(t => t.id === teamId);
        if (team && team.players) {
            const playerIndex = team.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                team.players[playerIndex] = updatedPlayer;
                this.saveToLocalStorage();
                this.openPlayersModal(team);
            }
        }
    }

    // Delete player from team
    deletePlayer(teamId, playerId, playerName) {
        const team = this.teams.find(t => t.id === teamId);
        if (team && team.players) {
            team.players = team.players.filter(p => p.id !== playerId);
            this.saveToLocalStorage();
            this.openPlayersModal(team);
            this.showPlayerPopup(playerName, 'delete');
        }
    }

    // Delete player from new team (during creation)
    deletePlayerFromNewTeam(playerId) {
        this.newTeamPlayers = this.newTeamPlayers.filter(p => p.id !== playerId);
        this.renderNewTeamPlayersList();
    }

    // Render new team players list
    renderNewTeamPlayersList() {
        const container = document.getElementById('createTeamPlayersList');
        container.innerHTML = '';

        if (this.newTeamPlayers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No players added yet</p>';
            return;
        }

        this.newTeamPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'new-team-player-card';
            playerCard.innerHTML = `
                <div class="new-team-player-info">
                    <h4>${player.name} <span class="player-role">${player.role}</span></h4>
                </div>
                <div class="new-team-player-actions">
                    <button class="btn btn-small btn-danger" onclick="teamManager.deletePlayerFromNewTeam('${player.id}')">Remove</button>
                </div>
            `;
            container.appendChild(playerCard);
        });
    }

    // Save teams to localStorage
    saveToLocalStorage() {
        localStorage.setItem('ctms-teams', JSON.stringify(this.teams));
    }

    // Highlight newly added team
    highlightNewTeam() {
        const newCard = document.querySelector('.team-card:last-child');
        if (newCard) {
            newCard.classList.add('new-team');
            
            setTimeout(() => {
                newCard.classList.remove('new-team');
            }, 2000);
        }
    }

    // Render all teams
    renderTeams() {
        const container = document.getElementById('teamsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.teams.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = '';
        
        this.teams.forEach(team => {
            const card = this.createTeamCard(team);
            container.appendChild(card);
        });
    }

    // Create team card element
    createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.setAttribute('data-id', team.id);
        
        const winPercentage = team.matchesPlayed > 0 ? ((team.matchesWon / team.matchesPlayed) * 100).toFixed(1) : 0;
        
        card.innerHTML = `
            <div class="team-header">
                <div class="team-logo ${team.abbreviation.toLowerCase()}"></div>
                <div class="team-info">
                    <h3>${team.name}</h3>
                    <p>Captain: ${team.captain}</p>
                </div>
            </div>
            <div class="team-stats">
                <div class="stat">
                    <span class="stat-value">${team.matchesPlayed}</span>
                    <span class="stat-label">Matches</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${team.matchesWon}</span>
                    <span class="stat-label">Wins</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${winPercentage}%</span>
                    <span class="stat-label">Win Rate</span>
                </div>
            </div>
            <div class="team-details" style="padding: 15px 20px; background: white;">
                <p style="margin-bottom: 8px; font-size: 0.9rem;"><strong>City:</strong> ${team.city}</p>
                <p style="margin-bottom: 8px; font-size: 0.9rem;"><strong>Stadium:</strong> ${team.stadium}</p>
                <p style="font-size: 0.9rem;"><strong>NRR:</strong> ${team.netRunRate > 0 ? '+' : ''}${team.netRunRate}</p>
            </div>
            <div class="team-actions">
                <button class="btn btn-primary" onclick="teamManager.viewTeamPlayers('${team.id}')">View Players</button>
                <button class="btn btn-outline" onclick="teamManager.editTeam('${team.id}')">Edit</button>
                <button class="btn btn-outline" onclick="teamManager.deleteTeam('${team.id}')">Delete</button>
            </div>
        `;
        
        return card;
    }

    // Edit team
    editTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            this.openEditTeamModal(team);
        }
    }

    // Open edit team modal
    openEditTeamModal(team) {
        document.getElementById('editTeamId').value = team.id;
        document.getElementById('editTeamName').value = team.name;
        document.getElementById('editTeamAbbr').value = team.abbreviation;
        document.getElementById('editCaptainName').value = team.captain;
        document.getElementById('editCity').value = team.city;
        document.getElementById('editStadium').value = team.stadium;
        document.getElementById('editMatchesPlayed').value = team.matchesPlayed;
        document.getElementById('editMatchesWon').value = team.matchesWon;
        document.getElementById('editNetRunRate').value = team.netRunRate;
        
        document.getElementById('editTeamModal').style.display = 'block';
        document.getElementById('editTeamName').focus();
    }

    // Close edit team modal
    closeEditTeamModal() {
        document.getElementById('editTeamModal').style.display = 'none';
        document.getElementById('editTeamForm').reset();
    }

    // Delete team
    deleteTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            this.showDeleteConfirmation(team.name, teamId);
        }
    }

    // View team players
    viewTeamPlayers(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            this.openPlayersModal(team);
        }
    }

    // Open players modal
    openPlayersModal(team) {
        document.getElementById('modalTeamName').textContent = team.name;
        document.getElementById('playerTeamId').value = team.id;
        
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        if (team.players && team.players.length > 0) {
            team.players.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                
                let statsHtml = '';
                if (player.role === 'Batsman') {
                    statsHtml = `<span>Runs: ${player.runs}</span><span>SR: ${player.strikeRate}</span><span>Avg: ${player.average}</span><span>Matches: ${player.matches}</span>`;
                } else if (player.role === 'Bowler') {
                    statsHtml = `<span>Wkts: ${player.wickets}</span><span>Econ: ${player.economy}</span><span>Matches: ${player.matches}</span>`;
                } else if (player.role === 'All-rounder') {
                    statsHtml = `<span>Runs: ${player.runs}</span><span>Wkts: ${player.wickets}</span><span>Avg: ${player.average}</span><span>Matches: ${player.matches}</span>`;
                } else if (player.role === 'Wicketkeeper') {
                    statsHtml = `<span>Runs: ${player.runs}</span><span>SR: ${player.strikeRate}</span><span>Avg: ${player.average}</span><span>Matches: ${player.matches}</span>`;
                }
                
                playerCard.innerHTML = `
                    <div class="player-info">
                        <h4>${player.name} ${player.name === team.captain ? '(Captain)' : ''}</h4>
                        <span class="player-role">${player.role}</span>
                    </div>
                    <div class="player-stats">
                        ${statsHtml}
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-small" onclick="teamManager.editPlayer('${team.id}', '${player.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="teamManager.confirmDeletePlayer('${team.id}', '${player.id}', '${player.name}')">Delete</button>
                    </div>
                `;
                
                playersList.appendChild(playerCard);
            });
        } else {
            playersList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No players added yet.</p>';
        }
        
        document.getElementById('playersModal').style.display = 'block';
    }

    // Close players modal
    closePlayersModal() {
        document.getElementById('playersModal').style.display = 'none';
    }

    // Open add player modal
    openAddPlayerModal() {
        document.getElementById('addPlayerModal').style.display = 'block';
        document.getElementById('playerName').focus();
        this.updatePlayerFormFields();
    }

    // Open add player to new team modal
    openAddPlayerToNewTeamModal() {
        document.getElementById('addPlayerToNewTeamModal').style.display = 'block';
        document.getElementById('newTeamPlayerName').focus();
        this.updateNewTeamPlayerFormFields();
    }

    // Close add player to new team modal
    closeAddPlayerToNewTeamModal() {
        document.getElementById('addPlayerToNewTeamModal').style.display = 'none';
        document.getElementById('playerToNewTeamForm').reset();
    }

    // Open edit player modal
    editPlayer(teamId, playerId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team && team.players) {
            const player = team.players.find(p => p.id === playerId);
            if (player) {
                document.getElementById('editPlayerTeamId').value = teamId;
                document.getElementById('editPlayerId').value = playerId;
                document.getElementById('editPlayerName').value = player.name;
                document.getElementById('editPlayerRole').value = player.role;
                document.getElementById('editPlayerRuns').value = player.runs || '';
                document.getElementById('editPlayerWickets').value = player.wickets || '';
                document.getElementById('editPlayerStrikeRate').value = player.strikeRate || '';
                document.getElementById('editPlayerEconomy').value = player.economy || '';
                document.getElementById('editPlayerAverage').value = player.average || '';
                document.getElementById('editPlayerMatches').value = player.matches || '';
                
                document.getElementById('editPlayerModal').style.display = 'block';
                this.updateEditPlayerFormFields();
            }
        }
    }

    // Update player form fields based on role
    updatePlayerFormFields() {
        const role = document.getElementById('playerRole').value;
        this.togglePlayerFields('player', role);
    }

    updateEditPlayerFormFields() {
        const role = document.getElementById('editPlayerRole').value;
        this.togglePlayerFields('editPlayer', role);
    }

    updateNewTeamPlayerFormFields() {
        const role = document.getElementById('newTeamPlayerRole').value;
        const battingStyleGroup = document.getElementById('newTeamPlayerBattingStyleGroup');
        const bowlingStyleGroup = document.getElementById('newTeamPlayerBowlingStyleGroup');
        
        // Hide both style groups initially
        battingStyleGroup.style.display = 'none';
        bowlingStyleGroup.style.display = 'none';
        
        // Show relevant style fields based on role
        if (role === 'Batsman' || role === 'All-rounder' || role === 'Wicketkeeper') {
            battingStyleGroup.style.display = 'block';
        }
        if (role === 'Bowler' || role === 'All-rounder') {
            bowlingStyleGroup.style.display = 'block';
        }
        
        // Also update the stats fields
        this.togglePlayerFields('newTeamPlayer', role);
    }

    togglePlayerFields(prefix, role) {
        const runsGroup = document.getElementById(`${prefix}RunsGroup`);
        const wicketsGroup = document.getElementById(`${prefix}WicketsGroup`);
        const strikeRateGroup = document.getElementById(`${prefix}StrikeRateGroup`);
        const economyGroup = document.getElementById(`${prefix}EconomyGroup`);
        const averageGroup = document.getElementById(`${prefix}AverageGroup`);

        // Hide all first
        if (runsGroup) runsGroup.style.display = 'none';
        if (wicketsGroup) wicketsGroup.style.display = 'none';
        if (strikeRateGroup) strikeRateGroup.style.display = 'none';
        if (economyGroup) economyGroup.style.display = 'none';
        if (averageGroup) averageGroup.style.display = 'none';

        // Show relevant fields based on role
        if (role === 'Batsman' || role === 'All-rounder' || role === 'Wicketkeeper') {
            if (runsGroup) runsGroup.style.display = 'block';
            if (strikeRateGroup) strikeRateGroup.style.display = 'block';
            if (averageGroup) averageGroup.style.display = 'block';
        }
        if (role === 'Bowler' || role === 'All-rounder') {
            if (wicketsGroup) wicketsGroup.style.display = 'block';
            if (economyGroup) economyGroup.style.display = 'block';
        }
    }

    // Confirm delete player
    confirmDeletePlayer(teamId, playerId, playerName) {
        if (confirm(`Are you sure you want to remove "${playerName}" from the team?`)) {
            this.deletePlayer(teamId, playerId, playerName);
        }
    }

    // Modal functions
    openCreateTeamModal() {
        this.newTeamPlayers = [];
        this.renderNewTeamPlayersList();
        document.getElementById('createTeamModal').style.display = 'block';
        document.getElementById('teamName').focus();
    }

    closeCreateTeamModal() {
        document.getElementById('createTeamModal').style.display = 'none';
        document.getElementById('teamForm').reset();
        this.newTeamPlayers = [];
    }

    closeAddPlayerModal() {
        document.getElementById('addPlayerModal').style.display = 'none';
        document.getElementById('playerForm').reset();
    }

    closeEditPlayerModal() {
        document.getElementById('editPlayerModal').style.display = 'none';
        document.getElementById('editPlayerForm').reset();
    }
}

// Initialize Team Manager when DOM is loaded
let teamManager;

document.addEventListener('DOMContentLoaded', function() {
    teamManager = new TeamManager();
    
    // Add event listeners for role changes
    document.getElementById('playerRole').addEventListener('change', function() {
        teamManager.updatePlayerFormFields();
    });
    
    document.getElementById('editPlayerRole').addEventListener('change', function() {
        teamManager.updateEditPlayerFormFields();
    });
    
    document.getElementById('newTeamPlayerRole').addEventListener('change', function() {
        teamManager.updateNewTeamPlayerFormFields();
    });
});

// Global functions for HTML onclick attributes
function openCreateTeamModal() {
    if (teamManager) {
        teamManager.openCreateTeamModal();
    }
}

function closeCreateTeamModal() {
    if (teamManager) {
        teamManager.closeCreateTeamModal();
    }
}

function closeEditTeamModal() {
    if (teamManager) {
        teamManager.closeEditTeamModal();
    }
}

function closePlayersModal() {
    if (teamManager) {
        teamManager.closePlayersModal();
    }
}

function openAddPlayerModal() {
    if (teamManager) {
        teamManager.openAddPlayerModal();
    }
}

function closeAddPlayerModal() {
    if (teamManager) {
        teamManager.closeAddPlayerModal();
    }
}

function closeEditPlayerModal() {
    if (teamManager) {
        teamManager.closeEditPlayerModal();
    }
}

function openAddPlayerToNewTeam() {
    if (teamManager) {
        teamManager.openAddPlayerToNewTeamModal();
    }
}

function closeAddPlayerToNewTeamModal() {
    if (teamManager) {
        teamManager.closeAddPlayerToNewTeamModal();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('ctms_token');
        window.location.href = 'index.html';
    }
}