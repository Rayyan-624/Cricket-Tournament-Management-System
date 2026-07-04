require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json());

// Serve frontend pages and shared image assets from the project folders
const path = require('path');
const frontendDir = path.join(__dirname, '..', 'frontend');
const imagesDir = path.join(__dirname, '..', 'images');

app.use(express.static(frontendDir));
app.use(express.static(imagesDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/:page', (req, res, next) => {
    if (req.params.page.includes('.')) return next();
    const requestedPage = path.join(frontendDir, `${req.params.page}.html`);
    res.sendFile(requestedPage, (err) => {
        if (err) return next();
    });
});

// Database connection with better error handling
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'fashion12345!!',
    database: process.env.DB_NAME || 'ctms_complete',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test database connection
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}
testDatabaseConnection();

// ---------- Auth Middleware ----------
const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ---------- REGISTER ----------
app.post('/api/register', async (req, res) => {
    console.log('📝 Registration attempt:', req.body);
    
    try {
        const { username, email, password, role } = req.body;
        
        // Enhanced validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM Users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        const [result] = await pool.query(
            'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role || 'viewer']
        );

        console.log('✅ User registered successfully:', result.insertId);
        res.status(201).json({ 
            success: true, 
            user_id: result.insertId,
            message: 'Registration successful!' 
        });

    } catch (err) {
        console.error('❌ Registration error:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Database table does not exist. Please run the SQL setup script.' });
        }
        
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
    console.log('🔑 Login attempt:', req.body.email);
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        
        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // Plain-text password check (you should hash passwords in production)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        await pool.query('UPDATE Users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
        
        console.log('✅ Login successful for user:', user.username);
        res.json({ 
            success: true, 
            token, 
            user: { 
                user_id: user.user_id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            } 
        });
        
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// ---------- GET CURRENT USER ----------
app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT user_id, username, email, role, created_at, last_login FROM Users WHERE user_id = ?', 
            [req.user.user_id]
        );
        res.json(rows[0] || null);
    } catch (err) {
        console.error('❌ Get user error:', err);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// ---------- MATCH ENDPOINTS ----------

// CREATE MATCH
app.post('/api/matches', authMiddleware, async (req, res) => {
    console.log('🏏 Creating match:', req.body);
    
    try {
        const { team1, team2, matchDate, venue, matchType } = req.body;
        
        // Validation
        if (!team1 || !team2 || !matchDate || !venue || !matchType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log('🔍 Checking teams:', team1, team2);

        // Check if teams exist
        const [teams] = await pool.query(
            'SELECT team_id, team_name FROM Teams WHERE team_name IN (?, ?)',
            [team1, team2]
        );

        console.log('🔍 Found teams:', teams);

        if (teams.length !== 2) {
            return res.status(404).json({ error: 'One or both teams not found' });
        }

        const team1Data = teams.find(t => t.team_name === team1);
        const team2Data = teams.find(t => t.team_name === team2);

        if (!team1Data || !team2Data) {
            return res.status(404).json({ error: 'One or both teams not found' });
        }

        console.log('🔍 Team IDs:', team1Data.team_id, team2Data.team_id);

        // First, let's check what columns exist in the Matches table
        try {
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Matches' 
                AND TABLE_SCHEMA = ?
            `, [process.env.DB_NAME || 'ctms_complete']);
            
            console.log('🔍 Available columns in Matches table:', columns.map(c => c.COLUMN_NAME));
            
            // Insert match - dynamically build query based on available columns
            const availableColumns = columns.map(c => c.COLUMN_NAME);
            
            if (availableColumns.includes('match_status')) {
                // If match_status column exists
                const [result] = await pool.query(
                    `INSERT INTO Matches 
                    (team1_id, team2_id, match_date, venue, match_type, match_status) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [team1Data.team_id, team2Data.team_id, matchDate, venue, matchType, 'scheduled']
                );
                console.log('✅ Match created with match_status column');
            } else if (availableColumns.includes('status')) {
                // If status column exists
                const [result] = await pool.query(
                    `INSERT INTO Matches 
                    (team1_id, team2_id, match_date, venue, match_type, status) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [team1Data.team_id, team2Data.team_id, matchDate, venue, matchType, 'scheduled']
                );
                console.log('✅ Match created with status column');
            } else {
                // If neither status column exists, use basic columns
                const [result] = await pool.query(
                    `INSERT INTO Matches 
                    (team1_id, team2_id, match_date, venue, match_type) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [team1Data.team_id, team2Data.team_id, matchDate, venue, matchType]
                );
                console.log('✅ Match created with basic columns');
            }

        } catch (tableErr) {
            console.error('❌ Error checking table structure:', tableErr);
            
            // Fallback: Try basic insert without status
            const [result] = await pool.query(
                `INSERT INTO Matches 
                (team1_id, team2_id, match_date, venue, match_type) 
                VALUES (?, ?, ?, ?, ?)`,
                [team1Data.team_id, team2Data.team_id, matchDate, venue, matchType]
            );
            console.log('✅ Match created with fallback query');
        }

        console.log('✅ Match created successfully');
        
        res.status(201).json({ 
            success: true, 
            message: 'Match scheduled successfully',
            matchData: {
                team1,
                team2,
                matchDate,
                venue,
                matchType
            }
        });
        
    } catch (err) {
        console.error('❌ Error creating match:', err);
        console.error('❌ Error details:', err.message);
        console.error('❌ Error code:', err.code);
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Matches table does not exist. Please run the SQL setup script.' });
        }
        
        if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
            return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD HH:MM:SS format.' });
        }
        
        res.status(500).json({ error: 'Failed to schedule match: ' + err.message });
    }
});

// GET ALL MATCHES
app.get('/api/matches', authMiddleware, async (req, res) => {
    console.log('🏏 Fetching matches...');
    
    try {
        // Try different column names for status
        let matches;
        
        try {
            // First try with match_status
            [matches] = await pool.query(`
                SELECT 
                    m.*,
                    t1.team_name as team1_name,
                    t2.team_name as team2_name
                FROM Matches m
                LEFT JOIN Teams t1 ON m.team1_id = t1.team_id
                LEFT JOIN Teams t2 ON m.team2_id = t2.team_id
                ORDER BY m.match_date DESC
            `);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                // If match_status doesn't exist, try without it
                console.log('⚠️ match_status column not found, fetching without status');
                [matches] = await pool.query(`
                    SELECT 
                        m.match_id,
                        m.team1_id,
                        m.team2_id,
                        m.match_date,
                        m.venue,
                        m.match_type,
                        t1.team_name as team1_name,
                        t2.team_name as team2_name
                    FROM Matches m
                    LEFT JOIN Teams t1 ON m.team1_id = t1.team_id
                    LEFT JOIN Teams t2 ON m.team2_id = t2.team_id
                    ORDER BY m.match_date DESC
                `);
            } else {
                throw err;
            }
        }
        
        // Add default status if not present
        matches = matches.map(match => ({
            ...match,
            match_status: match.match_status || match.status || 'scheduled'
        }));
        
        console.log(`✅ Found ${matches.length} matches`);
        res.json(matches);
        
    } catch (err) {
        console.error('❌ Error fetching matches:', err);
        
        // If table doesn't exist, return empty array instead of error
        if (err.code === 'ER_NO_SUCH_TABLE') {
            console.log('Matches table does not exist, returning empty array');
            return res.json([]);
        }
        
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// GET MATCH BY ID
app.get('/api/matches/:id', authMiddleware, async (req, res) => {
    try {
        let matches;
        
        try {
            [matches] = await pool.query(`
                SELECT 
                    m.*,
                    t1.team_name as team1_name,
                    t2.team_name as team2_name
                FROM Matches m
                LEFT JOIN Teams t1 ON m.team1_id = t1.team_id
                LEFT JOIN Teams t2 ON m.team2_id = t2.team_id
                WHERE m.match_id = ?
            `, [req.params.id]);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                // If columns don't exist, try basic query
                [matches] = await pool.query(`
                    SELECT 
                        m.match_id,
                        m.team1_id,
                        m.team2_id,
                        m.match_date,
                        m.venue,
                        m.match_type,
                        t1.team_name as team1_name,
                        t2.team_name as team2_name
                    FROM Matches m
                    LEFT JOIN Teams t1 ON m.team1_id = t1.team_id
                    LEFT JOIN Teams t2 ON m.team2_id = t2.team_id
                    WHERE m.match_id = ?
                `, [req.params.id]);
            } else {
                throw err;
            }
        }
        
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        // Add default status if not present
        const match = {
            ...matches[0],
            match_status: matches[0].match_status || matches[0].status || 'scheduled'
        };
        
        res.json(match);
        
    } catch (err) {
        console.error('❌ Error fetching match:', err);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

// UPDATE MATCH - FIXED VERSION with better date handling
app.put('/api/matches/:id', authMiddleware, async (req, res) => {
    console.log('🏏 Updating match:', req.params.id);
    console.log('📥 Received data:', req.body);
    
    try {
        // Accept both field naming conventions
        const { 
            team1, team2, matchDate, venue, matchType, status,  // Original names
            team1_id, team2_id, match_date, match_type, match_status, tournament_id  // New names
        } = req.body;
        
        // Use the provided values or fall back to defaults
        const finalTeam1 = team1 || 'Team 1';
        const finalTeam2 = team2 || 'Team 2';
        const finalVenue = venue || 'TBD';
        const finalMatchType = matchType || match_type || 'group';
        const finalStatus = status || match_status || 'ongoing';

        // Format date for MySQL - handle both ISO and MySQL formats
        let finalMatchDate;
        if (matchDate || match_date) {
            const dateValue = matchDate || match_date;
            try {
                // If it's already in MySQL format (YYYY-MM-DD HH:MM:SS), use as is
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
                    finalMatchDate = dateValue;
                } else {
                    // Convert from ISO or other formats to MySQL format
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) {
                        throw new Error('Invalid date');
                    }
                    finalMatchDate = date.toISOString().slice(0, 19).replace('T', ' ');
                }
            } catch (error) {
                console.log('⚠️ Date formatting error, using current date:', error);
                finalMatchDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            }
        } else {
            finalMatchDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        // Validation - check if we have the minimum required data
        if (!finalTeam1 || !finalTeam2 || !finalMatchDate || !finalVenue || !finalMatchType) {
            console.log('❌ Validation failed - missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log('🔍 Checking teams:', finalTeam1, finalTeam2);
        console.log('📅 Formatted date:', finalMatchDate);

        // Check if match exists
        const [existing] = await pool.query(
            'SELECT * FROM Matches WHERE match_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Check if teams exist - handle both team names and team IDs
        let team1Data, team2Data;

        if (team1_id && team2_id) {
            // If team IDs are provided, use them directly
            const [teams] = await pool.query(
                'SELECT team_id, team_name FROM Teams WHERE team_id IN (?, ?)',
                [team1_id, team2_id]
            );
            
            if (teams.length !== 2) {
                return res.status(404).json({ error: 'One or both teams not found by ID' });
            }
            
            team1Data = teams.find(t => t.team_id == team1_id);
            team2Data = teams.find(t => t.team_id == team2_id);
        } else {
            // If team names are provided, look them up
            const [teams] = await pool.query(
                'SELECT team_id, team_name FROM Teams WHERE team_name IN (?, ?)',
                [finalTeam1, finalTeam2]
            );

            console.log('🔍 Found teams by name:', teams);

            if (teams.length !== 2) {
                return res.status(404).json({ error: 'One or both teams not found by name' });
            }

            team1Data = teams.find(t => t.team_name === finalTeam1);
            team2Data = teams.find(t => t.team_name === finalTeam2);
        }

        if (!team1Data || !team2Data) {
            return res.status(404).json({ error: 'One or both teams not found' });
        }

        console.log('🔍 Team IDs for update:', team1Data.team_id, team2Data.team_id);

        // Update match - try different approaches for status column
        try {
            // First try with match_status
            await pool.query(
                `UPDATE Matches 
                SET team1_id = ?, team2_id = ?, match_date = ?, venue = ?, match_type = ?, match_status = ?
                WHERE match_id = ?`,
                [team1Data.team_id, team2Data.team_id, finalMatchDate, finalVenue, finalMatchType, finalStatus, req.params.id]
            );
            console.log('✅ Match updated with match_status column');
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                // If match_status doesn't exist, try with status
                try {
                    await pool.query(
                        `UPDATE Matches 
                        SET team1_id = ?, team2_id = ?, match_date = ?, venue = ?, match_type = ?, status = ?
                        WHERE match_id = ?`,
                        [team1Data.team_id, team2Data.team_id, finalMatchDate, finalVenue, finalMatchType, finalStatus, req.params.id]
                    );
                    console.log('✅ Match updated with status column');
                } catch (err2) {
                    if (err2.code === 'ER_BAD_FIELD_ERROR') {
                        // If neither status column exists, update without status
                        await pool.query(
                            `UPDATE Matches 
                            SET team1_id = ?, team2_id = ?, match_date = ?, venue = ?, match_type = ?
                            WHERE match_id = ?`,
                            [team1Data.team_id, team2Data.team_id, finalMatchDate, finalVenue, finalMatchType, req.params.id]
                        );
                        console.log('✅ Match updated without status column');
                    } else {
                        throw err2;
                    }
                }
            } else {
                throw err;
            }
        }

        // Fetch updated match
        const [updatedMatches] = await pool.query(`
            SELECT 
                m.*,
                t1.team_name as team1_name,
                t2.team_name as team2_name
            FROM Matches m
            LEFT JOIN Teams t1 ON m.team1_id = t1.team_id
            LEFT JOIN Teams t2 ON m.team2_id = t2.team_id
            WHERE m.match_id = ?
        `, [req.params.id]);

        if (updatedMatches.length === 0) {
            return res.status(404).json({ error: 'Match not found after update' });
        }

        // Add default status if not present
        const updatedMatch = {
            ...updatedMatches[0],
            match_status: updatedMatches[0].match_status || updatedMatches[0].status || 'scheduled'
        };

        console.log('✅ Match updated successfully');
        res.json(updatedMatch);
        
    } catch (err) {
        console.error('❌ Error updating match:', err);
        console.error('❌ Error details:', err.message);
        res.status(500).json({ error: 'Failed to update match: ' + err.message });
    }
});

// DELETE MATCH
app.delete('/api/matches/:id', authMiddleware, async (req, res) => {
    console.log('🏏 Deleting match:', req.params.id);
    
    try {
        // Check if match exists
        const [existing] = await pool.query(
            'SELECT * FROM Matches WHERE match_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        await pool.query('DELETE FROM Matches WHERE match_id = ?', [req.params.id]);

        console.log('✅ Match deleted successfully');
        res.json({ message: 'Match deleted successfully' });
        
    } catch (err) {
        console.error('❌ Error deleting match:', err);
        res.status(500).json({ error: 'Failed to delete match' });
    }
});

// ---------- TOURNAMENT ENDPOINTS ----------

// GET ALL TOURNAMENTS
app.get('/api/tournaments', authMiddleware, async (req, res) => {
    console.log('🏆 Fetching tournaments...');
    
    try {
        const [tournaments] = await pool.query(`
            SELECT t.*, u.username as created_by_name 
            FROM Tournaments t 
            LEFT JOIN Users u ON t.created_by = u.user_id 
            ORDER BY t.created_at DESC
        `);
        
        console.log(`✅ Found ${tournaments.length} tournaments`);
        res.json(tournaments);
        
    } catch (err) {
        console.error('❌ Error fetching tournaments:', err);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

// GET TOURNAMENT BY ID
app.get('/api/tournaments/:id', authMiddleware, async (req, res) => {
    try {
        const [tournaments] = await pool.query(`
            SELECT t.*, u.username as created_by_name 
            FROM Tournaments t 
            LEFT JOIN Users u ON t.created_by = u.user_id 
            WHERE t.tournament_id = ?
        `, [req.params.id]);
        
        if (tournaments.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        res.json(tournaments[0]);
        
    } catch (err) {
        console.error('❌ Error fetching tournament:', err);
        res.status(500).json({ error: 'Failed to fetch tournament' });
    }
});

// CREATE TOURNAMENT
app.post('/api/tournaments', authMiddleware, async (req, res) => {
    console.log('🏆 Creating tournament:', req.body);
    
    try {
        const { tournament_name, start_date, end_date, venue, format, status } = req.body;
        
        // Validation
        if (!tournament_name || !start_date || !end_date || !venue) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const [result] = await pool.query(
            `INSERT INTO Tournaments 
            (tournament_name, start_date, end_date, venue, format, status, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tournament_name, start_date, end_date, venue, format || 'T20', status || 'upcoming', req.user.user_id]
        );

        // Fetch the created tournament with creator info
        const [newTournament] = await pool.query(`
            SELECT t.*, u.username as created_by_name 
            FROM Tournaments t 
            LEFT JOIN Users u ON t.created_by = u.user_id 
            WHERE t.tournament_id = ?
        `, [result.insertId]);

        console.log('✅ Tournament created successfully:', result.insertId);
        res.status(201).json(newTournament[0]);
        
    } catch (err) {
        console.error('❌ Error creating tournament:', err);
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Tournaments table does not exist. Please run the SQL setup script.' });
        }
        
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

// UPDATE TOURNAMENT
app.put('/api/tournaments/:id', authMiddleware, async (req, res) => {
    console.log('🏆 Updating tournament:', req.params.id);
    
    try {
        const { tournament_name, start_date, end_date, venue, format, status } = req.body;
        
        // Validation
        if (!tournament_name || !start_date || !end_date || !venue) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Check if tournament exists and user has permission
        const [existing] = await pool.query(
            'SELECT * FROM Tournaments WHERE tournament_id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Tournament not found or access denied' });
        }

        await pool.query(
            `UPDATE Tournaments 
            SET tournament_name = ?, start_date = ?, end_date = ?, venue = ?, format = ?, status = ?
            WHERE tournament_id = ?`,
            [tournament_name, start_date, end_date, venue, format, status, req.params.id]
        );

        // Fetch updated tournament
        const [updatedTournament] = await pool.query(`
            SELECT t.*, u.username as created_by_name 
            FROM Tournaments t 
            LEFT JOIN Users u ON t.created_by = u.user_id 
            WHERE t.tournament_id = ?
        `, [req.params.id]);

        console.log('✅ Tournament updated successfully');
        res.json(updatedTournament[0]);
        
    } catch (err) {
        console.error('❌ Error updating tournament:', err);
        res.status(500).json({ error: 'Failed to update tournament' });
    }
});

// DELETE TOURNAMENT
app.delete('/api/tournaments/:id', authMiddleware, async (req, res) => {
    console.log('🏆 Deleting tournament:', req.params.id);
    
    try {
        // Check if tournament exists and user has permission
        const [existing] = await pool.query(
            'SELECT * FROM Tournaments WHERE tournament_id = ? AND created_by = ?',
            [req.params.id, req.user.user_id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Tournament not found or access denied' });
        }

        await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [req.params.id]);

        console.log('✅ Tournament deleted successfully');
        res.json({ message: 'Tournament deleted successfully' });
        
    } catch (err) {
        console.error('❌ Error deleting tournament:', err);
        res.status(500).json({ error: 'Failed to delete tournament' });
    }
});

// ---------- COACH ENDPOINTS ----------

// GET ALL COACHES
app.get('/api/coaches', authMiddleware, async (req, res) => {
    console.log('👨‍🏫 Fetching coaches...');
    
    try {
        const [coaches] = await pool.query(`
            SELECT * FROM Coaches 
            ORDER BY coach_name
        `);
        
        console.log(`✅ Found ${coaches.length} coaches`);
        res.json(coaches);
        
    } catch (err) {
        console.error('❌ Error fetching coaches:', err);
        res.status(500).json({ error: 'Failed to fetch coaches' });
    }
});

// CREATE COACH
app.post('/api/coaches', authMiddleware, async (req, res) => {
    console.log('👨‍🏫 Creating coach:', req.body);
    
    try {
        const { coach_name, specialization, experience_years, nationality } = req.body;
        
        // Validation
        if (!coach_name) {
            return res.status(400).json({ error: 'Coach name is required' });
        }

        const [result] = await pool.query(
            `INSERT INTO Coaches 
            (coach_name, specialization, experience_years, nationality) 
            VALUES (?, ?, ?, ?)`,
            [coach_name, specialization, experience_years, nationality]
        );

        console.log('✅ Coach created successfully:', result.insertId);
        res.status(201).json({ 
            success: true, 
            coach_id: result.insertId,
            message: 'Coach created successfully' 
        });
        
    } catch (err) {
        console.error('❌ Error creating coach:', err);
        res.status(500).json({ error: 'Failed to create coach' });
    }
});

// ---------- TEAM ENDPOINTS (FIXED - removed updated_at references) ----------

// GET ALL TEAMS WITH DETAILS
app.get('/api/teams', authMiddleware, async (req, res) => {
    console.log('👥 Fetching teams with details...');
    
    try {
        const [teams] = await pool.query(`
            SELECT 
                t.*, 
                tr.tournament_name,
                c.coach_name,
                c.specialization,
                c.experience_years,
                c.nationality as coach_nationality,
                (SELECT COUNT(*) FROM Players p WHERE p.team_id = t.team_id) as player_count
            FROM Teams t 
            LEFT JOIN Tournaments tr ON t.tournament_id = tr.tournament_id 
            LEFT JOIN Coaches c ON t.coach_id = c.coach_id
            ORDER BY t.created_at DESC
        `);
        
        console.log(`✅ Found ${teams.length} teams`);
        res.json(teams);
        
    } catch (err) {
        console.error('❌ Error fetching teams:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// GET TEAM BY ID WITH FULL DETAILS
app.get('/api/teams/:id', authMiddleware, async (req, res) => {
    try {
        const teamId = req.params.id;

        // Get team details
        const [teams] = await pool.query(`
            SELECT 
                t.*, 
                tr.tournament_name,
                c.coach_name,
                c.specialization,
                c.experience_years,
                c.nationality as coach_nationality
            FROM Teams t 
            LEFT JOIN Tournaments tr ON t.tournament_id = tr.tournament_id 
            LEFT JOIN Coaches c ON t.coach_id = c.coach_id
            WHERE t.team_id = ?
        `, [teamId]);
        
        if (teams.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Get players for this team
        const [players] = await pool.query(`
            SELECT 
                player_id,
                player_name,
                date_of_birth,
                nationality,
                batting_style,
                bowling_style,
                role,
                is_captain,
                created_at
            FROM Players 
            WHERE team_id = ? 
            ORDER BY is_captain DESC, player_name
        `, [teamId]);

        const teamData = {
            ...teams[0],
            players: players
        };

        res.json(teamData);
        
    } catch (err) {
        console.error('❌ Error fetching team:', err);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// CREATE TEAM WITH PLAYERS (FIXED - removed created_by)
app.post('/api/teams', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log('👥 Creating team with players:', req.body);
        
        const { 
            team_name, 
            team_abbreviation, 
            city, 
            home_ground, 
            established_year, 
            coach_id, 
            tournament_id, 
            players 
        } = req.body;
        
        // Validation
        if (!team_name || !tournament_id) {
            return res.status(400).json({ error: 'Team name and tournament are required' });
        }

        // Check if tournament exists
        const [tournaments] = await connection.query('SELECT * FROM Tournaments WHERE tournament_id = ?', [tournament_id]);
        if (tournaments.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check if coach exists (if provided)
        if (coach_id) {
            const [coaches] = await connection.query('SELECT * FROM Coaches WHERE coach_id = ?', [coach_id]);
            if (coaches.length === 0) {
                return res.status(404).json({ error: 'Coach not found' });
            }
        }

        // Insert team (REMOVED created_by)
        const [teamResult] = await connection.query(
            `INSERT INTO Teams 
            (team_name, team_abbreviation, city, home_ground, established_year, coach_id, tournament_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [team_name, team_abbreviation, city, home_ground, established_year, coach_id, tournament_id]
        );

        const teamId = teamResult.insertId;

        // Insert players if provided (REMOVED created_by)
        if (players && players.length > 0) {
            const playerValues = players.map(player => {
                // FIXED: Properly handle batting_style and bowling_style based on role
                let battingStyle = null;
                let bowlingStyle = null;
                
                if (player.role === 'bowler') {
                    // For bowlers: batting_style should be NULL, bowling_style should have value
                    battingStyle = null;
                    bowlingStyle = player.bowling_style || 'Fast';
                } else if (player.role === 'batsman' || player.role === 'wicketkeeper') {
                    // For batsmen/wicketkeepers: batting_style should have value, bowling_style should be NULL
                    battingStyle = player.batting_style || 'Right-handed';
                    bowlingStyle = null;
                } else if (player.role === 'all-rounder') {
                    // For all-rounders: both should have values
                    battingStyle = player.batting_style || 'Right-handed';
                    bowlingStyle = player.bowling_style || 'Fast';
                }
                
                console.log(`Player: ${player.player_name}, Role: ${player.role}, Batting: ${battingStyle}, Bowling: ${bowlingStyle}`);
                
                return [
                    player.player_name,
                    player.date_of_birth || null,
                    player.nationality || '',
                    battingStyle,
                    bowlingStyle,
                    player.role,
                    teamId,
                    player.is_captain || false
                ];
            });

            console.log('Final player values:', playerValues);

            await connection.query(
                `INSERT INTO Players 
                (player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain) 
                VALUES ?`,
                [playerValues]
            );
        }

        // Update tournament teams count
        await connection.query(
            `UPDATE Tournaments 
            SET total_teams = COALESCE(total_teams, 0) + 1 
            WHERE tournament_id = ?`,
            [tournament_id]
        );

        await connection.commit();

        // Fetch the created team with all details (REMOVED created_by reference)
        const [newTeam] = await connection.query(`
            SELECT 
                t.*, 
                tr.tournament_name,
                c.coach_name,
                c.specialization
            FROM Teams t 
            LEFT JOIN Tournaments tr ON t.tournament_id = tr.tournament_id 
            LEFT JOIN Coaches c ON t.coach_id = c.coach_id
            WHERE t.team_id = ?
        `, [teamId]);

        console.log('✅ Team created successfully:', teamId);
        res.status(201).json(newTeam[0]);
        
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error creating team:', err);
        console.error('❌ Error details:', err.message);
        console.error('❌ Error SQL:', err.sql);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Team with this name already exists' });
        }
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Database table does not exist' });
        }
        
        if (err.code === 'WARN_DATA_TRUNCATED') {
            return res.status(400).json({ error: 'Invalid data provided for player attributes. Please check batting_style and bowling_style values.' });
        }
        
        res.status(500).json({ error: 'Failed to create team' });
    } finally {
        connection.release();
    }
});

// UPDATE TEAM WITH PLAYERS (FIXED - removed updated_at)
app.put('/api/teams/:id', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log('👥 Updating team:', req.params.id);
        
        const teamId = req.params.id;
        const { 
            team_name, 
            team_abbreviation, 
            city, 
            home_ground, 
            established_year, 
            coach_id, 
            tournament_id, 
            players 
        } = req.body;
        
        // Validation
        if (!team_name || !tournament_id) {
            return res.status(400).json({ error: 'Team name and tournament are required' });
        }

        // Check if team exists (removed created_by check)
        const [existing] = await connection.query(
            'SELECT * FROM Teams WHERE team_id = ?',
            [teamId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const currentTournamentId = existing[0].tournament_id;

        // Update team (FIXED: Removed updated_at)
        await connection.query(
            `UPDATE Teams 
            SET team_name = ?, team_abbreviation = ?, city = ?, home_ground = ?, 
                established_year = ?, coach_id = ?, tournament_id = ?
            WHERE team_id = ?`,
            [team_name, team_abbreviation, city, home_ground, established_year, coach_id, tournament_id, teamId]
        );

        // Update tournament teams count if tournament changed
        if (currentTournamentId !== parseInt(tournament_id)) {
            // Decrement old tournament count
            await connection.query(
                `UPDATE Tournaments 
                SET total_teams = GREATEST(COALESCE(total_teams, 0) - 1, 0)
                WHERE tournament_id = ?`,
                [currentTournamentId]
            );
            
            // Increment new tournament count
            await connection.query(
                `UPDATE Tournaments 
                SET total_teams = COALESCE(total_teams, 0) + 1 
                WHERE tournament_id = ?`,
                [tournament_id]
            );
        }

        // Delete existing players and insert updated players
        await connection.query('DELETE FROM Players WHERE team_id = ?', [teamId]);

        if (players && players.length > 0) {
            const playerValues = players.map(player => {
                // FIXED: Properly handle batting_style and bowling_style based on role
                let battingStyle = null;
                let bowlingStyle = null;
                
                if (player.role === 'bowler') {
                    battingStyle = null;
                    bowlingStyle = player.bowling_style || 'Fast';
                } else if (player.role === 'batsman' || player.role === 'wicketkeeper') {
                    battingStyle = player.batting_style || 'Right-handed';
                    bowlingStyle = null;
                } else if (player.role === 'all-rounder') {
                    battingStyle = player.batting_style || 'Right-handed';
                    bowlingStyle = player.bowling_style || 'Fast';
                }
                
                return [
                    player.player_name,
                    player.date_of_birth || null,
                    player.nationality || '',
                    battingStyle,
                    bowlingStyle,
                    player.role,
                    teamId,
                    player.is_captain || false
                ];
            });

            await connection.query(
                `INSERT INTO Players 
                (player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain) 
                VALUES ?`,
                [playerValues]
            );
        }

        await connection.commit();

        // Fetch updated team (removed created_by reference)
        const [updatedTeam] = await connection.query(`
            SELECT 
                t.*, 
                tr.tournament_name,
                c.coach_name,
                c.specialization
            FROM Teams t 
            LEFT JOIN Tournaments tr ON t.tournament_id = tr.tournament_id 
            LEFT JOIN Coaches c ON t.coach_id = c.coach_id
            WHERE t.team_id = ?
        `, [teamId]);

        console.log('✅ Team updated successfully');
        res.json(updatedTeam[0]);
        
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error updating team:', err);
        res.status(500).json({ error: 'Failed to update team' });
    } finally {
        connection.release();
    }
});

// DELETE TEAM (FIXED - removed created_by check)
app.delete('/api/teams/:id', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const teamId = req.params.id;

        // Check if team exists (removed created_by check)
        const [existing] = await connection.query(
            'SELECT * FROM Teams WHERE team_id = ?',
            [teamId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const tournamentId = existing[0].tournament_id;

        // Delete players first
        await connection.query('DELETE FROM Players WHERE team_id = ?', [teamId]);

        // Delete team
        await connection.query('DELETE FROM Teams WHERE team_id = ?', [teamId]);

        // Update tournament teams count
        if (tournamentId) {
            await connection.query(
                `UPDATE Tournaments 
                SET total_teams = GREATEST(COALESCE(total_teams, 0) - 1, 0)
                WHERE tournament_id = ?`,
                [tournamentId]
            );
        }

        await connection.commit();

        console.log('✅ Team deleted successfully');
        res.json({ message: 'Team deleted successfully' });
        
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error deleting team:', err);
        res.status(500).json({ error: 'Failed to delete team' });
    } finally {
        connection.release();
    }
});

// ---------- PLAYER ENDPOINTS (FIXED - removed created_by) ----------

// GET ALL PLAYERS
app.get('/api/players', authMiddleware, async (req, res) => {
    console.log('🏃 Fetching players...');
    
    try {
        const [players] = await pool.query(`
            SELECT p.*, t.team_name 
            FROM Players p 
            LEFT JOIN Teams t ON p.team_id = t.team_id 
            ORDER BY p.created_at DESC
        `);
        
        console.log(`✅ Found ${players.length} players`);
        res.json(players);
        
    } catch (err) {
        console.error('❌ Error fetching players:', err);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// GET PLAYERS BY TEAM
app.get('/api/teams/:id/players', authMiddleware, async (req, res) => {
    try {
        const [players] = await pool.query(`
            SELECT p.*, t.team_name 
            FROM Players p 
            LEFT JOIN Teams t ON p.team_id = t.team_id 
            WHERE p.team_id = ?
            ORDER BY p.is_captain DESC, p.player_name
        `, [req.params.id]);
        
        res.json(players);
        
    } catch (err) {
        console.error('❌ Error fetching team players:', err);
        res.status(500).json({ error: 'Failed to fetch team players' });
    }
});

// CREATE PLAYER (FIXED - removed created_by)
app.post('/api/players', authMiddleware, async (req, res) => {
    console.log('🏃 Creating player:', req.body);
    
    try {
        const { player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain } = req.body;
        
        // Validation
        if (!player_name || !role || !team_id) {
            return res.status(400).json({ error: 'Player name, role and team are required' });
        }

        // FIXED: Properly handle batting_style and bowling_style based on role
        let finalBattingStyle = null;
        let finalBowlingStyle = null;
        
        if (role === 'bowler') {
            finalBattingStyle = null;
            finalBowlingStyle = bowling_style || 'Fast';
        } else if (role === 'batsman' || role === 'wicketkeeper') {
            finalBattingStyle = batting_style || 'Right-handed';
            finalBowlingStyle = null;
        } else if (role === 'all-rounder') {
            finalBattingStyle = batting_style || 'Right-handed';
            finalBowlingStyle = bowling_style || 'Fast';
        }

        const [result] = await pool.query(
            `INSERT INTO Players 
            (player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [player_name, date_of_birth || null, nationality || '', finalBattingStyle, finalBowlingStyle, role, team_id, is_captain || false]
        );

        // Fetch created player
        const [newPlayer] = await pool.query(`
            SELECT p.*, t.team_name 
            FROM Players p 
            LEFT JOIN Teams t ON p.team_id = t.team_id 
            WHERE p.player_id = ?
        `, [result.insertId]);

        console.log('✅ Player created successfully:', result.insertId);
        res.status(201).json(newPlayer[0]);
        
    } catch (err) {
        console.error('❌ Error creating player:', err);
        
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Players table does not exist' });
        }
        
        res.status(500).json({ error: 'Failed to create player' });
    }
});

// UPDATE PLAYER (FIXED - removed created_by check)
app.put('/api/players/:id', authMiddleware, async (req, res) => {
    console.log('🏃 Updating player:', req.params.id);
    
    try {
        const { player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain } = req.body;
        
        // Validation
        if (!player_name || !role || !team_id) {
            return res.status(400).json({ error: 'Player name, role and team are required' });
        }

        // Check if player exists (removed created_by check)
        const [existing] = await pool.query(
            'SELECT * FROM Players WHERE player_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // FIXED: Properly handle batting_style and bowling_style based on role
        let finalBattingStyle = null;
        let finalBowlingStyle = null;
        
        if (role === 'bowler') {
            finalBattingStyle = null;
            finalBowlingStyle = bowling_style || 'Fast';
        } else if (role === 'batsman' || role === 'wicketkeeper') {
            finalBattingStyle = batting_style || 'Right-handed';
            finalBowlingStyle = null;
        } else if (role === 'all-rounder') {
            finalBattingStyle = batting_style || 'Right-handed';
            finalBowlingStyle = bowling_style || 'Fast';
        }

        await pool.query(
            `UPDATE Players 
            SET player_name = ?, date_of_birth = ?, nationality = ?, batting_style = ?, bowling_style = ?, 
                role = ?, team_id = ?, is_captain = ?
            WHERE player_id = ?`,
            [player_name, date_of_birth || null, nationality || '', finalBattingStyle, finalBowlingStyle, role, team_id, is_captain, req.params.id]
        );

        // Fetch updated player
        const [updatedPlayer] = await pool.query(`
            SELECT p.*, t.team_name 
            FROM Players p 
            LEFT JOIN Teams t ON p.team_id = t.team_id 
            WHERE p.player_id = ?
        `, [req.params.id]);

        console.log('✅ Player updated successfully');
        res.json(updatedPlayer[0]);
        
    } catch (err) {
        console.error('❌ Error updating player:', err);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// DELETE PLAYER (FIXED - removed created_by check)
app.delete('/api/players/:id', authMiddleware, async (req, res) => {
    console.log('🏃 Deleting player:', req.params.id);
    
    try {
        // Check if player exists (removed created_by check)
        const [existing] = await pool.query(
            'SELECT * FROM Players WHERE player_id = ?',
            [req.params.id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        await pool.query('DELETE FROM Players WHERE player_id = ?', [req.params.id]);

        console.log('✅ Player deleted successfully');
        res.json({ message: 'Player deleted successfully' });
        
    } catch (err) {
        console.error('❌ Error deleting player:', err);
        res.status(500).json({ error: 'Failed to delete player' });
    }
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const [tournamentCount] = await pool.query('SELECT COUNT(*) as count FROM Tournaments');
        const [teamCount] = await pool.query('SELECT COUNT(*) as count FROM Teams');
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM Users');
        const [playerCount] = await pool.query('SELECT COUNT(*) as count FROM Players');
        
        res.json({
            total_tournaments: tournamentCount[0].count,
            total_teams: teamCount[0].count,
            total_users: userCount[0].count,
            total_players: playerCount[0].count
        });
    } catch (err) {
        console.error('❌ Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        timestamp: new Date().toISOString() 
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🏆 Tournament endpoints available at: http://localhost:${PORT}/api/tournaments`);
    console.log(`👥 Team endpoints available at: http://localhost:${PORT}/api/teams`);
    console.log(`👨‍🏫 Coach endpoints available at: http://localhost:${PORT}/api/coaches`);
    console.log(`🏃 Player endpoints available at: http://localhost:${PORT}/api/players`);
    console.log(`🏏 Match endpoints available at: http://localhost:${PORT}/api/matches`);
});

module.exports = app;