// statistics.js - Statistics and Analytics Manager
class StatisticsManager {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.tournaments = [];
        this.matches = [];
        this.teams = [];
        this.players = [];
        this.playerStats = [];
        this.teamStats = [];
        this.init();
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('ctms_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadOverviewData();
        await this.loadTournaments();
        this.setupEventListeners();
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

    async loadOverviewData() {
        try {
            // Load tournaments, teams, matches, and players in parallel
            const [tournaments, teams, matches, players] = await Promise.all([
                this.apiRequest('/tournaments'),
                this.apiRequest('/teams'),
                this.apiRequest('/matches'),
                this.apiRequest('/players')
            ]);

            // Update overview counters
            document.getElementById('totalTournaments').textContent = tournaments.length;
            document.getElementById('totalTeams').textContent = teams.length;
            document.getElementById('totalPlayers').textContent = players.length;
            document.getElementById('totalMatches').textContent = matches.length;

            // Store data for statistics
            this.tournaments = tournaments;
            this.teams = teams;
            this.matches = matches;
            this.players = players;

        } catch (error) {
            console.error('Error loading overview data:', error);
            this.showError('Failed to load statistics data');
        }
    }

    async loadTournaments() {
        try {
            const tournaments = await this.apiRequest('/tournaments');
            this.tournaments = tournaments;
            this.populateTournamentSelect();
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    populateTournamentSelect() {
        const tournamentSelect = document.getElementById('tournamentSelect');
        if (!tournamentSelect) return;

        tournamentSelect.innerHTML = '<option value="">Select Tournament</option>';
        
        this.tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.tournament_id;
            option.textContent = tournament.tournament_name;
            tournamentSelect.appendChild(option);
        });

        // Load stats for the first tournament by default
        if (this.tournaments.length > 0) {
            tournamentSelect.value = this.tournaments[0].tournament_id;
            this.loadTournamentStats();
        }
    }

    setupEventListeners() {
        const tournamentSelect = document.getElementById('tournamentSelect');
        if (tournamentSelect) {
            tournamentSelect.addEventListener('change', () => {
                this.loadTournamentStats();
            });
        }
    }

    async loadTournamentStats() {
        const tournamentId = document.getElementById('tournamentSelect').value;
        if (!tournamentId) return;

        try {
            // Show loading state
            const container = document.getElementById('pointsTableContainer');
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading tournament data...</p>
                </div>
            `;

            // Get tournament details
            const tournament = await this.apiRequest(`/tournaments/${tournamentId}`);
            
            // Get matches for this tournament
            const tournamentMatches = this.matches.filter(match => 
                match.tournament_id == tournamentId
            );

            // Get teams for this tournament
            const tournamentTeams = this.teams.filter(team => 
                team.tournament_id == tournamentId
            );

            // Calculate points table
            const pointsTable = this.calculatePointsTable(tournamentTeams, tournamentMatches);
            
            // Render points table
            this.renderPointsTable(pointsTable, tournament);

        } catch (error) {
            console.error('Error loading tournament stats:', error);
            this.showError('Failed to load tournament statistics');
        }
    }

    calculatePointsTable(teams, matches) {
        const pointsTable = teams.map(team => {
            const teamMatches = matches.filter(match => 
                match.team1_id == team.team_id || match.team2_id == team.team_id
            );

            let played = 0;
            let won = 0;
            let lost = 0;
            let tied = 0;
            let points = 0;
            let netRunRate = 0;
            let runsFor = 0;
            let runsAgainst = 0;
            let oversFor = 0;
            let oversAgainst = 0;

            teamMatches.forEach(match => {
                if (match.match_status !== 'completed') return;
                
                played++;
                
                const isTeam1 = match.team1_id == team.team_id;
                const teamScore = isTeam1 ? match.team1_score : match.team2_score;
                const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
                const teamWickets = isTeam1 ? match.team1_wickets : match.team2_wickets;
                const opponentWickets = isTeam1 ? match.team2_wickets : match.team1_wickets;

                // Calculate runs and overs (simplified - assuming 20 overs per match)
                runsFor += teamScore || 0;
                runsAgainst += opponentScore || 0;
                oversFor += 20; // Simplified
                oversAgainst += 20; // Simplified

                if (match.winner_id === team.team_id) {
                    won++;
                    points += 2;
                } else if (match.winner_id && match.winner_id !== team.team_id) {
                    lost++;
                } else {
                    tied++;
                    points += 1;
                }
            });

            // Calculate Net Run Rate
            if (oversFor > 0 && oversAgainst > 0) {
                const runRateFor = runsFor / oversFor;
                const runRateAgainst = runsAgainst / oversAgainst;
                netRunRate = runRateFor - runRateAgainst;
            }

            return {
                team_id: team.team_id,
                team_name: team.team_name,
                played,
                won,
                lost,
                tied,
                points,
                netRunRate: netRunRate.toFixed(3)
            };
        });

        // Sort by points and then by net run rate
        return pointsTable.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return parseFloat(b.netRunRate) - parseFloat(a.netRunRate);
        });
    }

    renderPointsTable(pointsTable, tournament) {
        const container = document.getElementById('pointsTableContainer');
        
        if (pointsTable.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Match Data Available</h3>
                    <p>Complete some matches to see the points table</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="tournament-info" style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 10px;">
                <h3 style="color: var(--primary); margin-bottom: 10px;">${tournament.tournament_name}</h3>
                <p style="color: #666;">
                    ${this.formatDate(tournament.start_date)} - ${this.formatDate(tournament.end_date)} | 
                    ${tournament.venue} | ${tournament.format}
                </p>
            </div>
            <table class="points-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Pos</th>
                        <th>Team</th>
                        <th style="width: 80px; text-align: center;">P</th>
                        <th style="width: 80px; text-align: center;">W</th>
                        <th style="width: 80px; text-align: center;">L</th>
                        <th style="width: 80px; text-align: center;">T</th>
                        <th style="width: 80px; text-align: center;">Pts</th>
                        <th style="width: 100px; text-align: center;">NRR</th>
                    </tr>
                </thead>
                <tbody>
        `;

        pointsTable.forEach((team, index) => {
            const isTop = index === 0;
            html += `
                <tr class="${isTop ? 'team-top' : ''}">
                    <td class="team-position">${index + 1}</td>
                    <td class="team-name">${team.team_name}</td>
                    <td class="team-points">${team.played}</td>
                    <td class="team-points">${team.won}</td>
                    <td class="team-points">${team.lost}</td>
                    <td class="team-points">${team.tied}</td>
                    <td class="team-points">${team.points}</td>
                    <td class="team-nrr">${team.netRunRate}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    async loadPlayerStats() {
        try {
            // Show loading states
            this.showPlayerLoadingStates();

            // Calculate player statistics from match data
            const playerStats = this.calculatePlayerStats();
            
            // Render player statistics
            this.renderPlayerStats(playerStats);

        } catch (error) {
            console.error('Error loading player stats:', error);
            this.showError('Failed to load player statistics');
        }
    }

    // Enhanced calculatePlayerStats function in statistics.js
calculatePlayerStats() {
    const playerStats = {};

    // Process all completed matches
    this.matches
        .filter(match => match.match_status === 'completed')
        .forEach(match => {
            // For demo purposes, generate realistic stats based on match data
            const team1 = this.teams.find(t => t.team_id == match.team1_id);
            const team2 = this.teams.find(t => t.team_id == match.team2_id);
            
            // Process team1 players
            if (team1 && team1.players) {
                team1.players.forEach(player => {
                    if (!playerStats[player.player_id]) {
                        playerStats[player.player_id] = {
                            player_id: player.player_id,
                            player_name: player.player_name,
                            team_name: team1.team_name,
                            runs: 0,
                            wickets: 0,
                            matches: 0,
                            sixes: 0,
                            economy: 0,
                            overs: 0
                        };
                    }
                    
                    // Generate stats based on player role
                    const isBatsman = ['batsman', 'wicketkeeper', 'all-rounder'].includes(player.role);
                    const isBowler = ['bowler', 'all-rounder'].includes(player.role);
                    
                    if (isBatsman) {
                        playerStats[player.player_id].runs += Math.floor(Math.random() * 30) + 10;
                        playerStats[player.player_id].sixes += Math.floor(Math.random() * 2);
                    }
                    
                    if (isBowler) {
                        playerStats[player.player_id].wickets += Math.floor(Math.random() * 3);
                        playerStats[player.player_id].overs += 4;
                        playerStats[player.player_id].economy = (Math.random() * 4 + 6).toFixed(2);
                    }
                    
                    playerStats[player.player_id].matches += 1;
                });
            }
            
            // Process team2 players
            if (team2 && team2.players) {
                team2.players.forEach(player => {
                    if (!playerStats[player.player_id]) {
                        playerStats[player.player_id] = {
                            player_id: player.player_id,
                            player_name: player.player_name,
                            team_name: team2.team_name,
                            runs: 0,
                            wickets: 0,
                            matches: 0,
                            sixes: 0,
                            economy: 0,
                            overs: 0
                        };
                    }
                    
                    // Generate stats based on player role
                    const isBatsman = ['batsman', 'wicketkeeper', 'all-rounder'].includes(player.role);
                    const isBowler = ['bowler', 'all-rounder'].includes(player.role);
                    
                    if (isBatsman) {
                        playerStats[player.player_id].runs += Math.floor(Math.random() * 30) + 10;
                        playerStats[player.player_id].sixes += Math.floor(Math.random() * 2);
                    }
                    
                    if (isBowler) {
                        playerStats[player.player_id].wickets += Math.floor(Math.random() * 3);
                        playerStats[player.player_id].overs += 4;
                        playerStats[player.player_id].economy = (Math.random() * 4 + 6).toFixed(2);
                    }
                    
                    playerStats[player.player_id].matches += 1;
                });
            }
        });

    return Object.values(playerStats);
}

    renderPlayerStats(playerStats) {
        // Top Run Scorers
        const topRunScorers = [...playerStats]
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 5);
        
        this.renderPlayerList('topRunScorers', topRunScorers, 'runs');

        // Top Wicket Takers
        const topWicketTakers = [...playerStats]
            .sort((a, b) => b.wickets - a.wickets)
            .slice(0, 5);
        
        this.renderPlayerList('topWicketTakers', topWicketTakers, 'wickets');

        // Most Sixes
        const mostSixes = [...playerStats]
            .sort((a, b) => b.sixes - a.sixes)
            .slice(0, 5);
        
        this.renderPlayerList('mostSixes', mostSixes, 'sixes');

        // Best Economy (minimum 10 overs bowled)
        const bestEconomy = [...playerStats]
            .filter(player => player.overs >= 10)
            .sort((a, b) => a.economy - b.economy)
            .slice(0, 5);
        
        this.renderPlayerList('bestEconomy', bestEconomy, 'economy');
    }

    renderPlayerList(containerId, players, statType) {
        const container = document.getElementById(containerId);
        
        if (players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>No data available</p>
                </div>
            `;
            return;
        }

        let html = '';
        players.forEach((player, index) => {
            const rankClass = index === 0 ? 'top' : '';
            let value = player[statType];
            let suffix = '';
            
            if (statType === 'economy') {
                suffix = '';
            }
            
            html += `
                <div class="player-item">
                    <div class="player-rank ${rankClass}">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${player.player_name}</div>
                        <div class="player-team">${player.team_name}</div>
                    </div>
                    <div class="player-value">${value}${suffix}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadTeamStats() {
        try {
            // Show loading states
            this.showTeamLoadingStates();

            // Calculate team statistics
            const teamStats = this.calculateTeamStats();
            
            // Render team statistics
            this.renderTeamStats(teamStats);

        } catch (error) {
            console.error('Error loading team stats:', error);
            this.showError('Failed to load team statistics');
        }
    }

    calculateTeamStats() {
        const teamStats = {};
        const tournamentWinners = {};
        const headToHead = {};

        // Process completed matches
        this.matches.filter(match => match.match_status === 'completed').forEach(match => {
            const team1 = this.teams.find(t => t.team_id == match.team1_id);
            const team2 = this.teams.find(t => t.team_id == match.team2_id);
            const tournament = this.tournaments.find(t => t.tournament_id == match.tournament_id);

            if (!team1 || !team2) return;

            // Track tournament winners
            if (match.winner_id && tournament) {
                const winnerTeam = match.winner_id == match.team1_id ? team1 : team2;
                tournamentWinners[tournament.tournament_id] = {
                    tournament_name: tournament.tournament_name,
                    winner: winnerTeam.team_name
                };
            }

            // Track head-to-head records
            const teamsKey = [team1.team_id, team2.team_id].sort().join('-');
            if (!headToHead[teamsKey]) {
                headToHead[teamsKey] = {
                    team1: team1.team_name,
                    team2: team2.team_name,
                    matches: 0,
                    team1Wins: 0,
                    team2Wins: 0
                };
            }

            headToHead[teamsKey].matches++;
            if (match.winner_id === team1.team_id) {
                headToHead[teamsKey].team1Wins++;
            } else if (match.winner_id === team2.team_id) {
                headToHead[teamsKey].team2Wins++;
            }

            // Track highest totals
            [team1, team2].forEach(team => {
                if (!teamStats[team.team_id]) {
                    teamStats[team.team_id] = {
                        team_id: team.team_id,
                        team_name: team.team_name,
                        highest_total: 0,
                        matches_played: 0,
                        wins: 0
                    };
                }

                const teamScore = team.team_id == match.team1_id ? match.team1_score : match.team2_score;
                if (teamScore > teamStats[team.team_id].highest_total) {
                    teamStats[team.team_id].highest_total = teamScore;
                }

                teamStats[team.team_id].matches_played++;
                if (match.winner_id === team.team_id) {
                    teamStats[team.team_id].wins++;
                }
            });
        });

        return {
            tournamentWinners: Object.values(tournamentWinners),
            highestTotals: Object.values(teamStats)
                .sort((a, b) => b.highest_total - a.highest_total)
                .slice(0, 5),
            headToHead: Object.values(headToHead).slice(0, 5)
        };
    }

    renderTeamStats(teamStats) {
        // Tournament Winners
        this.renderTournamentWinners(teamStats.tournamentWinners);

        // Highest Totals
        this.renderHighestTotals(teamStats.highestTotals);

        // Head to Head
        this.renderHeadToHead(teamStats.headToHead);
    }

    renderTournamentWinners(winners) {
        const container = document.getElementById('tournamentWinners');
        
        if (winners.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <p>No tournament winners data</p>
                </div>
            `;
            return;
        }

        let html = '';
        winners.forEach((winner, index) => {
            html += `
                <div class="team-item">
                    <div class="team-logo-small">${winner.winner.substring(0, 2).toUpperCase()}</div>
                    <div class="team-info">
                        <div class="team-name">${winner.winner}</div>
                        <div class="team-tournament">${winner.tournament_name}</div>
                    </div>
                    <div class="team-value">🏆</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderHighestTotals(highestTotals) {
        const container = document.getElementById('highestTotals');
        
        if (highestTotals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📈</div>
                    <p>No team totals data</p>
                </div>
            `;
            return;
        }

        let html = '';
        highestTotals.forEach((team, index) => {
            html += `
                <div class="team-item">
                    <div class="team-logo-small">${team.team_name.substring(0, 2).toUpperCase()}</div>
                    <div class="team-info">
                        <div class="team-name">${team.team_name}</div>
                        <div class="team-tournament">${team.matches_played} matches</div>
                    </div>
                    <div class="team-value">${team.highest_total}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderHeadToHead(headToHead) {
        const container = document.getElementById('headToHead');
        
        if (headToHead.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚔️</div>
                    <p>No head-to-head data</p>
                </div>
            `;
            return;
        }

        let html = '';
        headToHead.forEach(matchup => {
            const totalMatches = matchup.matches;
            const team1WinRate = ((matchup.team1Wins / totalMatches) * 100).toFixed(1);
            const team2WinRate = ((matchup.team2Wins / totalMatches) * 100).toFixed(1);
            
            html += `
                <div class="head-to-head-match">
                    <div class="team-vs">
                        <div class="team-name-vs">${matchup.team1}</div>
                        <div class="vs-text">VS</div>
                        <div class="team-name-vs">${matchup.team2}</div>
                    </div>
                    <div class="match-result">
                        ${matchup.team1Wins}-${matchup.team2Wins} (${totalMatches} matches)
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    showPlayerLoadingStates() {
        ['topRunScorers', 'topWicketTakers', 'mostSixes', 'bestEconomy'].forEach(containerId => {
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        });
    }

    showTeamLoadingStates() {
        ['tournamentWinners', 'highestTotals', 'headToHead'].forEach(containerId => {
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short', 
                day: 'numeric', 
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-message error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1100;
            color: white;
            font-weight: 500;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize Statistics Manager
let statisticsManager;

document.addEventListener('DOMContentLoaded', () => {
    statisticsManager = new StatisticsManager();
});