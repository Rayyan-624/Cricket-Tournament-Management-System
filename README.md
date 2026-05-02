# Cricket Tournament Management System (CTMS)

A comprehensive web-based application for managing cricket tournaments, teams, players, and match statistics. This full-stack system enables tournament organizers to efficiently manage tournaments, track player performance, and maintain tournament standings.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Statistics](#-project-statistics)
- [File Structure](#-file-structure)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [User Roles & Permissions](#-user-roles--permissions)
- [API Endpoints](#-api-endpoints)
- [Sample Login Credentials](#-sample-login-credentials)
- [Key Features Breakdown](#-key-features-breakdown)
- [Screenshots](#-screenshots)

---

## 🎯 Project Overview

The **Cricket Tournament Management System (CTMS)** is a full-stack web application designed to streamline the management of cricket tournaments at various levels. It provides a centralized platform for:

- **Tournament Management**: Create and manage multiple tournaments with different formats (league, knockout, group knockout)
- **Team Management**: Register teams, assign coaches, and maintain team information
- **Player Management**: Track player details, roles, and performance statistics
- **Match Management**: Schedule matches, update live scores, and record match statistics
- **Statistics & Analytics**: View detailed player statistics, team standings, and tournament insights
- **User Authentication**: Role-based access control with different permission levels
- **Live Scoring**: Real-time score updates during matches
- **Dashboard**: Comprehensive overview of tournament metrics and key statistics

**Development Purpose**: This system was developed as a Database Lab project for Semester 5, demonstrating advanced database design, backend API development, and full-stack web application architecture.

---

## ✨ Features

### 1. **User Management** (3 Features)
- User authentication with JWT tokens
- Role-based access control (Admin, Manager, Viewer)
- Secure password hashing with bcrypt
- User login history tracking

### 2. **Tournament Management** (4 Features)
- Create and manage tournaments with different formats
- Set tournament dates, venue, and status
- Support for 3 tournament formats: League, Knockout, Group Knockout
- Track tournament progress and completion status

### 3. **Team Management** (5 Features)
- Register teams with detailed information
- Assign coaches to teams
- Maintain team statistics and performance metrics
- Track team wins, losses, and ties
- Calculate Net Run Rate (NRR) for league standings

### 4. **Player Management** (6 Features)
- Register players with detailed profiles (age, nationality, role)
- Assign players to teams
- Designate captains
- Track 4 player roles: Batsman, Bowler, All-rounder, Wicket-keeper
- Support 2 batting styles: Right-handed, Left-handed
- Maintain player statistics and performance history

### 5. **Match Management** (7 Features)
- Schedule matches with teams, date, venue, and format
- Capture match status: Scheduled, Ongoing, Completed, Cancelled, Abandoned
- Record team scores
- Designate Man of the Match
- Update live match scores in real-time
- Assign match type: Group, Quarterfinal, Semifinal, Final
- Track winner information

### 6. **Match Statistics** (8 Features)
- Record detailed batting statistics (runs, balls, fours, sixes)
- Track bowling statistics (wickets, overs, economy rate)
- Capture fielding statistics (catches, stumpings, run-outs)
- Support for dismissal types (bowled, catch, LBW, runout, stumped)
- Calculate strike rates and economy rates
- Track multiple innings per match
- Record player performance by batting/bowling position

### 7. **Player Statistics Dashboard** (6 Metrics)
- Career statistics: Matches played, runs scored, wickets taken
- Batting metrics: Average, strike rate, highest score, fifties, centuries
- Bowling metrics: Average, economy rate, best bowling, 5-wicket hauls
- Real-time calculation and updates
- Historical tracking and comparisons

### 8. **Standings & Leaderboards** (4 Metrics)
- Points table calculation based on match results
- Net Run Rate (NRR) calculation
- Team rankings and positions
- Tournament standings

### 9. **Live Scoring** (3 Features)
- Real-time score updates during matches
- Ball-by-ball commentary
- Wicket and milestone notifications

### 10. **Dashboard & Reporting** (4 Features)
- Tournament overview with key metrics
- Quick statistics summary (total tournaments, teams, players, matches)
- Completed vs ongoing matches tracking
- Team and player performance insights

---

## 🛠️ Technology Stack

### **Frontend** (10 Files)
- **HTML5**: Semantic markup and structure
- **CSS3**: Responsive styling with custom themes
- **JavaScript (Vanilla)**: Dynamic client-side functionality
  - DOM manipulation
  - AJAX/Fetch API calls
  - Event handling and validation
  - Local storage for session management
- **Pages**: 
  - Login/Register (Authentication)
  - Dashboard (Overview)
  - Tournaments (Management & Listing)
  - Teams (Management & Listing)
  - Matches (Scheduling & Live Scoring)
  - Live Scoring (Real-time updates)
  - Statistics (Player Analytics)

### **Backend** (3 Files)
- **Node.js**: Runtime environment
- **Express.js**: Web framework (v4.21.2)
  - RESTful API endpoints
  - Middleware for CORS and JSON parsing
  - Static file serving
- **Authentication**: JWT tokens with jsonwebtoken (v9.0.2)
- **Security**: 
  - bcrypt (v6.0.0) for password hashing
  - bcryptjs (v2.4.3) for additional security
  - CORS configuration for cross-origin requests

### **Database** (1 File)
- **MySQL**: Relational database management
- **Version**: MySQL2/Promise (v3.15.3)
- **Tables**: 10 main tables with relationships
- **Stored Procedures**: Dashboard statistics query
- **Features**: 
  - Foreign key constraints
  - Enum types for status management
  - Timestamps for audit trails
  - Indexes for performance optimization

### **Development Tools**
- **nodemon** (v3.1.11): Automatic server restart on code changes
- **.env**: Environment configuration for sensitive data
- **dotenv** (v16.6.1): Environment variable management

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Total Database Tables** | 10 |
| **Stored Procedures** | 1+ |
| **Frontend Pages** | 7 |
| **Frontend Files** | 21 (HTML, CSS, JS) |
| **Backend Files** | 3 (server.js, auth.js, package.json) |
| **User Roles** | 3 (Admin, Manager, Viewer) |
| **Player Roles** | 4 (Batsman, Bowler, All-rounder, Wicket-keeper) |
| **Tournament Formats** | 3 (League, Knockout, Group Knockout) |
| **Match Types** | 4 (Group, Quarterfinal, Semifinal, Final) |
| **Match Status Types** | 5 (Scheduled, Ongoing, Completed, Cancelled, Abandoned) |
| **Dismissal Types** | 6 (Bowled, Catch, LBW, Runout, Stumped, Not Out) |
| **Batting Styles** | 2 (Right-handed, Left-handed) |
| **Screenshots Included** | 9+ |

---

## 📁 File Structure

```
Cricket-Tournament-Management-System/
├── README.md                              # Project documentation
├── Ctms.png                               # Project logo
├── package.json                           # Node.js dependencies
│
├── backend/                               # Backend API
│   ├── server.js                          # Express server & API endpoints
│   ├── auth.js                            # Authentication middleware
│   ├── package.json                       # Backend dependencies
│   └── .env                               # Environment configuration
│
├── frontend/                              # Frontend UI
│   ├── index.html / index.js / index.css          # Landing page
│   ├── login.html / login.js / login.css          # Login page
│   ├── register.html / register.js / register.css # Registration page
│   ├── dashboard.html / dashboard.js / dashboard.css      # Main dashboard
│   ├── tournaments.html / tournaments.js / tournaments.css # Tournament management
│   ├── teams.html / teams.js / teams.css          # Team management
│   ├── matches.html / matches.js / matches.css    # Match management
│   ├── live-scoring.html / live-scoring.js / live-scoring.css # Live scores
│   ├── statistics.html / statistics.js / statistics.css   # Player statistics
│   └── hash.js                            # Utility for password hashing
│
├── database/                              # Database setup
│   └── complete_database_schema.sql       # Complete database schema with:
│       ├── 10 tables
│       ├── Sample users with bcrypt hashes
│       └── Stored procedures
│
└── images/                                # Image assets
    ├── dashboard[1-9].png                 # Dashboard screenshots
    ├── live-scoring-logo.png              # Live scoring icon
    ├── matches-logo3.png                  # Match management icon
    ├── tournament-logo2.png               # Tournament icon
    ├── login.png                          # Login screenshot
    ├── Pointstable.png                    # Points table screenshot
    ├── stats[1-4].png                     # Statistics screenshots
    ├── Teammanagement.png                 # Team management screenshot
    ├── Tournament[1-3].png                # Tournament screenshots
    ├── Live.png                           # Live scoring screenshot
    └── image.png                          # General image asset
```

---

## 🗄️ Database Schema

### **10 Core Tables**

#### 1. **Users Table**
- Stores user accounts with authentication details
- Fields: user_id, username, email, password_hash, role, created_at, last_login
- Roles: admin, manager, viewer

#### 2. **Tournaments Table**
- Central tournament information
- Fields: tournament_id, tournament_name, start_date, end_date, venue, status, format, total_teams, created_by
- Status: upcoming, ongoing, completed
- Formats: knockout, league, group_knockout

#### 3. **Coaches Table**
- Coach information and expertise
- Fields: coach_id, coach_name, specialization, experience_years, nationality

#### 4. **Teams Table**
- Team information and affiliations
- Fields: team_id, team_name, team_abbreviation, city, home_ground, established_year, coach_id, tournament_id

#### 5. **Players Table**
- Player profile information
- Fields: player_id, player_name, date_of_birth, nationality, batting_style, bowling_style, role, team_id, is_captain
- Roles: batsman, bowler, all-rounder, wicket-keeper
- Batting: right-handed, left-handed

#### 6. **Player_Statistics Table**
- Career-level player statistics
- Fields: stat_id, player_id, matches_played, runs_scored, wickets_taken, batting_average, bowling_average, strike_rate, economy_rate, best_bowling, highest_score, fifties, centuries, five_wickets

#### 7. **Matches Table**
- Match scheduling and results
- Fields: match_id, tournament_id, team1_id, team2_id, match_date, venue, match_type, winner_team_id, team1_score, team2_score, man_of_match, match_status
- Match Type: group, quarterfinal, semifinal, final
- Status: scheduled, ongoing, completed, cancelled, abandoned

#### 8. **Match_Statistics Table**
- Detailed match performance by player
- Fields: match_stat_id, match_id, player_id, innings_number
- Batting: runs_scored, balls_faced, fours, sixes, strike_rate, dismissal_type
- Bowling: wickets_taken, overs_bowled, maidens, runs_conceded, economy_rate
- Fielding: catches, stumpings, run_outs

#### 9. **Points_Table**
- Tournament standings
- Fields: points_id, tournament_id, team_id, matches_played, matches_won, matches_lost, matches_tied, points, net_run_rate

#### 10. **Team_Audit Table**
- Audit trail for team changes
- Fields: audit_id, team_id, action_type, old_data, new_data, changed_by, changed_at
- Actions: INSERT, UPDATE, DELETE

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn
- Git

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/Rayyan-624/Cricket-Tournament-Management-System.git
cd Cricket-Tournament-Management-System
```

### **Step 2: Setup Database**

1. Open MySQL Command Line or MySQL Workbench
2. Execute the database schema:
   ```bash
   mysql -u root -p < database/complete_database_schema.sql
   ```
3. Verify database creation:
   ```sql
   USE ctms_complete;
   SHOW TABLES;
   ```

### **Step 3: Backend Setup**

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in backend directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=ctms_complete
   JWT_SECRET=your_jwt_secret_key
   PORT=3001
   ```

4. Test database connection:
   ```bash
   npm start
   ```
   You should see: `✅ Database connected successfully`

### **Step 4: Frontend Setup**

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. The frontend is static HTML/CSS/JS - no installation needed
3. Serve files using a local server:
   ```bash
   # Using Python 3
   python -m http.server 5500
   
   # Or using Node.js http-server
   npx http-server -p 5500
   
   # Or VS Code Live Server extension
   ```

---

## ▶️ Running the Application

### **Terminal 1 - Start Backend Server**
```bash
cd backend
npm start          # Production mode
# OR
npm run dev       # Development mode with auto-reload
```
Expected output:
```
✅ Database connected successfully
Server running on port 3001
```

### **Terminal 2 - Start Frontend Server**
```bash
cd frontend
python -m http.server 5500
# Navigate to: http://localhost:5500
```

### **Access the Application**
- Frontend: `http://localhost:5500`
- Backend API: `http://localhost:3001`

---

## 👤 User Roles & Permissions

### **1. Admin**
- Full system access
- Create, read, update, delete tournaments
- Manage teams, players, and coaches
- Schedule and update matches
- View all statistics and reports
- Manage user accounts

### **2. Manager**
- Create and manage tournaments
- Register and manage teams
- Register players
- Schedule matches and update scores
- View team and player statistics
- Limited to assigned tournaments

### **3. Viewer**
- Read-only access to all data
- View tournaments, teams, players
- Check match schedules and results
- Review player statistics
- Access dashboards and reports

---

## 🔌 API Endpoints

### **Authentication Endpoints**
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout

### **Tournament Endpoints**
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### **Team Endpoints**
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### **Player Endpoints**
- `GET /api/players` - List all players
- `POST /api/players` - Register player
- `GET /api/players/:id` - Get player details
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### **Match Endpoints**
- `GET /api/matches` - List all matches
- `POST /api/matches` - Schedule match
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match/score
- `DELETE /api/matches/:id` - Cancel match

### **Statistics Endpoints**
- `GET /api/statistics/players` - Player statistics
- `GET /api/statistics/teams` - Team standings
- `GET /api/statistics/dashboard` - Dashboard metrics

---

## 🔐 Sample Login Credentials

The database includes 4 pre-configured user accounts for testing:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| rayyan | syedmuhammadrayyan123@gmail.com | rayyan123 | Admin |
| admin | admin@ctms.com | admin123 | Admin |
| manager | manager@ctms.com | manager123 | Manager |
| viewer | viewer@ctms.com | viewer123 | Viewer |

**Note**: Passwords are securely hashed using bcrypt

---

## 🎯 Key Features Breakdown

### **1. Tournament Management System**
- Multiple tournament formats support
- Tournament lifecycle management (upcoming → ongoing → completed)
- Team capacity tracking
- Automatic status updates

### **2. Advanced Team Statistics**
- Win/Loss/Tie tracking
- Net Run Rate (NRR) calculation for league standings
- Points system integration
- Real-time standings updates

### **3. Comprehensive Player Tracking**
- Career statistics aggregation
- Role-based performance metrics
- Captain designation
- Nationality and date tracking

### **4. Detailed Match Statistics**
- Ball-by-ball records
- Multiple dismissal types
- Fielding performance tracking
- Bowling and batting analysis
- Strike rate and economy rate calculations

### **5. Live Scoring System**
- Real-time score updates
- Wicket tracking
- Milestone notifications
- Match status management

### **6. Security Features**
- JWT token-based authentication
- bcrypt password hashing
- CORS protection
- Role-based access control
- SQL injection prevention with parameterized queries

### **7. Dashboard Analytics**
- Total tournaments, teams, players, matches count
- Completed vs ongoing matches ratio
- Team performance summaries
- Player form and statistics

---

## 📸 Screenshots

The project includes 9+ screenshots demonstrating key features:

1. **Dashboard** (dashboard[1-9].png) - Main overview and statistics
2. **Login Page** (login.png) - User authentication
3. **Tournament Management** (Tournament[1-3].png) - Tournament creation and listing
4. **Team Management** (Teammanagement.png) - Team registration and details
5. **Matches** (matches-logo3.png) - Match scheduling interface
6. **Live Scoring** (Live.png, live-scoring-logo.png) - Real-time score updates
7. **Statistics** (stats[1-4].png) - Player and team analytics
8. **Points Table** (Pointstable.png) - Tournament standings

---

## 📚 Database Highlights

### **Key Features**
- **10 Interconnected Tables** with proper foreign key relationships
- **Stored Procedures** for efficient data retrieval
- **Enum Types** for data consistency (status, roles, match types)
- **Automatic Timestamps** for audit trails
- **JSON Support** for flexible data storage in audit table
- **Calculated Fields** for statistics (NRR, averages, rates)

### **Data Integrity**
- Foreign key constraints prevent orphaned records
- Unique constraints for critical fields
- Cascading deletes for related records
- Transaction support for complex operations

---

## 🛡️ Security Measures

1. **Password Security**
   - bcrypt hashing with salt rounds
   - Password never stored in plain text
   
2. **Authentication**
   - JWT tokens for session management
   - Token expiration handling
   - Secure logout mechanism

3. **Data Protection**
   - CORS enabled for authorized origins only
   - SQL injection prevention with prepared statements
   - Input validation on frontend and backend
   - XSS protection through content security

4. **Access Control**
   - Role-based permission system
   - Route protection with authentication middleware
   - User action logging in audit tables

---

## 🤝 Contributing

This is an academic project for Semester 5 Database Lab. Contributions are welcome!

### **How to Contribute**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License - see package.json for details.

---

## 👨‍💻 Author

**Syed Muhammad Rayyan**

- Email: syedmuhammadrayyan123@gmail.com
- GitHub: [Rayyan-624](https://github.com/Rayyan-624)

---

## 🙏 Acknowledgments

- Developed as a Database Lab project for Semester 5
- Built with modern web technologies and best practices
- Special thanks to all contributors and testers

---

## 📞 Support

For issues, questions, or suggestions:
1. Create an issue on GitHub
2. Email: syedmuhammadrayyan123@gmail.com
3. Check existing documentation

---

## 🔄 Project Status

- ✅ Frontend: Complete (7 pages, fully functional)
- ✅ Backend: Complete (RESTful API with authentication)
- ✅ Database: Complete (10 tables with relationships)
- ✅ Authentication: Implemented (JWT + Role-based access)
- ✅ Live Scoring: Implemented (Real-time updates)
- ✅ Statistics: Implemented (Comprehensive analytics)
- ✅ Testing: Manual testing completed
- 🔄 Continuous improvements and feature enhancements

---

**Last Updated**: May 2, 2026

**Version**: 1.0.0
