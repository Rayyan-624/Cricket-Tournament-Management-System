# 🏏 Cricket Tournament Management System (CTMS)

## 📋 Project Overview

A **full-stack cricket tournament management platform** built with modern web technologies and a robust database architecture. The system provides tournament organizers with a centralized platform to manage matches, track live scores, and generate standings automatically.

### 🎯 Core Features

**Tournament Management**
- Support for **3 tournament formats**: League, Knockout, Group Knockout
- Create and manage multiple tournaments simultaneously
- Automatic match scheduling and fixture generation
- Tournament status tracking (Upcoming, Ongoing, Completed)

**Real-Time Live Scoring**
- Ball-by-ball score updates
- Live match commentary and dismissal tracking
- **6 dismissal types** supported: Bowled, LBW, Caught, Run Out, Stumped, Hit Wicket
- Automatic **NRR (Net Run Rate)** calculation for standings
- Real-time player performance metrics

**User Management & Access Control**
- **3 user roles** with granular permissions:
  - **Admin**: Full system access, user management, tournament creation
  - **Manager**: Tournament and team management, live scoring
  - **Viewer**: Read-only access to tournaments and statistics
- JWT-based authentication with bcrypt password hashing
- Session management and token verification

**Player & Team Management**
- Detailed player profiles with role-based assignments (Batsman, Bowler, All-rounder, Wicket-keeper)
- Team roster management with captain assignment
- Coach profile management with specialization tracking
- **4 stat categories** tracked per player per innings:
  - Batting stats (Runs, Average, Strike Rate)
  - Bowling stats (Wickets, Economy Rate)
  - Performance metrics (Centuries, Half-centuries, 5-wicket hauls)

**Statistics & Analytics**
- Comprehensive player statistics dashboard
- Team performance analytics
- Tournament standings with live updates
- Player performance comparisons
- Historical match records

**Activity Logging**
- Real-time CTMS Activity Log
- Track all user actions and system events
- Persistent logging with localStorage
- Color-coded event types (Success, Info, Warning, Error, Action)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js v26.1.0
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Port**: 5500

### Database
- **System**: MySQL 8.0
- **Schema**: 10 normalized tables with foreign key constraints
- **Features**:
  - Proper indexing for query performance
  - Enum types for status and role management
  - Stored procedures for complex aggregations
  - Cascading delete relationships

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **Server**: Python HTTP Server (Port 3000)
- **Styling**: CSS3 with gradients and animations
- **Icons**: Inline SVG for crisp rendering
- **Responsive**: Mobile-first design

---

## 📊 Database Schema

### Tables (10 Total)
1. **Users** - User accounts with roles and authentication
2. **Tournaments** - Tournament definitions and metadata
3. **Teams** - Team information and coach assignments
4. **Players** - Player details and role assignments
5. **Player_Statistics** - Aggregated player performance data
6. **Matches** - Match definitions and results
7. **Match_Statistics** - Detailed match data and scoring
8. **Coaches** - Coach profiles and specializations
9. **Points_Table** - Automatic standings calculation
10. **Team_Audit** - Audit trail for team changes

### Key Constraints
- Foreign key relationships maintain data integrity
- Enum types for fixed-value fields (Status, Role, Format)
- Cascade delete for maintaining referential integrity
- Proper indexing on frequently queried columns

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MySQL Server (v8.0+)
- Python (v3.7+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rayyan-624/Cricket-Tournament-Management-System.git
   cd Cricket-Tournament-Management-System
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure database**
   - Update `.env` file with MySQL credentials:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=your_password
     DB_NAME=ctms_complete
     JWT_SECRET=secret123
     PORT=5500
     ```

4. **Start MySQL server**
   ```powershell
   Start-Service MySQL80
   ```

5. **Start backend API**
   ```bash
   npm start
   ```
   Expected output:
   ```
   ✅ Server running on port 5500
   ✅ Database connected successfully
   ```

6. **Start frontend server** (in a new terminal)
   ```bash
   cd frontend
   python -m http.server 3000
   ```

7. **Access the application**
   - Open browser: http://localhost:3000

---

## 📱 User Interface

### Pages & Features

**Landing Page** (`index.html`)
- Hero section with call-to-action
- Feature showcase (4 key features)
- Professional branding and logo
- Navigation to login/register

**Authentication**
- **Login** (`login.html`): Email and password authentication
- **Register** (`register.html`): New user registration with role selection

**Dashboard** (`dashboard.html`)
- Welcome message with personalized greeting
- Quick stats cards (Tournaments, Teams, Matches, Players)
- Recent tournaments list
- Upcoming matches display
- **CTMS Activity Log** - Real-time system events
- Cricket-themed animations

**Tournament Management** (`tournaments.html`)
- Create new tournaments
- View all tournaments with filters
- Edit tournament details
- Delete tournaments
- Tournament status management

**Team Management** (`teams.html`)
- Create and manage teams
- Assign coaches to teams
- Manage team rosters
- View team statistics
- Delete teams

**Match Management** (`matches.html`)
- Schedule new matches
- View upcoming matches
- Live scoring interface
- Match result recording
- Match history

**Live Scoring** (`live-scoring.html`)
- Real-time ball-by-ball updates
- Bowler and batsman tracking
- Dismissal recording with types
- Automatic stat calculation
- Match commentary

**Statistics** (`statistics.html`)
- Player performance metrics
- Team standings with NRR
- Individual player statistics
- Historical performance data

---

## 🔐 Security Features

### Authentication
- JWT tokens for API authentication
- Token expiration and refresh mechanisms
- Secure password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)

### Data Protection
- SQL injection prevention with parameterized queries
- CORS configuration for controlled access
- Input validation on all forms
- Error handling without sensitive information disclosure

---

## 🎨 Design & UX

### Branding
- Professional CTMS logo (SVG format)
- Consistent color scheme throughout
- Gradient backgrounds and modern aesthetics
- Smooth animations and transitions

### Responsive Design
- Mobile-first approach
- Optimized for desktop, tablet, and mobile
- Flexbox and CSS Grid layouts
- Touch-friendly interface elements

### Accessibility
- Semantic HTML structure
- ARIA labels for screen readers
- Color contrast compliance
- Keyboard navigation support

---

## 🧪 Testing

### Sample Credentials
After registration, test with:
- **Email**: test@ctms.com
- **Password**: Password123!

### API Endpoints
- Health Check: `GET /api/health`
- Tournaments: `GET/POST /api/tournaments`
- Teams: `GET/POST /api/teams`
- Players: `GET/POST /api/players`
- Matches: `GET/POST /api/matches`
- Statistics: `GET /api/statistics`

---

## 📈 Performance

### Database Optimization
- Indexed columns for fast queries
- Prepared statements for all database operations
- Connection pooling for efficiency
- Stored procedures for complex aggregations

### Frontend Optimization
- Lazy loading for images
- Minified assets
- Efficient DOM manipulation
- Event delegation for better performance

---

## 🔧 Troubleshooting

### Port Already in Use
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### Database Connection Failed
- Verify MySQL is running: `Get-Service MySQL80`
- Check `.env` credentials
- Ensure database exists: `CREATE DATABASE ctms_complete;`

### CORS Errors
- Verify backend is running on port 5500
- Check CORS configuration in `server.js`

---

## 📚 Project Architecture

### Directory Structure
```
Cricket-Tournament-Management-System/
├── backend/
│   ├── server.js              # Express server
│   ├── auth.js                # Authentication logic
│   ├── package.json           # Dependencies
│   ├── .env                   # Configuration
│   └── setup-database.js      # Database initialization
├── frontend/
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── dashboard.html         # Main dashboard
│   ├── tournaments.html       # Tournament management
│   ├── teams.html             # Team management
│   ├── matches.html           # Match management
│   ├── live-scoring.html      # Live scoring interface
│   ├── statistics.html        # Statistics dashboard
│   ├── *.js                   # JavaScript logic
│   ├── *.css                  # Styling
│   ├── logo.svg               # CTMS logo
│   ├── icons.svg              # Icon set
│   ├── branding.css           # Branding styles
│   ├── ctms-logger.js         # Activity logging
│   └── ctms-logger.css        # Log styling
└── database/
    └── complete_database_schema.sql  # Database schema
```

---

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack web application development
- Complex database schema design with normalization
- RESTful API development with Node.js/Express
- JWT-based authentication and authorization
- Real-time data processing and updates
- Responsive UI/UX design
- Git version control and project management

---

## 👥 Team

**Developed by**: Ali, Rayyan & Abuzar
**Academic Project**: Database Lab, Semester 5
**Institution**: FAST

---

## 📄 License

This project is provided for educational purposes.

---

## 🚀 Future Enhancements

- [ ] WebSocket for real-time live scoring
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics and AI-powered insights
- [ ] Payment integration for tournament entry fees
- [ ] Social features (comments, sharing)
- [ ] Cloud deployment (AWS/Azure/GCP)
- [ ] GraphQL API alongside REST

---

**Last Updated**: June 12, 2026
**Version**: 1.0.0
