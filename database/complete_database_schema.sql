CREATE DATABASE IF NOT EXISTS ctms_complete;
USE ctms_complete;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- 2. Tournaments Table
CREATE TABLE IF NOT EXISTS Tournaments (
    tournament_id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,
    venue VARCHAR(100),
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    format ENUM('knockout', 'league', 'group_knockout') DEFAULT 'league',
    total_teams INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 3. Coaches Table
CREATE TABLE IF NOT EXISTS Coaches (
    coach_id INT PRIMARY KEY AUTO_INCREMENT,
    coach_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    experience_years INT,
    nationality VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS Teams (
    team_id INT PRIMARY KEY AUTO_INCREMENT,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    team_abbreviation VARCHAR(10),
    city VARCHAR(50),
    home_ground VARCHAR(100),
    established_year YEAR,
    coach_id INT,
    tournament_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES Coaches(coach_id) ON DELETE SET NULL,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE SET NULL
);

-- 5. Players Table
CREATE TABLE IF NOT EXISTS Players (
    player_id INT PRIMARY KEY AUTO_INCREMENT,
    player_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(50),
    batting_style ENUM('right-handed', 'left-handed'),
    bowling_style VARCHAR(50),
    role ENUM('batsman', 'bowler', 'all-rounder', 'wicket-keeper') NOT NULL,
    team_id INT,
    is_captain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE SET NULL
);

-- 6. Player Statistics Table
CREATE TABLE IF NOT EXISTS Player_Statistics (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    matches_played INT DEFAULT 0,
    runs_scored INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    batting_average DECIMAL(6,2) DEFAULT 0.00,
    bowling_average DECIMAL(6,2) DEFAULT 0.00,
    strike_rate DECIMAL(6,2) DEFAULT 0.00,
    economy_rate DECIMAL(6,2) DEFAULT 0.00,
    best_bowling VARCHAR(20),
    highest_score INT DEFAULT 0,
    fifties INT DEFAULT 0,
    centuries INT DEFAULT 0,
    five_wickets INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES Players(player_id) ON DELETE CASCADE
);

-- 7. Matches Table
CREATE TABLE IF NOT EXISTS Matches (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT,
    team1_id INT,
    team2_id INT,
    match_date DATETIME,
    venue VARCHAR(100),
    match_type ENUM('group', 'quarterfinal', 'semifinal', 'final'),
    winner_team_id INT NULL,
    team1_score VARCHAR(20),
    team2_score VARCHAR(20),
    man_of_match INT NULL,
    match_status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'abandoned') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id),
    FOREIGN KEY (team1_id) REFERENCES Teams(team_id),
    FOREIGN KEY (team2_id) REFERENCES Teams(team_id),
    FOREIGN KEY (winner_team_id) REFERENCES Teams(team_id),
    FOREIGN KEY (man_of_match) REFERENCES Players(player_id)
);

-- 8. Match Statistics Table
CREATE TABLE IF NOT EXISTS Match_Statistics (
    match_stat_id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    innings_number INT NOT NULL DEFAULT 1,
    
    -- Batting Statistics
    runs_scored INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    strike_rate DECIMAL(6,2) DEFAULT 0.00,
    batting_position INT DEFAULT 0,
    is_out BOOLEAN DEFAULT FALSE,
    dismissal_type ENUM('bowled', 'catch', 'lbw', 'runout', 'stumped', 'not_out', 'retired') DEFAULT 'not_out',
    fielder_id INT NULL,
    
    -- Bowling Statistics
    wickets_taken INT DEFAULT 0,
    overs_bowled DECIMAL(4,1) DEFAULT 0,
    maidens INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    wides INT DEFAULT 0,
    no_balls INT DEFAULT 0,
    economy_rate DECIMAL(6,2) DEFAULT 0.00,
    bowling_position INT DEFAULT 0,
    dot_balls INT DEFAULT 0,
    
    -- Fielding Statistics
    catches INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    run_outs INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (fielder_id) REFERENCES Players(player_id),
    
    UNIQUE KEY unique_match_player_innings (match_id, player_id, innings_number)
);

-- 9. Points Table
CREATE TABLE IF NOT EXISTS Points_Table (
    points_id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT,
    team_id INT,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    matches_lost INT DEFAULT 0,
    matches_tied INT DEFAULT 0,
    points INT DEFAULT 0,
    net_run_rate DECIMAL(6,3) DEFAULT 0.000,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id),
    FOREIGN KEY (team_id) REFERENCES Teams(team_id),
    UNIQUE KEY unique_tournament_team (tournament_id, team_id)
);

-- 10. Audit Tables
CREATE TABLE IF NOT EXISTS Team_Audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE'),
    old_data JSON,
    new_data JSON,
    changed_by VARCHAR(100) DEFAULT 'system',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------- Sample Users with real bcrypt hashes -----------------
-- Passwords: rayyan123, admin123, manager123, viewer123
INSERT INTO Users (username, email, password_hash, role) VALUES
('rayyan', 'syedmuhammadrayyan123@gmail.com', '$2b$10$Cf5vHJ0t0Kn7VwQvfP0J7uV9rj6p0bJKNtT0kXftmyLjxQIFhN6h2', 'admin'),
('admin', 'admin@ctms.com', '$2b$10$Cf5vHJ0t0Kn7VwQvfP0J7uV9rj6p0bJKNtT0kXftmyLjxQIFhN6h2', 'admin'),
('manager', 'manager@ctms.com', '$2b$10$Cf5vHJ0t0Kn7VwQvfP0J7uV9rj6p0bJKNtT0kXftmyLjxQIFhN6h2', 'manager'),
('viewer', 'viewer@ctms.com', '$2b$10$Cf5vHJ0t0Kn7VwQvfP0J7uV9rj6p0bJKNtT0kXftmyLjxQIFhN6h2', 'viewer');

-- ----------------- Stored Procedures -----------------
DELIMITER $$

CREATE PROCEDURE GetDashboardStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Tournaments) as total_tournaments,
        (SELECT COUNT(*) FROM Teams) as total_teams,
        (SELECT COUNT(*) FROM Players) as total_players,
        (SELECT COUNT(*) FROM Matches) as total_matches,
        (SELECT COUNT(*) FROM Matches WHERE match_status = 'completed') as completed_matches,
        (SELECT COUNT(*) FROM Matches WHERE match_status = 'ongoing') as ongoing_matches;
END$$

CREATE PROCEDURE GetTournamentStandings(IN tournament_id_param INT)
BEGIN
    SELECT 
        t.team_name,
        pt.matches_played,
        pt.matches_won,
        pt.matches_lost,
        pt.matches_tied,
        pt.points,
        pt.net_run_rate
    FROM Points_Table pt
    JOIN Teams t ON pt.team_id = t.team_id
    WHERE pt.tournament_id = tournament_id_param
    ORDER BY pt.points DESC, pt.net_run_rate DESC;
END$$

DELIMITER ;

-- Indexes
CREATE INDEX idx_matches_tournament ON Matches(tournament_id);
CREATE INDEX idx_matches_date ON Matches(match_date);
CREATE INDEX idx_player_stats ON Player_Statistics(player_id);
CREATE INDEX idx_points_table ON Points_Table(tournament_id, points DESC);

-- Add status column to Matches table if it doesn't exist
ALTER TABLE Matches ADD COLUMN match_status VARCHAR(20) DEFAULT 'scheduled';

SELECT * FROM USERS;

-- Live Scores Table
CREATE TABLE IF NOT EXISTS LiveScores (
    live_score_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    innings_number INT NOT NULL DEFAULT 1,
    batting_team_id INT NOT NULL,
    bowling_team_id INT NOT NULL,
    total_runs INT NOT NULL DEFAULT 0,
    total_wickets INT NOT NULL DEFAULT 0,
    total_overs INT NOT NULL DEFAULT 0,
    current_over_balls INT NOT NULL DEFAULT 0,
    striker_id INT,
    non_striker_id INT,
    current_bowler_id INT,
    match_data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id),
    FOREIGN KEY (batting_team_id) REFERENCES Teams(team_id),
    FOREIGN KEY (bowling_team_id) REFERENCES Teams(team_id),
    FOREIGN KEY (striker_id) REFERENCES Players(player_id),
    FOREIGN KEY (non_striker_id) REFERENCES Players(player_id),
    FOREIGN KEY (current_bowler_id) REFERENCES Players(player_id)
);

-- Ball-by-Ball Table
CREATE TABLE IF NOT EXISTS BallByBall (
    ball_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    innings_number INT NOT NULL,
    over_number INT NOT NULL,
    ball_number INT NOT NULL,
    runs INT NOT NULL DEFAULT 0,
    is_extra BOOLEAN DEFAULT FALSE,
    extra_type ENUM('wide', 'noball', 'bye', 'legbye'),
    is_wicket BOOLEAN DEFAULT FALSE,
    wicket_type ENUM('bowled', 'catch', 'lbw', 'runout', 'stumped'),
    batsman_id INT,
    bowler_id INT,
    fielder_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id),
    FOREIGN KEY (batsman_id) REFERENCES Players(player_id),
    FOREIGN KEY (bowler_id) REFERENCES Players(player_id),
    FOREIGN KEY (fielder_id) REFERENCES Players(player_id)
);

-- Batting Scorecard Table
CREATE TABLE IF NOT EXISTS BattingScorecard (
    scorecard_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    innings_number INT NOT NULL,
    batting_order INT NOT NULL,
    runs INT NOT NULL DEFAULT 0,
    balls INT NOT NULL DEFAULT 0,
    fours INT NOT NULL DEFAULT 0,
    sixes INT NOT NULL DEFAULT 0,
    strike_rate DECIMAL(5,2) DEFAULT 0.00,
    is_out BOOLEAN DEFAULT FALSE,
    dismissal_type ENUM('bowled', 'catch', 'lbw', 'runout', 'stumped', 'not_out'),
    dismissal_info TEXT,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id),
    FOREIGN KEY (player_id) REFERENCES Players(player_id)
);

-- Bowling Scorecard Table
CREATE TABLE IF NOT EXISTS BowlingScorecard (
    scorecard_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    innings_number INT NOT NULL,
    bowling_order INT NOT NULL,
    overs DECIMAL(3,1) NOT NULL DEFAULT 0,
    maidens INT NOT NULL DEFAULT 0,
    runs INT NOT NULL DEFAULT 0,
    wickets INT NOT NULL DEFAULT 0,
    economy DECIMAL(5,2) DEFAULT 0.00,
    wides INT NOT NULL DEFAULT 0,
    no_balls INT NOT NULL DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id),
    FOREIGN KEY (player_id) REFERENCES Players(player_id)
);
SELECT * FROM MATCH_STATISTICS;