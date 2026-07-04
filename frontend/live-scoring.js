// Enhanced Match data structure
let matchData = {
    team1: {
        name: "Team A",
        score: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        innings: 1,
        players: [],
        isBatting: false
    },
    team2: {
        name: "Team B",
        score: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        innings: 2,
        players: [],
        isBatting: false
    },
    currentInnings: 1,
    tossWinner: '',
    tossDecision: '',
    tossCall: '',
    tossResult: '',
    batsmen: [],
    bowler: null,
    currentOver: [],
    matchHistory: [],
    commentary: [],
    ballByBall: [],
    target: 0,
    isTossCompleted: false,
    isMatchStarted: false,
    isFreeHit: false,
    matchCompleted: false,
    winningTeam: ''
};

// Boundary placement options for commentary
const boundaryPlacements = [
    "deep mid-wicket", "deep square leg", "deep point", "covers", "third man",
    "fine leg", "long on", "long off", "mid-wicket", "square leg",
    "point", "cover", "extra cover", "mid-off", "mid-on"
];

// Bat icons for different batsmen
const batIcons = ["🗡️", "🪓", "🚀", "🔧", "🔑", "🔫", "💎", "👑"];

// Initialize the live scoring
document.addEventListener('DOMContentLoaded', function() {
    // Get match details from URL parameters or set defaults
    const urlParams = new URLSearchParams(window.location.search);
    const team1 = urlParams.get('team1') || 'Team A';
    const team2 = urlParams.get('team2') || 'Team B';
    const tournament = urlParams.get('tournament') || 'Tournament Name';
    const venue = urlParams.get('venue') || 'Venue Name';
    const matchId = urlParams.get('matchId');
    
    // Update UI with match details
    document.getElementById('matchTeams').textContent = `${team1} vs ${team2}`;
    document.getElementById('matchTournament').textContent = tournament;
    document.getElementById('matchVenue').textContent = venue;
    document.getElementById('matchDate').textContent = new Date().toLocaleString();
    
    // Initialize match data
    matchData.team1.name = team1;
    matchData.team2.name = team2;
    
    // Load teams data and start toss process
    loadTeamsData(matchId);
});

// Load teams data from API
async function loadTeamsData(matchId) {
    try {
        const token = localStorage.getItem('ctms_token');
        const response = await fetch(`http://localhost:5000/api/matches/${matchId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const match = await response.json();
            
            // Load team1 players
            const team1Response = await fetch(`http://localhost:5000/api/teams/${match.team1_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (team1Response.ok) {
                const team1Data = await team1Response.json();
                matchData.team1.players = team1Data.players || [];
            }
            
            // Load team2 players
            const team2Response = await fetch(`http://localhost:5000/api/teams/${match.team2_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (team2Response.ok) {
                const team2Data = await team2Response.json();
                matchData.team2.players = team2Data.players || [];
            }
            
            // Start toss process
            startTossProcess();
        }
    } catch (error) {
        console.error('Error loading teams data:', error);
        // If API fails, use mock data and start toss
        initializeMockPlayers();
        startTossProcess();
    }
}

// Initialize mock players for demo
function initializeMockPlayers() {
    matchData.team1.players = [
        { player_id: 1, player_name: "David Warner", role: "batsman", batting_style: "Left-handed", bowling_style: null },
        { player_id: 2, player_name: "Rohit Sharma", role: "batsman", batting_style: "Right-handed", bowling_style: null },
        { player_id: 3, player_name: "Virat Kohli", role: "batsman", batting_style: "Right-handed", bowling_style: null },
        { player_id: 4, player_name: "Ben Stokes", role: "all-rounder", batting_style: "Left-handed", bowling_style: "Fast" },
        { player_id: 5, player_name: "MS Dhoni", role: "wicketkeeper", batting_style: "Right-handed", bowling_style: null },
        { player_id: 6, player_name: "Jasprit Bumrah", role: "bowler", batting_style: "Right-handed", bowling_style: "Fast" },
        { player_id: 7, player_name: "Rashid Khan", role: "bowler", batting_style: "Right-handed", bowling_style: "Leg-spin" }
    ];
    
    matchData.team2.players = [
        { player_id: 8, player_name: "Babar Azam", role: "batsman", batting_style: "Right-handed", bowling_style: null },
        { player_id: 9, player_name: "Kane Williamson", role: "batsman", batting_style: "Right-handed", bowling_style: null },
        { player_id: 10, player_name: "Steve Smith", role: "batsman", batting_style: "Right-handed", bowling_style: null },
        { player_id: 11, player_name: "Shakib Al Hasan", role: "all-rounder", batting_style: "Left-handed", bowling_style: "Left-arm spin" },
        { player_id: 12, player_name: "Jos Buttler", role: "wicketkeeper", batting_style: "Right-handed", bowling_style: null },
        { player_id: 13, player_name: "Trent Boult", role: "bowler", batting_style: "Right-handed", bowling_style: "Fast" },
        { player_id: 14, player_name: "Yuzvendra Chahal", role: "bowler", batting_style: "Right-handed", bowling_style: "Leg-spin" }
    ];
}

// Start toss process
function startTossProcess() {
    showTossCallModal();
}

// Show toss call modal - FIXED CENTERING
function showTossCallModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; margin: 0;">
            <div class="modal-header">
                <h2>🧢 Match Toss</h2>
            </div>
            <div class="modal-body" style="padding: 25px; text-align: center;">
                <div class="form-group">
                    <label class="form-label" style="margin-bottom: 15px; font-size: 1.1rem;">Which team is calling the toss:</label>
                    <select class="form-control" id="tossCallerSelect" style="margin-bottom: 25px;">
                        <option value="">Select Team</option>
                        <option value="${matchData.team1.name}">${matchData.team1.name}</option>
                        <option value="${matchData.team2.name}">${matchData.team2.name}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="margin-bottom: 15px; font-size: 1.1rem;">What are they calling:</label>
                    <div class="toss-options" style="display: flex; gap: 25px; justify-content: center; margin-top: 20px;">
                        <button class="btn toss-option-btn" onclick="selectTossCall('heads')">
                            <div class="coin-side heads">Heads</div>
                        </button>
                        <button class="btn toss-option-btn" onclick="selectTossCall('tails')">
                            <div class="coin-side tails">Tails</div>
                        </button>
                    </div>
                </div>
                <div id="tossCallDisplay" style="margin: 30px 0; font-size: 1.2rem; display: none; padding: 15px; background: rgba(0,0,0,0.1); border-radius: 10px;">
                    <strong id="callerTeam"></strong> calls <strong id="callType"></strong>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 25px;">
                    <button class="btn btn-primary" id="flipCoinBtn" onclick="flipCoin()" style="display: none; padding: 12px 30px; font-size: 1.1rem;">
                        Flip Coin
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Select toss call
function selectTossCall(call) {
    const caller = document.getElementById('tossCallerSelect').value;
    if (!caller) {
        alert('Please select which team is calling first');
        return;
    }
    
    matchData.tossCall = call;
    
    // Show the call display
    document.getElementById('tossCallDisplay').style.display = 'block';
    document.getElementById('callerTeam').textContent = caller;
    document.getElementById('callType').textContent = call;
    
    // Show flip coin button
    document.getElementById('flipCoinBtn').style.display = 'block';
    
    // Highlight selected option
    document.querySelectorAll('.toss-option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.toss-option-btn').classList.add('active');
}

// Enhanced flip coin animation with true randomization
function flipCoin() {
    const modalBody = document.querySelector('.modal-body');
    const existingCoin = document.getElementById('coinAnimation');
    if (existingCoin) {
        existingCoin.remove();
    }
    
    const coinContainer = document.createElement('div');
    coinContainer.id = 'coinAnimation';
    coinContainer.innerHTML = `
        <div class="coin" id="coin">
            <div class="coin-front">Heads</div>
            <div class="coin-back">Tails</div>
        </div>
        <div class="flipping-text">Flipping...</div>
    `;
    
    modalBody.appendChild(coinContainer);
    
    // Disable button during animation
    document.getElementById('flipCoinBtn').disabled = true;
    
    // Start coin flip animation
    const coin = document.getElementById('coin');
    coin.style.animation = 'flip 2s ease-in-out';
    
    // Enhanced randomization - true 50/50 chance regardless of call
    setTimeout(() => {
        // Generate cryptographically secure random number for true randomness
        const cryptoArray = new Uint32Array(1);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(cryptoArray);
            const randomValue = cryptoArray[0] / (0xFFFFFFFF + 1);
            const result = randomValue > 0.5 ? 'heads' : 'tails';
            matchData.tossResult = result;
        } else {
            // Fallback to Math.random with additional entropy
            const additionalEntropy = Date.now() % 1000;
            const randomValue = (Math.random() * 1000 + additionalEntropy) % 1;
            const result = randomValue > 0.5 ? 'heads' : 'tails';
            matchData.tossResult = result;
        }
        
        // Remove animation and show result
        coin.style.animation = 'none';
        coin.classList.add(matchData.tossResult === 'heads' ? 'heads-result' : 'tails-result');
        
        // Show toss result
        showTossResult();
    }, 2000);
}

// Show toss result
function showTossResult() {
    const caller = document.getElementById('tossCallerSelect').value;
    const isCallCorrect = matchData.tossCall === matchData.tossResult;
    matchData.tossWinner = isCallCorrect ? caller : (caller === matchData.team1.name ? matchData.team2.name : matchData.team1.name);
    
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="toss-result" style="text-align: center;">
            <div class="coin-final ${matchData.tossResult}-result">
                ${matchData.tossResult.toUpperCase()}
            </div>
            <h3 style="color: var(--primary); margin: 25px 0 15px 0;">Toss Result: ${matchData.tossResult.toUpperCase()}</h3>
            <p style="font-size: 1.1rem; margin-bottom: 10px;">
                <strong>${caller}</strong> called <strong>${matchData.tossCall}</strong>
            </p>
            <p style="font-size: 1.3rem; color: var(--success); font-weight: bold; margin: 20px 0 30px 0;">
                ${matchData.tossWinner} wins the toss!
            </p>
            <div class="form-group">
                <label class="form-label" style="margin-bottom: 15px; font-size: 1.1rem;">What does ${matchData.tossWinner} choose to do:</label>
                <select class="form-control" id="tossDecisionSelect" style="margin-bottom: 20px;">
                    <option value="">Select Decision</option>
                    <option value="bat">Bat First</option>
                    <option value="bowl">Bowl First</option>
                </select>
            </div>
            <div class="modal-actions" style="justify-content: center; margin-top: 25px;">
                <button class="btn btn-primary" onclick="completeToss()" style="padding: 12px 30px; font-size: 1.1rem;">Start Match</button>
            </div>
        </div>
    `;
}

// Complete toss and start match
function completeToss() {
    const tossDecision = document.getElementById('tossDecisionSelect').value;
    
    if (!tossDecision) {
        alert('Please select what the toss winner wants to do');
        return;
    }
    
    matchData.tossDecision = tossDecision;
    matchData.isTossCompleted = true;
    
    // Set batting and bowling teams based on toss
    if (tossDecision === 'bat') {
        matchData.team1.isBatting = (matchData.tossWinner === matchData.team1.name);
        matchData.team2.isBatting = (matchData.tossWinner === matchData.team2.name);
    } else {
        matchData.team1.isBatting = (matchData.tossWinner !== matchData.team1.name);
        matchData.team2.isBatting = (matchData.tossWinner !== matchData.team2.name);
    }
    
    // Remove toss modal
    document.querySelector('.modal').remove();
    
    // Add toss commentary
    addCommentary(`💫 TOSS: ${matchData.tossWinner} won the toss and chose to ${tossDecision} first`);
    
    // Show team selection modal
    showTeamSelectionModal();
}

// Show team selection modal for opening batsmen and bowler
function showTeamSelectionModal() {
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>📋 Team Selection</h2>
            </div>
            <div class="modal-body" style="padding: 25px;">
                <div class="form-group">
                    <label class="form-label">⚓️ ${battingTeam.name} - Select Opening Batsmen</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <select class="form-control" id="openingBatsman1" onchange="updateSecondBatsmanOptions()">
                            <option value="">Select Batsman 1</option>
                            ${getAvailableBatsmen(battingTeam).map(p => 
                                `<option value="${p.player_id}">${p.player_name} (${p.role})</option>`
                            ).join('')}
                        </select>
                        <select class="form-control" id="openingBatsman2">
                            <option value="">Select Batsman 2</option>
                            ${getAvailableBatsmen(battingTeam).map(p => 
                                `<option value="${p.player_id}">${p.player_name} (${p.role})</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 25px;">
                    <label class="form-label">🥎 ${bowlingTeam.name} - Select Opening Bowler</label>
                    <select class="form-control" id="openingBowler">
                        <option value="">Select Bowler</option>
                        ${getAvailableBowlers(bowlingTeam).map(p => 
                            `<option value="${p.player_id}">${p.player_name} (${p.bowling_style})</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="modal-actions" style="justify-content: center; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="startInnings()" style="padding: 12px 30px; font-size: 1.1rem;">Start Innings</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update second batsman options when first batsman is selected
function updateSecondBatsmanOptions() {
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const firstBatsmanId = document.getElementById('openingBatsman1').value;
    const secondBatsmanSelect = document.getElementById('openingBatsman2');
    
    // Store current selection
    const currentSelection = secondBatsmanSelect.value;
    
    // Clear and repopulate options
    secondBatsmanSelect.innerHTML = '<option value="">Select Batsman 2</option>';
    
    getAvailableBatsmen(battingTeam).forEach(player => {
        // Don't include the already selected first batsman
        if (player.player_id != firstBatsmanId) {
            const option = document.createElement('option');
            option.value = player.player_id;
            option.textContent = `${player.player_name} (${player.role})`;
            secondBatsmanSelect.appendChild(option);
        }
    });
    
    // Restore previous selection if it's still valid
    if (currentSelection && currentSelection !== firstBatsmanId) {
        secondBatsmanSelect.value = currentSelection;
    }
}

// Get available batsmen (excluding those who are already out or currently batting)
function getAvailableBatsmen(team) {
    return team.players.filter(player => 
        !matchData.batsmen.some(b => b.id === player.player_id)
    );
}

// Get available bowlers (including those who have bowled before)
function getAvailableBowlers(team) {
    return team.players.filter(player => 
        player.role === 'bowler' || player.role === 'all-rounder'
    );
}

// Start innings with selected players
function startInnings() {
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    const batsman1Id = document.getElementById('openingBatsman1').value;
    const batsman2Id = document.getElementById('openingBatsman2').value;
    const bowlerId = document.getElementById('openingBowler').value;
    
    if (!batsman1Id || !batsman2Id || !bowlerId) {
        alert('Please select all players');
        return;
    }
    
    if (batsman1Id === batsman2Id) {
        alert('Please select two different batsmen');
        return;
    }
    
    // Get selected players
    const batsman1 = battingTeam.players.find(p => p.player_id == batsman1Id);
    const batsman2 = battingTeam.players.find(p => p.player_id == batsman2Id);
    const bowler = bowlingTeam.players.find(p => p.player_id == bowlerId);
    
    // Initialize batsmen with different bat icons
    matchData.batsmen = [
        { 
            id: batsman1.player_id, 
            name: batsman1.player_name, 
            runs: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            isOut: false, 
            isOnStrike: true,
            role: batsman1.role,
            batting_style: batsman1.batting_style,
            batIcon: batIcons[0]
        },
        { 
            id: batsman2.player_id, 
            name: batsman2.player_name, 
            runs: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            isOut: false, 
            isOnStrike: false,
            role: batsman2.role,
            batting_style: batsman2.batting_style,
            batIcon: batIcons[1]
        }
    ];
    
    // Initialize bowler
    matchData.bowler = {
        id: bowler.player_id,
        name: bowler.player_name,
        overs: 0,
        runs: 0,
        wickets: 0,
        balls: 0,
        bowling_style: bowler.bowling_style,
        hasTakenHatTrick: false
    };
    
    matchData.isMatchStarted = true;
    
    // Remove selection modal
    document.querySelector('.modal').remove();
    
    // Add commentary
    addCommentary(`🏹 ${battingTeam.name} will bat first`);
    addCommentary(`🧔🏻 Opening batsmen: ${batsman1.player_name} and ${batsman2.player_name}`);
    addCommentary(`🏃‍♂️‍➡️ Opening bowler: ${bowler.player_name} (${bowler.bowling_style})`);
    
    // Update UI
    updateScoreboard();
    updateBatsmen();
    updateBowler();
    updateOverProgress();
    updateCommentary();
    updateTeamSquads();
    updateBallByBall();
    
    // Enable scoring controls
    document.querySelectorAll('.scoring-controls .btn').forEach(btn => {
        btn.disabled = false;
    });
}

// Add ball-by-ball record - FIXED FIRST OVER RECORDING
function addBallByBall(ballData) {
    const currentTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const striker = matchData.batsmen.find(b => b.isOnStrike && !b.isOut);
    
    // FIXED: Calculate proper over and ball numbers
    const overNumber = currentTeam.overs;
    const ballNumber = currentTeam.balls;
    
    const ballRecord = {
        over: overNumber,
        ball: ballNumber,
        bowler: matchData.bowler.name,
        batsman: striker ? striker.name : 'New Batsman',
        runs: ballData.runs || 0,
        extras: ballData.extras || 0,
        wicket: ballData.wicket || false,
        description: ballData.description || '',
        score: `${currentTeam.score}/${currentTeam.wickets}`,
        isExtra: ballData.isExtra || false,
        timestamp: new Date().toLocaleTimeString()
    };
    
    matchData.ballByBall.unshift(ballRecord);
    updateBallByBall();
}

// Update ball-by-ball display
function updateBallByBall() {
    const ballByBallContainer = document.getElementById('ballByBallContainer') || createBallByBallSection();
    ballByBallContainer.innerHTML = '';
    
    matchData.ballByBall.slice(0, 15).forEach(ball => {
        const ballElement = document.createElement('div');
        ballElement.className = 'ball-by-ball-item';
        
        let ballText = '';
        if (ball.wicket) {
            ballText = `Wicket! ${ball.bowler} to ${ball.batsman}`;
        } else if (ball.extras > 0) {
            ballText = `Extra: ${ball.bowler} to ${ball.batsman} - ${ball.extras} run(s)`;
        } else {
            ballText = `${ball.bowler} to ${ball.batsman} - ${ball.runs} run(s)`;
        }
        
        ballElement.innerHTML = `
            <div class="ball-over">${ball.over}.${ball.ball}</div>
            <div class="ball-description">${ballText}</div>
            <div class="ball-score">${ball.score}</div>
        `;
        ballByBallContainer.appendChild(ballElement);
    });
}

// Create ball-by-ball section
function createBallByBallSection() {
    const squadsSection = document.querySelector('.squads-section') || document.querySelector('.batsmen-section');
    const ballByBallSection = document.createElement('div');
    ballByBallSection.className = 'ball-by-ball-section';
    ballByBallSection.innerHTML = `
        <div class="section-title">📶 Ball by Ball</div>
        <div class="ball-by-ball-container" id="ballByBallContainer"></div>
    `;
    
    if (squadsSection) {
        squadsSection.parentNode.insertBefore(ballByBallSection, squadsSection.nextSibling);
    } else {
        document.querySelector('.container').appendChild(ballByBallSection);
    }
    
    return document.getElementById('ballByBallContainer');
}

// Add commentary with boundary placements
function addCommentary(text) {
    const currentTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    const commentary = {
        id: matchData.commentary.length + 1,
        text: text,
        timestamp: new Date().toLocaleTimeString(),
        over: `${currentTeam.overs}.${currentTeam.balls}`
    };
    matchData.commentary.unshift(commentary);
    updateCommentary();
}

// Update commentary UI
function updateCommentary() {
    const commentaryContainer = document.getElementById('commentaryContainer') || createCommentarySection();
    commentaryContainer.innerHTML = '';
    
    matchData.commentary.slice(0, 10).forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'commentary-item';
        commentElement.innerHTML = `
            <div class="commentary-time">${comment.timestamp} | Over ${comment.over}</div>
            <div class="commentary-text">${comment.text}</div>
        `;
        commentaryContainer.appendChild(commentElement);
    });
}

// Create commentary section
function createCommentarySection() {
    const scoreboard = document.querySelector('.scoreboard');
    const commentarySection = document.createElement('div');
    commentarySection.className = 'commentary-section';
    commentarySection.innerHTML = `
        <div class="section-title">🎙️ Live Commentary</div>
        <div class="commentary-container" id="commentaryContainer"></div>
    `;
    scoreboard.parentNode.insertBefore(commentarySection, scoreboard.nextSibling);
    return document.getElementById('commentaryContainer');
}

// Update team squads UI with correct team names and strikethrough for out batsmen
function updateTeamSquads() {
    const squadsContainer = document.getElementById('squadsContainer') || createSquadsSection();
    
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    squadsContainer.innerHTML = `
        <div class="squad-section">
            <div class="squad-title">🥷 ${battingTeam.name} - Batting</div>
            <div class="squad-players">
                ${battingTeam.players.map(player => {
                    const isActive = matchData.batsmen.some(b => b.id === player.player_id);
                    const isOut = matchData.batsmen.some(b => b.id === player.player_id && b.isOut);
                    const isOnStrike = matchData.batsmen.some(b => b.id === player.player_id && b.isOnStrike && !b.isOut);
                    
                    return `
                    <div class="player-item ${isActive ? 'active-player' : ''} ${isOut ? 'player-out' : ''}">
                        <span class="player-name ${isOut ? 'strikethrough' : ''}">
                            ${player.player_name}
                            ${isOnStrike ? ' <span class="strike-indicator">⚡</span>' : ''}
                        </span>
                        <span class="player-role">${player.role}</span>
                        ${isOut ? '<span class="player-out-icon">✗</span>' : ''}
                    </div>
                `}).join('')}
            </div>
        </div>
        
        <div class="squad-section">
            <div class="squad-title">⚾ ${bowlingTeam.name} - Bowling</div>
            <div class="squad-players">
                ${bowlingTeam.players.map(player => `
                    <div class="player-item ${matchData.bowler && matchData.bowler.id === player.player_id ? 'active-bowler' : ''}">
                        <span class="player-name">${player.player_name}</span>
                        <span class="player-role">${player.role}</span>
                        ${player.bowling_style ? `<span class="bowling-style">${player.bowling_style}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Create squads section
function createSquadsSection() {
    const batsmenSection = document.querySelector('.batsmen-section');
    const squadsSection = document.createElement('div');
    squadsSection.className = 'squads-section';
    squadsSection.innerHTML = `
        <div class="section-title">🛡️ Team Squads</div>
        <div class="squads-container" id="squadsContainer"></div>
    `;
    batsmenSection.parentNode.insertBefore(squadsSection, batsmenSection.nextSibling);
    return document.getElementById('squadsContainer');
}

// Enhanced score runs function with CricHeroes-style animations
function scoreRun(runs) {
    if (matchData.matchCompleted) {
        alert('Match is already completed!');
        return;
    }
    
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    const striker = matchData.batsmen.find(b => b.isOnStrike && !b.isOut);
    
    if (!striker) {
        alert('No batsman on strike! Please select a new batsman first.');
        return;
    }
    
    // Update team score
    currentTeam.score += runs;
    
    // Only count as a ball if it's not an extra (except bye)
    if (!matchData.isFreeHit) {
        currentTeam.balls++;
    }
    
    // Update batsman stats
    striker.runs += runs;
    if (!matchData.isFreeHit) {
        striker.balls++;
    }
    
    if (runs === 4) {
        striker.fours++;
        // Add CricHeroes-style four animation
        showCricHeroesBoundaryAnimation('4');
    }
    if (runs === 6) {
        striker.sixes++;
        // Add CricHeroes-style six animation
        showCricHeroesBoundaryAnimation('6');
    }
    
    // Update bowler stats (only count runs against bowler, not balls for extras)
    matchData.bowler.runs += runs;
    if (!matchData.isFreeHit) {
        matchData.bowler.balls++;
    }
    
    // Add to current over (only count as a ball if it's not an extra)
    if (!matchData.isFreeHit) {
        matchData.currentOver.push({ type: 'run', runs: runs });
    }
    
    // Add commentary based on runs with boundary placements
    let commentary = '';
    if (runs === 0) {
        commentary = `Dot ball! ${matchData.bowler.name} to ${striker.name}, good length, defended.`;
    } else if (runs === 1) {
        commentary = `Single taken. ${matchData.bowler.name} to ${striker.name}, pushed into the gap.`;
    } else if (runs === 2) {
        commentary = `Two runs! ${matchData.bowler.name} to ${striker.name}, well placed in the outfield.`;
    } else if (runs === 3) {
        commentary = `Three runs! Excellent running between the wickets by ${striker.name}.`;
    } else if (runs === 4) {
        const placement = boundaryPlacements[Math.floor(Math.random() * boundaryPlacements.length)];
        commentary = `FOUR! Beautiful shot by ${striker.name} off ${matchData.bowler.name}'s bowling through ${placement}!`;
    } else if (runs === 6) {
        const placement = boundaryPlacements[Math.floor(Math.random() * boundaryPlacements.length)];
        commentary = `SIX! Massive hit by ${striker.name} over ${placement}! That's out of the ground!`;
    }
    
    addCommentary(commentary);
    addBallByBall({
        runs: runs,
        description: commentary,
        isExtra: matchData.isFreeHit
    });
    
    // Reset free hit after it's been used
    if (matchData.isFreeHit) {
        matchData.isFreeHit = false;
        addCommentary(`Free hit completed.`);
    }
    
    // Update UI
    updateScoreboard();
    updateBatsmen();
    updateBowler();
    updateOverProgress();
    updateTeamSquads();
    
    // Change strike if runs are 1, 3, or 5 (odd runs)
    if (runs % 2 === 1) {
        swapStrike();
    }
    
    // Check if target is achieved in second innings
    if (currentInnings === 2 && currentTeam.score >= matchData.target) {
        setTimeout(() => {
            completeMatch();
        }, 1000);
        return;
    }
    
    // Check if over is completed (only count proper balls)
    if (matchData.currentOver.length === 6 && !matchData.isFreeHit) {
        setTimeout(() => {
            endOver();
        }, 1000);
    }
}

// CricHeroes-style boundary animation (showing only 4 or 6) with better colors
function showCricHeroesBoundaryAnimation(runs) {
    const animation = document.createElement('div');
    animation.className = `cricheroes-boundary-animation boundary-${runs}`;
    animation.innerHTML = `
        <div class="boundary-number">${runs}</div>
        <div class="boundary-glow"></div>
        <div class="boundary-particles"></div>
    `;
    
    document.body.appendChild(animation);
    
    // Remove animation after it completes
    setTimeout(() => {
        animation.remove();
    }, 2500);
}

// Enhanced add extras function with proper ball counting - FIXED FREE HIT COUNTING
function addExtra(extraType) {
    if (matchData.matchCompleted) {
        alert('Match is already completed!');
        return;
    }
    
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    const striker = matchData.batsmen.find(b => b.isOnStrike && !b.isOut);
    
    if (!striker) {
        alert('No batsman on strike! Please select a new batsman first.');
        return;
    }
    
    let extraRuns = 1;
    let countAsBall = false;
    
    switch (extraType) {
        case 'wide':
            extraRuns = 1;
            countAsBall = false; // Wide doesn't count as a ball
            break;
        case 'noball':
            extraRuns = 1; // No ball (1 run)
            countAsBall = false; // No ball doesn't count as a ball
            matchData.isFreeHit = true; // Next ball is a free hit
            break;
        case 'bye':
            extraRuns = 1;
            countAsBall = true; // Bye counts as a ball
            // Add bye run to striker's score
            striker.runs += extraRuns;
            striker.balls++;
            break;
        case 'legbye':
            extraRuns = 1;
            countAsBall = true; // Leg bye counts as a ball
            break;
    }
    
    // Update team score
    currentTeam.score += extraRuns;
    
    // Update balls count only for bye and leg bye - FIXED: Free hit balls are counted
    if (countAsBall || matchData.isFreeHit) {
        currentTeam.balls++;
        matchData.bowler.balls++;
    }
    
    // Update bowler stats (except for byes and leg byes)
    if (extraType !== 'bye' && extraType !== 'legbye') {
        matchData.bowler.runs += extraRuns;
    }
    
    // Add to current over (count as a ball for bye/leg bye AND free hit deliveries) - FIXED
    if (countAsBall || matchData.isFreeHit) {
        matchData.currentOver.push({ type: extraType, isFreeHit: matchData.isFreeHit });
    }
    
    // Add commentary based on extra type
    let commentary = '';
    switch (extraType) {
        case 'wide':
            commentary = `Wide! ${matchData.bowler.name} bowls it too wide, extra run given.`;
            break;
        case 'noball':
            commentary = `No ball! ${matchData.bowler.name} oversteps, free hit coming up!`;
            break;
        case 'bye':
            commentary = `Bye! The batsmen take a quick single. ${striker.name} gets the run.`;
            break;
        case 'legbye':
            commentary = `Leg bye! Off the pads and they scamper through.`;
            break;
    }
    
    addCommentary(commentary);
    addBallByBall({
        extras: extraRuns,
        description: commentary,
        isExtra: true
    });
    
    // Update UI
    updateScoreboard();
    updateBowler();
    updateOverProgress();
    updateBatsmen(); // Update batsmen for bye runs
    
    // Check if target is achieved in second innings
    if (currentInnings === 2 && currentTeam.score >= matchData.target) {
        setTimeout(() => {
            completeMatch();
        }, 1000);
        return;
    }
    
    // Check if over is completed (for bye/leg bye and free hit deliveries which count as balls) - FIXED
    if ((countAsBall || matchData.isFreeHit) && matchData.currentOver.length === 6) {
        setTimeout(() => {
            endOver();
        }, 1000);
    }
}

// Enhanced take wicket function with hat-trick detection - FIXED proper hat-trick logic
function takeWicket() {
    if (matchData.matchCompleted) {
        alert('Match is already completed!');
        return;
    }
    
    // Check if it's a free hit (no wicket on free hit except run out)
    if (matchData.isFreeHit) {
        addCommentary(`No wicket! It's a free hit delivery. Only run out can dismiss the batsman.`);
        return;
    }
    
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    const striker = matchData.batsmen.find(b => b.isOnStrike && !b.isOut);
    
    if (!striker) {
        alert('No batsman on strike!');
        return;
    }
    
    // Store the out batsman's name for commentary
    const outBatsmanName = striker.name;
    
    // Update team wickets
    currentTeam.wickets++;
    currentTeam.balls++;
    
    // Mark batsman as out and remove from strike
    striker.isOut = true;
    striker.isOnStrike = false;
    
    // Update bowler stats
    matchData.bowler.wickets++;
    matchData.bowler.balls++;
    
    // Check for hat-trick - FIXED: Proper cricket hat-trick logic
    // Get last 2 balls from ballByBall (not current over) to check for consecutive wickets
    const recentBalls = matchData.ballByBall.slice(0, 2); // Get last 2 balls
    
    // Check if last 2 balls were wickets by the same bowler
    const lastTwoWereWickets = recentBalls.length === 2 && 
                               recentBalls[0].wicket && 
                               recentBalls[1].wicket &&
                               recentBalls[0].bowler === matchData.bowler.name &&
                               recentBalls[1].bowler === matchData.bowler.name;
    
    const isHatTrick = lastTwoWereWickets;
    
    // Add to current over
    matchData.currentOver.push({ type: 'wicket' });
    
    // Add commentary
    let commentary = `WICKET! ${matchData.bowler.name} gets ${outBatsmanName} out! ${currentTeam.name} are ${currentTeam.score}/${currentTeam.wickets}`;
    
    if (isHatTrick) {
        commentary = `HAT-TRICK! 🎩 ${matchData.bowler.name} takes a hat-trick! ${outBatsmanName} is the third victim!`;
        showHatTrickAnimation();
        
        // FIXED: Add hat-trick achievement to prevent multiple animations
        matchData.bowler.hasTakenHatTrick = true;
    }
    
    addCommentary(commentary);
    addBallByBall({
        wicket: true,
        description: commentary
    });
    
    // Update UI first
    updateScoreboard();
    updateBowler();
    updateOverProgress();
    updateTeamSquads();
    updateBatsmen();
    
    // If all wickets are taken, end innings
    if (currentTeam.wickets >= 10) {
        setTimeout(() => {
            // FIXED: Show proper message with correct score
            addCommentary(`All out! ${currentTeam.name} scored ${currentTeam.score}/${currentTeam.wickets}`);
            endInnings();
        }, 1500);
    } else {
        // Select new batsman immediately
        setTimeout(() => {
            selectNewBatsman();
        }, 1000);
    }
}

// Hat-trick animation function
function showHatTrickAnimation() {
    const animation = document.createElement('div');
    animation.className = 'hat-trick-animation';
    animation.innerHTML = `
        <div class="hat-trick-content">
            <div class="hat-icon">🎩</div>
            <div class="hat-trick-text">HAT-TRICK!</div>
            <div class="bowler-name">${matchData.bowler.name}</div>
        </div>
    `;
    
    document.body.appendChild(animation);
    
    // Remove animation after it completes
    setTimeout(() => {
        animation.remove();
    }, 3000);
}

// Add CSS for hat-trick animation
const hatTrickCSS = `
.hat-trick-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: hatTrickFadeIn 0.5s ease;
}

.hat-trick-content {
    text-align: center;
    color: white;
    animation: hatTrickZoom 1s ease-in-out;
}

.hat-icon {
    font-size: 8rem;
    margin-bottom: 20px;
    animation: hatBounce 1s ease-in-out infinite;
}

.hat-trick-text {
    font-size: 4rem;
    font-weight: bold;
    color: #00ff00;
    text-shadow: 0 0 20px #00ff00;
    margin-bottom: 10px;
    animation: textGlow 1.5s ease-in-out infinite;
}

.bowler-name {
    font-size: 1.2rem;
    color: orange;
}

@keyframes hatTrickFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes hatTrickZoom {
    0% { transform: scale(0.1) rotate(-180deg); }
    50% { transform: scale(1.2) rotate(0deg); }
    70% { transform: scale(0.9) rotate(0deg); }
    100% { transform: scale(1) rotate(0deg); }
}

@keyframes hatBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

@keyframes textGlow {
    0%, 100% { text-shadow: 0 0 20px #00ff00; }
    50% { text-shadow: 0 0 30px #00ff00, 0 0 40px #00ff00; }
}
`;

// Inject hat-trick CSS
const hatTrickStyle = document.createElement('style');
hatTrickStyle.textContent = hatTrickCSS;
document.head.appendChild(hatTrickStyle);

// Enhanced select new batsman function - FIXED to properly handle batsman replacement
function selectNewBatsman() {
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    
    // Get available batsmen (only those not currently batting and not out)
    const availableBatsmen = getAvailableBatsmenForNewSelection(battingTeam);
    
    if (availableBatsmen.length === 0) {
        // No more batsmen available, end innings
        setTimeout(() => {
            alert(`All out! ${battingTeam.name} scored ${battingTeam.score}/${battingTeam.wickets}`);
            endInnings();
        }, 1000);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h2>🔄 New Batsman</h2>
            </div>
            <div class="modal-body" style="padding: 25px;">
                <div class="form-group">
                    <label class="form-label">Select new batsman to replace the dismissed batsman:</label>
                    <select class="form-control" id="newBatsmanSelect">
                        <option value="">Select New Batsman</option>
                        ${availableBatsmen.map(p => `<option value="${p.player_id}">${p.player_name} (${p.role})</option>`).join('')}
                    </select>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        ${availableBatsmen.length} batsmen available (excluding dismissed and non-striker)
                    </div>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 25px;">
                    <button class="btn btn-primary" onclick="addNewBatsman()" style="padding: 10px 25px;">Continue</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Get available batsmen for new selection - FIXED TO EXCLUDE DISMISSED AND NON-STRIKER BATSMEN
function getAvailableBatsmenForNewSelection(team) {
    return team.players.filter(player => {
        // Check if player is already in batsmen list
        const existingBatsman = matchData.batsmen.find(b => b.id === player.player_id);
        
        // Include player only if they are NOT in the batsmen list OR if they are in the list but are NOT out AND NOT the non-striker
        if (!existingBatsman) {
            return true; // Player hasn't batted yet
        }
        
        if (existingBatsman.isOut) {
            return false; // Player is dismissed
        }
        
        // Check if player is the non-striker
        const isNonStriker = !existingBatsman.isOnStrike;
        return !isNonStriker; // Exclude non-striker
    });
}

// Add new batsman to the crease - FIXED to properly handle batsman replacement
function addNewBatsman() {
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const newBatsmanId = document.getElementById('newBatsmanSelect').value;
    
    if (!newBatsmanId) {
        alert('Please select a new batsman');
        return;
    }
    
    const newBatsman = battingTeam.players.find(p => p.player_id == newBatsmanId);
    
    if (!newBatsman) {
        alert('Selected batsman not found in team');
        return;
    }
    
    // Find if this batsman is already in the list but out
    const existingOutBatsmanIndex = matchData.batsmen.findIndex(b => b.id === newBatsman.player_id && b.isOut);
    
    if (existingOutBatsmanIndex !== -1) {
        // Reactivate the out batsman - reset stats and mark as on strike
        matchData.batsmen[existingOutBatsmanIndex] = {
            ...matchData.batsmen[existingOutBatsmanIndex],
            isOut: false,
            isOnStrike: true, // New batsman comes to striker end
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            batIcon: batIcons[matchData.batsmen.filter(b => !b.isOut).length % batIcons.length]
        };
        addCommentary(`🔄 ${newBatsman.player_name} returns to the crease at striker's end.`);
    } else {
        // Add completely new batsman at striker end
        matchData.batsmen.push({
            id: newBatsman.player_id,
            name: newBatsman.player_name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            isOnStrike: true, // New batsman always comes to striker end
            role: newBatsman.role,
            batting_style: newBatsman.batting_style,
            batIcon: batIcons[matchData.batsmen.filter(b => !b.isOut).length % batIcons.length]
        });
        addCommentary(`🔄 New batsman ${newBatsman.player_name} comes to the crease at striker's end.`);
    }
    
    // Remove modal
    document.querySelector('.modal').remove();
    
    // Update UI
    updateBatsmen();
    updateTeamSquads();
    updateScoreboard();
}

// Enhanced end over function with reset capability
function endOver() {
    // Reset current over
    matchData.currentOver = [];
    
    // Update overs count
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    currentTeam.overs++;
    currentTeam.balls = 0; // Reset balls for new over
    
    // Reset free hit at the end of over
    matchData.isFreeHit = false;
    
    // Add commentary
    addCommentary(`Over complete! ${currentTeam.name} are ${currentTeam.score}/${currentTeam.wickets} after ${currentTeam.overs} overs.`);
    
    // Swap strike at the end of over
    swapStrike();
    
    // Change bowler after over
    setTimeout(() => {
        changeBowler();
    }, 1000);
    
    // Update UI
    updateScoreboard();
    updateOverProgress();
}

// Manually end over (when End Over button is pressed)
function manualEndOver() {
    if (matchData.matchCompleted) {
        alert('Match is already completed!');
        return;
    }
    
    if (matchData.currentOver.length === 0) {
        alert('No balls have been bowled in this over yet!');
        return;
    }
    
    // Reset current over
    matchData.currentOver = [];
    
    // Update overs count
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    currentTeam.overs++;
    currentTeam.balls = 0; // Reset balls for new over
    
    // Reset free hit at the end of over
    matchData.isFreeHit = false;
    
    // Add commentary
    addCommentary(`Over manually ended! ${currentTeam.name} are ${currentTeam.score}/${currentTeam.wickets} after ${currentTeam.overs} overs.`);
    
    // Swap strike at the end of over
    swapStrike();
    
    // Change bowler after over
    setTimeout(() => {
        changeBowler();
    }, 1000);
    
    // Update UI
    updateScoreboard();
    updateOverProgress();
}

// Change bowler
function changeBowler() {
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    const availableBowlers = getAvailableBowlers(bowlingTeam).filter(player => 
        player.player_id !== matchData.bowler.id
    );
    
    if (availableBowlers.length === 0) {
        // If no new bowlers available, keep the same bowler
        addCommentary(`No bowling change. ${matchData.bowler.name} continues.`);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>🔄 Change Bowler</h2>
            </div>
            <div class="modal-body" style="padding: 25px;">
                <div class="form-group">
                    <label class="form-label">Select new bowler:</label>
                    <select class="form-control" id="newBowlerSelect">
                        <option value="">Select Bowler</option>
                        ${availableBowlers.map(p => `<option value="${p.player_id}">${p.player_name} (${p.bowling_style})</option>`).join('')}
                    </select>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="addNewBowler()">Continue</button>
                    <button class="btn btn-secondary" onclick="keepCurrentBowler()" style="margin-left: 10px;">Keep Current</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Keep current bowler (when user chooses not to change)
function keepCurrentBowler() {
    addCommentary(`No bowling change. ${matchData.bowler.name} continues.`);
    document.querySelector('.modal').remove();
}

// Add new bowler
function addNewBowler() {
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    const newBowlerId = document.getElementById('newBowlerSelect').value;
    
    if (!newBowlerId) {
        alert('Please select a new bowler');
        return;
    }
    
    const newBowler = bowlingTeam.players.find(p => p.player_id == newBowlerId);
    
    // Update bowler
    matchData.bowler = {
        id: newBowler.player_id,
        name: newBowler.player_name,
        overs: 0,
        runs: 0,
        wickets: 0,
        balls: 0,
        bowling_style: newBowler.bowling_style
    };
    
    addCommentary(`Change of bowling. ${newBowler.player_name} comes into the attack.`);
    
    // Remove modal
    document.querySelector('.modal').remove();
    
    updateBowler();
    updateTeamSquads();
}

// Enhanced end innings function with proper target calculation and innings ended interface
function endInnings() {
    const currentInnings = matchData.currentInnings;
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    console.log(`Ending innings: Innings ${currentInnings}, ${battingTeam.name}: ${battingTeam.score}/${battingTeam.wickets}`); // Debug log
    
    if (currentInnings === 1) {
        // Set target for second innings - FIXED: Target is battingTeam.score + 1
        matchData.target = battingTeam.score + 1;
        
        console.log(`Target set: ${matchData.target}`); // Debug log
        
        // Show innings ended interface
        showInningsEndInterface(
            `First Innings Over!`,
            `${battingTeam.name}: ${battingTeam.score}/${battingTeam.wickets}`,
            `${bowlingTeam.name} needs ${matchData.target} runs to win`
        );
        
        // After delay, switch to second innings
        setTimeout(() => {
            // Remove the innings end modal
            const overlay = document.querySelector('.innings-end-overlay');
            if (overlay) overlay.remove();
            
            // Switch innings
            matchData.currentInnings = 2;
            matchData.team1.isBatting = !matchData.team1.isBatting;
            matchData.team2.isBatting = !matchData.team2.isBatting;
            
            // Reset for new innings
            matchData.currentOver = [];
            matchData.batsmen = [];
            matchData.bowler = null;
            matchData.isFreeHit = false;
            
            // Update UI
            updateScoreboard();
            
            // Start second innings team selection
            showTeamSelectionModal();
        }, 3000);
        
    } else {
        // Match completed - team batting second didn't reach target
        matchData.matchCompleted = true;
        const firstInningsTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
        matchData.winningTeam = firstInningsTeam.name;
        const margin = matchData.target - battingTeam.score - 1;
        
        const resultText = `${matchData.winningTeam} wins by ${margin} runs!`;
        
        // Show match result interface
        showMatchResult(resultText);
        
        // Disable scoring controls
        document.querySelectorAll('.scoring-controls .btn').forEach(btn => {
            btn.disabled = true;
        });
    }
}

// Enhanced complete match function with wickets in hand - FIXED DISPLAY
function completeMatch() {
    if (matchData.matchCompleted) return;
    
    matchData.matchCompleted = true;
    const currentTeam = matchData.currentInnings === 1 ? matchData.team1 : matchData.team2;
    matchData.winningTeam = currentTeam.name;
    const wicketsLeft = 10 - currentTeam.wickets;
    
    // FIXED: Proper win message with wickets remaining
    const resultText = `${matchData.winningTeam} wins by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
    
    addCommentary(`🔦 MATCH RESULT: ${resultText}`);
    showMatchResult(resultText);
    
    // Disable scoring controls
    document.querySelectorAll('.scoring-controls .btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Update UI
    updateScoreboard();
}

// NEW FUNCTION: Show innings ended interface similar to toss/batsman selection
function showInningsEndInterface(title, score, message) {
    const overlay = document.createElement('div');
    overlay.className = 'innings-end-overlay';
    overlay.innerHTML = `
        <div class="innings-end-modal">
            <div class="modal-header">
                <h2>${title}</h2>
            </div>
            <div class="modal-body" style="text-align: center; padding: 30px;">
                <div class="score-summary" style="background: rgba(0,0,0,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary); margin-bottom: 10px;">
                        ${score}
                    </div>
                    <div style="font-size: 1.2rem; color: #333;">
                        ${message}
                    </div>
                </div>
                <div class="innings-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #666;">Overs</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${Math.floor(matchData.team1.balls / 6)}.${matchData.team1.balls % 6}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #666;">Run Rate</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">
                            ${(matchData.team1.score / (matchData.team1.overs + matchData.team1.balls / 6)).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="this.closest('.innings-end-overlay').remove();" style="padding: 12px 30px;">
                        Continue to Next Innings
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Manually end innings (button click) - FIXED
function manualEndInnings() {
    if (matchData.matchCompleted) {
        alert('Match is already completed!');
        return;
    }
    
    const currentInnings = matchData.currentInnings;
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    if (currentInnings === 1) {
        if (confirm(`Are you sure you want to end ${battingTeam.name}'s innings? They have scored ${battingTeam.score}/${battingTeam.wickets}`)) {
            // Set target for second innings - FIXED: Target is battingTeam.score + 1
            matchData.target = battingTeam.score + 1;
            
            // Show innings ended interface (same as automatic end)
            showInningsEndInterface(
                `First Innings Over!`,
                `${battingTeam.name}: ${battingTeam.score}/${battingTeam.wickets}`,
                `${bowlingTeam.name} needs ${matchData.target} runs to win`
            );
            
            // After delay, switch to second innings
            setTimeout(() => {
                // Remove the innings end modal
                const overlay = document.querySelector('.innings-end-overlay');
                if (overlay) overlay.remove();
                
                // Switch innings
                matchData.currentInnings = 2;
                matchData.team1.isBatting = !matchData.team1.isBatting;
                matchData.team2.isBatting = !matchData.team2.isBatting;
                
                // Reset for new innings
                matchData.currentOver = [];
                matchData.batsmen = [];
                matchData.bowler = null;
                matchData.isFreeHit = false;
                
                // Update UI
                updateScoreboard();
                
                // Start second innings team selection
                showTeamSelectionModal();
            }, 3000);
        }
    } else {
        // In second innings - ONLY allow manual end if team cannot reach target (declaration/forfeit)
        if (battingTeam.score >= matchData.target) {
            alert(`${battingTeam.name} has already reached the target! The match is completed.`);
            return;
        }
        
        if (confirm(`Are you sure you want to declare innings? ${battingTeam.name} has scored ${battingTeam.score}/${battingTeam.wickets} and needs ${matchData.target - battingTeam.score} more runs to win. This will result in ${bowlingTeam.name} winning.`)) {
            // Team batting second declares - first innings team wins
            const firstInningsTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
            matchData.winningTeam = firstInningsTeam.name;
            const margin = matchData.target - battingTeam.score - 1;
            
            const resultText = `${matchData.winningTeam} wins by ${margin} runs!`;
            
            addCommentary(`🏆 MATCH RESULT: ${resultText}`);
            showMatchResult(resultText);
            
            matchData.matchCompleted = true;
            
            // Disable scoring controls
            document.querySelectorAll('.scoring-controls .btn').forEach(btn => {
                btn.disabled = true;
            });
        }
    }
}

// Debug function to check match state
function debugMatchState() {
    console.log('=== MATCH DEBUG INFO ===');
    console.log('Current Innings:', matchData.currentInnings);
    console.log('Team1:', matchData.team1.name, 'Score:', matchData.team1.score, 'Wickets:', matchData.team1.wickets, 'Batting:', matchData.team1.isBatting);
    console.log('Team2:', matchData.team2.name, 'Score:', matchData.team2.score, 'Wickets:', matchData.team2.wickets, 'Batting:', matchData.team2.isBatting);
    console.log('Target:', matchData.target);
    console.log('Match Completed:', matchData.matchCompleted);
    console.log('=======================');
}

// NEW FUNCTION: Show innings ended interface similar to toss/batsman selection
function showInningsEndInterface(title, score, message) {
    const currentInnings = matchData.currentInnings;
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    
    const overlay = document.createElement('div');
    overlay.className = 'innings-end-overlay';
    overlay.innerHTML = `
        <div class="innings-end-modal">
            <div class="modal-header">
                <h2>${title}</h2>
            </div>
            <div class="modal-body" style="text-align: center; padding: 30px;">
                <div class="score-summary" style="background: rgba(0,0,0,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary); margin-bottom: 10px;">
                        ${score}
                    </div>
                    <div style="font-size: 1.2rem; color: #333;">
                        ${message}
                    </div>
                </div>
                <div class="innings-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #666;">Overs</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${Math.floor(battingTeam.overs)}.${battingTeam.balls}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #666;">Run Rate</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">
                            ${(battingTeam.score / (battingTeam.overs + battingTeam.balls / 6)).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="this.closest('.innings-end-overlay').remove(); debugMatchState();" style="padding: 12px 30px;">
                        Continue to Next Innings
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Show target display after first innings
function showTargetDisplay() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div class="modal-header">
                <h2>⏳ Target Set</h2>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div style="font-size: 2rem; color: var(--primary); font-weight: bold; margin-bottom: 20px;">
                    ${matchData.target} RUNS
                </div>
                <p style="font-size: 1.2rem; margin-bottom: 10px;">
                    ${matchData.team2.name} needs ${matchData.target} runs to win
                </p>
                <p style="font-size: 1.1rem; color: #666;">
                    Required Run Rate: ${(matchData.target / 20).toFixed(2)}
                </p>
                <div class="modal-actions" style="justify-content: center; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove();" style="padding: 12px 30px; font-size: 1.1rem;">
                        Start Second Innings
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show match result - FIXED TO SHOW PROPER INTERFACE
function showMatchResult(resultText) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div class="modal-header" style="background: rgba(0,0,0,0.2);">
                <h2 style="color: white; margin: 0;">🤝🏻 Match Completed</h2>
            </div>
            <div class="modal-body" style="padding: 40px 30px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🏆</div>
                <div style="font-size: 2.5rem; color: #FFD700; font-weight: bold; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    ${matchData.winningTeam}
                </div>
                <p style="font-size: 1.8rem; margin-bottom: 25px; color: #FFFFFF; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                    ${resultText}
                </p>
                <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin-bottom: 25px; backdrop-filter: blur(10px);">
                    <div style="font-weight: bold; margin-bottom: 15px; font-size: 1.3rem; color: #FFD700;">Final Scores</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 1.2rem;">
                        <div style="text-align: right; font-weight: 600;">${matchData.team1.name}:</div>
                        <div style="text-align: left;">${matchData.team1.score}/${matchData.team1.wickets}</div>
                        <div style="text-align: right; font-weight: 600;">${matchData.team2.name}:</div>
                        <div style="text-align: left;">${matchData.team2.score}/${matchData.team2.wickets}</div>
                    </div>
                </div>
                <div class="modal-actions" style="justify-content: center; margin-top: 25px;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); location.reload();" style="padding: 15px 40px; font-size: 1.2rem; background: rgba(255,215,0,0.9); color: #8B6914; border: none; border-radius: 25px; font-weight: bold;">
                        Start New Match
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // FIXED: Remove CRR and Required Run Rate display after match completion
    setTimeout(() => {
        const crrElement = document.getElementById('currentRunRate');
        const reqElement = document.getElementById('requiredRunRate');
        const ballsElement = document.getElementById('ballsRemaining');
        
        if (crrElement) crrElement.textContent = '-';
        if (reqElement) reqElement.textContent = '-';
        if (ballsElement) ballsElement.textContent = '-';
    }, 100);
}

// Update scoreboard UI with target display - FIXED BATTING TEAM DISPLAY
function updateScoreboard() {
    const currentInnings = matchData.currentInnings;
    const battingTeam = matchData.team1.isBatting ? matchData.team1 : matchData.team2;
    const bowlingTeam = matchData.team1.isBatting ? matchData.team2 : matchData.team1;
    
    // Update innings title with correct batting team name - FIXED
    document.getElementById('inningsTitle').textContent = 
        `${battingTeam.name} - Innings ${currentInnings} ${battingTeam.score}/${battingTeam.wickets}`;
    
    document.getElementById('scoreDisplay').textContent = 
        `${battingTeam.score}/${battingTeam.wickets}`;
    
    // Calculate current run rate based on overs.balls format
    const totalBalls = battingTeam.overs * 6 + battingTeam.balls;
    const crr = totalBalls > 0 ? (battingTeam.score / totalBalls * 6).toFixed(2) : '0.00';
    document.getElementById('currentRunRate').textContent = crr;
    
    // Calculate required run rate for second innings
    if (currentInnings === 2) {
        const ballsRemaining = 120 - totalBalls; // Assuming 20 overs match
        const runsNeeded = matchData.target - battingTeam.score;
        
        document.getElementById('requiredRunRate').textContent = 
            runsNeeded > 0 ? (runsNeeded / ballsRemaining * 6).toFixed(2) : '-';
        document.getElementById('ballsRemaining').textContent = ballsRemaining > 0 ? ballsRemaining : 0;
        
        // Update target display
        const targetElement = document.getElementById('targetDisplay') || createTargetDisplay();
        targetElement.textContent = `Target: ${matchData.target}`;
        targetElement.style.display = 'block';
        
        // Check if target is achieved
        if (battingTeam.score >= matchData.target) {
            completeMatch();
        }
    } else {
        document.getElementById('requiredRunRate').textContent = '-';
        document.getElementById('ballsRemaining').textContent = '-';
        
        // Hide target display in first innings
        const targetElement = document.getElementById('targetDisplay');
        if (targetElement) {
            targetElement.style.display = 'none';
        }
    }
}

// Create target display element
function createTargetDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    const targetElement = document.createElement('div');
    targetElement.id = 'targetDisplay';
    targetElement.className = 'target-display';
    targetElement.style.cssText = `
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--primary);
        margin-top: 10px;
        display: none;
    `;
    scoreDisplay.parentNode.insertBefore(targetElement, scoreDisplay.nextSibling);
    return targetElement;
}

// Update batsmen UI with strike indicators - FIXED SYNCHRONIZATION
function updateBatsmen() {
    // Filter only active batsmen (not out) for display
    const activeBatsmen = matchData.batsmen.filter(b => !b.isOut);
    
    // Ensure we have at least one batsman
    if (activeBatsmen.length === 0) {
        // Clear both batsmen displays
        ['batsman1', 'batsman2'].forEach(batsmanId => {
            document.getElementById(`${batsmanId}Name`).textContent = '';
            document.getElementById(`${batsmanId}Runs`).textContent = '0';
            document.getElementById(`${batsmanId}Balls`).textContent = '0';
            document.getElementById(`${batsmanId}Fours`).textContent = '0';
            document.getElementById(`${batsmanId}Sixes`).textContent = '0';
            document.getElementById(`${batsmanId}StrikeRate`).textContent = '0.00';
        });
        return;
    }
    
    // Get striker and non-striker from active batsmen - FIXED LOGIC
    const striker = activeBatsmen.find(b => b.isOnStrike);
    const nonStriker = activeBatsmen.find(b => !b.isOnStrike);
    
    // Update batsman 1 (ALWAYS striker)
    if (striker) {
        document.getElementById('batsman1Name').innerHTML = `
            ${striker.batIcon || '🏏'} ${striker.name}
            <span class="strike-indicator">⚡</span>
        `;
        document.getElementById('batsman1Runs').textContent = striker.runs;
        document.getElementById('batsman1Balls').textContent = striker.balls;
        document.getElementById('batsman1Fours').textContent = striker.fours;
        document.getElementById('batsman1Sixes').textContent = striker.sixes;
        document.getElementById('batsman1StrikeRate').textContent = 
            striker.balls > 0 ? (striker.runs / striker.balls * 100).toFixed(2) : '0.00';
    }
    
    // Update batsman 2 (ALWAYS non-striker)
    if (nonStriker) {
        document.getElementById('batsman2Name').innerHTML = `
            ${nonStriker.batIcon || '🏏'} ${nonStriker.name}
        `;
        document.getElementById('batsman2Runs').textContent = nonStriker.runs;
        document.getElementById('batsman2Balls').textContent = nonStriker.balls;
        document.getElementById('batsman2Fours').textContent = nonStriker.fours;
        document.getElementById('batsman2Sixes').textContent = nonStriker.sixes;
        document.getElementById('batsman2StrikeRate').textContent = 
            nonStriker.balls > 0 ? (nonStriker.runs / nonStriker.balls * 100).toFixed(2) : '0.00';
    } else if (activeBatsmen.length === 1) {
        // Only one batsman left, clear the second batsman display
        document.getElementById('batsman2Name').textContent = '';
        document.getElementById('batsman2Runs').textContent = '0';
        document.getElementById('batsman2Balls').textContent = '0';
        document.getElementById('batsman2Fours').textContent = '0';
        document.getElementById('batsman2Sixes').textContent = '0';
        document.getElementById('batsman2StrikeRate').textContent = '0.00';
    }
}

// Update bowler UI - FIXED BOWLER DISPLAY
function updateBowler() {
    if (matchData.bowler) {
        document.getElementById('bowlerName').textContent = matchData.bowler.name;
        
        // Calculate overs properly (e.g., 2.3 means 2 overs and 3 balls)
        const overs = Math.floor(matchData.bowler.balls / 6);
        const balls = matchData.bowler.balls % 6;
        document.getElementById('bowlerOvers').textContent = `${overs}.${balls}`;
        
        document.getElementById('bowlerRuns').textContent = matchData.bowler.runs;
        document.getElementById('bowlerWickets').textContent = matchData.bowler.wickets;
        
        // Calculate economy rate properly
        const totalOvers = overs + (balls / 6);
        const econ = totalOvers > 0 ? (matchData.bowler.runs / totalOvers).toFixed(2) : '0.00';
        document.getElementById('bowlerEcon').textContent = econ;
    } else {
        // Reset bowler display if no bowler is set
        document.getElementById('bowlerName').textContent = 'No Bowler';
        document.getElementById('bowlerOvers').textContent = '0.0';
        document.getElementById('bowlerRuns').textContent = '0';
        document.getElementById('bowlerWickets').textContent = '0';
        document.getElementById('bowlerEcon').textContent = '0.00';
    }
}

// Update over progress UI
function updateOverProgress() {
    const overProgress = document.getElementById('overProgress');
    overProgress.innerHTML = '';
    
    matchData.currentOver.forEach((ball, index) => {
        const ballElement = document.createElement('div');
        ballElement.className = 'ball';
        
        switch (ball.type) {
            case 'run':
                ballElement.classList.add('ball-run');
                ballElement.textContent = ball.runs;
                break;
            case 'wicket':
                ballElement.classList.add('ball-wicket');
                ballElement.textContent = 'W';
                break;
            case 'wide':
                ballElement.classList.add('ball-wide');
                ballElement.textContent = 'Wd';
                break;
            case 'noball':
                ballElement.classList.add('ball-noball');
                ballElement.textContent = 'Nb';
                break;
            case 'bye':
            case 'legbye':
                ballElement.classList.add('ball-bye');
                ballElement.textContent = ball.type === 'bye' ? 'B' : 'Lb';
                break;
            default:
                ballElement.classList.add('ball-dot');
                ballElement.textContent = '•';
        }
        
        overProgress.appendChild(ballElement);
    });
    
    // Add empty balls for the remaining deliveries in the over
    const remainingBalls = 6 - matchData.currentOver.length;
    for (let i = 0; i < remainingBalls; i++) {
        const ballElement = document.createElement('div');
        ballElement.className = 'ball ball-dot';
        ballElement.textContent = '•';
        overProgress.appendChild(ballElement);
    }
}

// Swap strike function
function swapStrike() {
    const activeBatsmen = matchData.batsmen.filter(b => !b.isOut);
    if (activeBatsmen.length >= 2) {
        matchData.batsmen.forEach(batsman => {
            if (!batsman.isOut) {
                batsman.isOnStrike = !batsman.isOnStrike;
            }
        });
        updateBatsmen();
    }
}

// Undo action function
function undoAction() {
    if (matchData.matchCompleted) {
        alert('Cannot undo actions in a completed match!');
        return;
    }
    
    if (matchData.matchHistory.length === 0) return;
    
    const lastAction = matchData.matchHistory.pop();
    const currentInnings = matchData.currentInnings;
    const currentTeam = currentInnings === 1 ? matchData.team1 : matchData.team2;
    
    // Reverse the last action
    switch (lastAction.type) {
        case 'run':
            currentTeam.score -= lastAction.runs;
            currentTeam.balls--;
            
            const batsman = matchData.batsmen.find(b => b.name === lastAction.batsman);
            if (batsman) {
                batsman.runs -= lastAction.runs;
                batsman.balls--;
                
                if (lastAction.runs === 4) batsman.fours--;
                if (lastAction.runs === 6) batsman.sixes--;
            }
            
            matchData.bowler.runs -= lastAction.runs;
            matchData.bowler.balls--;
            break;
            
        case 'wide':
        case 'noball':
            currentTeam.score -= 1;
            matchData.bowler.runs -= 1;
            break;
            
        case 'bye':
        case 'legbye':
            currentTeam.score -= 1;
            currentTeam.balls--;
            matchData.bowler.balls--;
            break;
            
        case 'wicket':
            currentTeam.wickets--;
            matchData.bowler.wickets--;
            matchData.bowler.balls--;
            
            const outBatsman = matchData.batsmen.find(b => b.name === lastAction.batsman);
            if (outBatsman) {
                outBatsman.isOut = false;
            }
            break;
    }
    
    // Remove from current over
    matchData.currentOver.pop();
    
    // Remove from ball-by-ball
    matchData.ballByBall.shift();
    
    // Update UI
    updateScoreboard();
    updateBatsmen();
    updateBowler();
    updateOverProgress();
    updateBallByBall();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('ctms_token');
        localStorage.removeItem('ctms_current_user');
        window.location.href = 'index.html';
    }
}

// Add enhanced CSS for toss animation, boundary animations and new sections with better colors

const additionalCSS = `
/* Live Indicator - Red */
.live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #e74c3c;
    padding: 8px 15px;
    border-radius: 20px;
    color: white;
    font-weight: bold;
}

.live-dot {
    width: 10px;
    height: 10px;
    background: white;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

/* CricHeroes Style Boundary Animations - Better Visible Colors */
.cricheroes-boundary-animation {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 8rem;
    font-weight: 900;
    z-index: 10000;
    animation: cricheroesPop 1.5s ease-out;
    pointer-events: none;
}

.boundary-4 {
    color: orange; /* Better Green - More Visible */
    animation: cricheroesFour 1.5s ease-out;
}

.boundary-6 {
    color: red; /* Better Yellow - More Visible */
    animation: cricheroesSix 1.5s ease-out;
}

.boundary-number {
    position: relative;
    z-index: 2;
}

.boundary-particles {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    z-index: 0;
}

.boundary-particles::before,
.boundary-particles::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
    animation: particleFloat 1.5s ease-out forwards;
}

.boundary-particles::before {
    top: 20%;
    left: 20%;
    animation-delay: 0.1s;
}

.boundary-particles::after {
    bottom: 20%;
    right: 20%;
    animation-delay: 0.2s;
}

@keyframes cricheroesFour {
    0% { 
        transform: translate(-50%, -50%) scale(0.1) rotate(-180deg);  
    }
    20% { 
        transform: translate(-50%, -50%) scale(1.2) rotate(-90deg); 
    }
    40% { 
        transform: translate(-50%, -50%) scale(1.1) rotate(0deg); 
    }
    60% { 
        transform: translate(-50%, -50%) scale(1.05) rotate(0deg); 
    }
    100% { 
        transform: translate(-50%, -50%) scale(1) rotate(0deg); 
    }
}

@keyframes cricheroesSix {
    0% { 
        transform: translate(-50%, -50%) scale(0.1) rotate(180deg); 
    }
    20% { 
        transform: translate(-50%, -50%) scale(1.3) rotate(90deg); 
    }
    40% { 
        transform: translate(-50%, -50%) scale(1.4) rotate(0deg); 
    }
    60% { 
        transform: translate(-50%, -50%) scale(1.3) rotate(0deg); 
    }
    80% { 
        transform: translate(-50%, -50%) scale(1.2) rotate(0deg); 
    }
    100% { 
        transform: translate(-50%, -50%) scale(1) rotate(0deg); 
    }
}

@keyframes glowPulse {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

@keyframes particleFloat {
    0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
    100% { transform: translate(var(--tx, 50px), var(--ty, -50px)) scale(0); opacity: 0; }
}

/* Toss Animation */
.toss-options {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin: 20px 0;
}

.toss-option-btn {
    background: var(--light);
    border: 2px solid #ddd;
    border-radius: 10px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.toss-option-btn.active {
    border-color: var(--primary);
    background: var(--light);
    transform: scale(1.05);
}

.coin-side {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
    color: white;
}

.coin-side.heads {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #8b6914;
    border: 3px solid #daa520;
}

.coin-side.tails {
    background: linear-gradient(45deg, #c0c0c0, #e8e8e8);
    color: #555;
    border: 3px solid #a9a9a9;
}

/* Coin Flip Animation */
#coinAnimation {
    text-align: center;
    margin: 20px 0;
}

.coin {
    width: 100px;
    height: 100px;
    margin: 0 auto;
    position: relative;
    transform-style: preserve-3d;
}

.coin-front, .coin-back {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
}

.coin-front {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #8b6914;
    border: 4px solid #daa520;
}

.coin-back {
    background: linear-gradient(45deg, #c0c0c0, #e8e8e8);
    color: #555;
    border: 4px solid #a9a9a9;
    transform: rotateY(180deg);
}

@keyframes flip {
    0% { transform: rotateY(0); }
    50% { transform: rotateY(1800deg); }
    100% { transform: rotateY(3600deg); }
}

.flipping-text {
    margin-top: 15px;
    font-size: 1.1rem;
    color: var(--primary);
    font-weight: bold;
}

.coin-final {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.5rem;
    color: white;
}

.coin-final.heads-result {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #8b6914;
    border: 6px solid #daa520;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.coin-final.tails-result {
    background: linear-gradient(45deg, #c0c0c0, #e8e8e8);
    color: #555;
    border: 6px solid #a9a9a9;
    box-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
}

/* Commentary Section */
.commentary-section {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
}

.commentary-item {
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
}

.commentary-item:last-child {
    border-bottom: none;
}

.commentary-time {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 5px;
}

.commentary-text {
    font-size: 0.9rem;
    color: #333;
}

/* Ball by Ball Section */
.ball-by-ball-section {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
}

.ball-by-ball-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ball-by-ball-item {
    display: grid;
    grid-template-columns: 60px 1fr 80px;
    gap: 15px;
    padding: 8px 12px;
    background: var(--light);
    border-radius: 8px;
    font-size: 0.9rem;
    align-items: center;
}

.ball-over {
    font-weight: bold;
    color: var(--primary);
    text-align: center;
}

.ball-description {
    color: #333;
}

.ball-score {
    font-weight: bold;
    color: var(--dark);
    text-align: right;
}

/* Team Squads Section */
.squads-section {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.squads-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.squad-section {
    background: var(--light);
    border-radius: 10px;
    padding: 15px;
}

.squad-title {
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 10px;
    font-size: 1.1rem;
}

.squad-players {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.player-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: white;
    border-radius: 5px;
    border-left: 3px solid #ddd;
    transition: all 0.3s ease;
}

.player-item.active-player {
    border-left-color: var(--success);
    background: #f0fff0;
}

.player-item.active-bowler {
    border-left-color: var(--warning);
    background: #fffaf0;
}

.player-item.player-out {
    border-left-color: var(--danger);
    background: #ffeaea;
    opacity: 0.7;
}

.player-name {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
}

.player-role {
    font-size: 0.8rem;
    color: #666;
    text-transform: capitalize;
}

.bowling-style {
    font-size: 0.7rem;
    color: #888;
    font-style: italic;
}

.player-out-icon {
    color: var(--danger);
    font-weight: bold;
    margin-left: 5px;
}

.strike-indicator {
    color: #FFD700;
    font-weight: bold;
    animation: strikePulse 1.5s infinite;
    margin-left: 5px;
}

@keyframes strikePulse {
    0% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0.5; transform: scale(1); }
}

/* Modal Styles */
.modal {
    display: block;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
}

.modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 0;
    border-radius: 15px;
    width: 90%;
    max-width: 600px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    animation: modalAppear 0.4s ease;
}

@keyframes modalAppear {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background: linear-gradient(135deg, var(--primary), var(--vibrant-forest));
    color: white;
    border-radius: 15px 15px 0 0;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.modal-body {
    padding: 25px;
}

/* Free Hit Indicator */
.free-hit-indicator {
    background: #ff6b35;
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
    margin-left: 10px;
    animation: pulse 1.5s infinite;
}

/* Target Display */
.target-display {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary);
    text-align: center;
    margin: 10px 0;
    padding: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    border: 2px solid var(--primary);
}

/* Match Result Display */
.match-result {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    text-align: center;
    max-width: 500px;
    width: 90%;
}

.match-result h2 {
    color: var(--primary);
    margin-bottom: 20px;
    font-size: 2rem;
}

.match-result .winner {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--success);
    margin-bottom: 15px;
}

.match-result .result-text {
    font-size: 1.3rem;
    color: var(--dark);
    margin-bottom: 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .squads-container {
        grid-template-columns: 1fr;
    }
    
    .ball-by-ball-item {
        grid-template-columns: 50px 1fr 70px;
        font-size: 0.8rem;
    }
    
    .commentary-section {
        max-height: 200px;
    }
    
    .ball-by-ball-section {
        max-height: 250px;
    }
    
    .toss-options {
        flex-direction: column;
        align-items: center;
    }
    
    .cricheroes-boundary-animation {
        font-size: 5rem;
    }
    
    .match-result {
        padding: 20px;
    }
    
    .match-result h2 {
        font-size: 1.5rem;
    }
    
    .match-result .winner {
        font-size: 1.3rem;
    }
    
    .match-result .result-text {
        font-size: 1.1rem;
    }
}

/* Enhanced batsman selection styles */
.form-control {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
}

.form-control:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    outline: none;
}

.form-label {
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: block;
    font-size: 1.1rem;
}

/* Improved button styles */
.btn {
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary), #2980b9);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(74, 144, 226, 0.4);
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover {
    background: #7f8c8d;
    transform: translateY(-1px);
}

/* Team selection improvements */
.team-selection-section {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
    border-left: 4px solid var(--primary);
}

.team-selection-title {
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 10px;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Enhanced batsman display */
.batsman-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
}

.batsman-display::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 200%;
    background: rgba(255,255,255,0.1);
    transform: rotate(45deg);
}

.batsman-name {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 5px;
    position: relative;
    z-index: 2;
}

.batsman-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    position: relative;
    z-index: 2;
}

.batsman-stat {
    text-align: center;
}

.batsman-stat-value {
    font-weight: bold;
    font-size: 1.1rem;
}

.batsman-stat-label {
    font-size: 0.8rem;
    opacity: 0.9;
}
`;

const strikethroughCSS = `
.strikethrough {
    text-decoration: line-through;
    opacity: 0.6;
}

.player-out .player-name {
    text-decoration: line-through;
    opacity: 0.6;
}

/* Enhanced out batsman display in scorecard */
.batsman-out {
    color: #e74c3c;
    text-decoration: line-through;
    opacity: 0.7;
}

.active-player.player-out {
    background: #ffeaea !important;
    border-left-color: #e74c3c !important;
}
`;
// Inject strikethrough CSS
const strikeStyle = document.createElement('style');
strikeStyle.textContent = strikethroughCSS;
document.head.appendChild(strikeStyle);
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);