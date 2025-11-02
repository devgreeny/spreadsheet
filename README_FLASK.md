# The Spreadsheet - Flask Edition

A simplified Flask-based college basketball betting tracker with automatic updates.

## Features

- 🔐 User authentication (register/login)
- 🏀 NCAA Basketball games with live odds
- 💰 Place bets on Moneyline, Spreads, and Totals
- 📊 Personal dashboard with statistics and analytics
- 🏆 Leaderboard to compete with friends
- ⏰ Automatic nightly odds updates (2 AM)
- 🔄 Automatic bet grading (3 AM)
- 📱 Mobile-friendly design

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: PostgreSQL
- **Authentication**: Flask-Login
- **Scheduler**: APScheduler
- **APIs**: The Odds API

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL database
- The Odds API key (get free at https://the-odds-api.com)

### Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up PostgreSQL database**:

For local PostgreSQL:
```bash
createdb spreadsheet
```

Or use a hosted service like [Neon](https://neon.tech) or [Railway](https://railway.app).

3. **Configure environment variables**:

Create a `.env` file:
```bash
cp .env.flask.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/spreadsheet
SECRET_KEY=your-secret-key-here
ODDS_API_KEY=your-odds-api-key
```

Generate a secure secret key:
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

4. **Initialize the database**:
```bash
python init_db.py
```

5. **Run the Flask app**:
```bash
python app.py
```

The app will start at `http://localhost:3005`

## Usage

### First Time Setup

1. **Register** an account
2. **Login** with your credentials
3. **Click "Refresh Odds"** to fetch today's games
4. **Place bets** by clicking on odds
5. **View your dashboard** to see statistics

### Automatic Updates

The app includes a background scheduler that runs:
- **2:00 AM daily** - Fetch latest odds from API
- **3:00 AM daily** - Update scores and grade bets

These run automatically as long as the Flask app is running.

### Manual Updates

You can also manually:
- Click **"Refresh Odds"** to fetch new games
- Click **"Update Scores"** to get latest scores and grade bets

## Deployment to Railway

Railway makes deployment super easy and auto-updates from GitHub!

### Step 1: Prepare Your Code

1. Make sure all files are committed to a GitHub repository

2. Ensure you have these files:
   - `Procfile` ✅
   - `requirements.txt` ✅
   - `app.py` ✅

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect it's a Python/Flask app

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically sets the `DATABASE_URL` environment variable

### Step 4: Set Environment Variables

In Railway project settings, add:
- `SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- `ODDS_API_KEY` - Your API key from the-odds-api.com

### Step 5: Deploy!

Railway automatically:
- ✅ Deploys your app
- ✅ Runs the scheduler (2 AM & 3 AM updates)
- ✅ Auto-redeploys on every git push
- ✅ Provides a public URL

**Cost**: Free tier includes 500 hours/month (enough to run 24/7)

## Project Structure

```
spread/
├── app.py                 # Main Flask application with all routes
├── models.py              # Database models (User, Game, Odds, Bet)
├── config.py              # Configuration and environment variables
├── odds_api.py            # Odds API client
├── grading.py             # Bet grading logic
├── init_db.py             # Database initialization script
├── templates/             # Jinja2 HTML templates
│   ├── layout.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── leaderboard.html
├── static/
│   └── style.css          # CSS styling
├── requirements.txt       # Python dependencies
├── Procfile              # Railway deployment config
└── .env                  # Environment variables (not in git)
```

## API Endpoints

- `GET /` - Home page with games
- `GET /login` - Login page
- `POST /login` - Login form submission
- `GET /register` - Registration page
- `POST /register` - Registration form submission
- `GET /dashboard` - User dashboard
- `GET /leaderboard` - Full leaderboard
- `POST /api/refresh-odds` - Manually fetch odds
- `POST /api/update-scores` - Manually update scores
- `POST /api/place-bet` - Place a new bet

## Database Models

### User
- `id` (String, PK)
- `email` (String, unique)
- `username` (String, unique)
- `password` (String, hashed)
- `created_at` (DateTime)

### Game
- `id` (String, PK)
- `external_id` (String, unique)
- `sport` (String)
- `game_time` (DateTime)
- `away_team`, `home_team` (String)
- `away_score`, `home_score` (Integer)
- `is_completed` (Boolean)

### Odds
- `id` (String, PK)
- `game_id` (Foreign Key)
- `bookmaker` (String)
- `away_ml`, `home_ml` (Integer)
- `away_spread`, `home_spread` (Float)
- `spread_odds` (Integer)
- `total_line` (Float)
- `over_odds`, `under_odds` (Integer)

### Bet
- `id` (String, PK)
- `user_id`, `game_id` (Foreign Keys)
- `bet_type` (String: ML, SPREAD, TOTAL_OVER, TOTAL_UNDER)
- `team` (String)
- `line` (Float)
- `odds` (Integer)
- `stake` (Float)
- `result` (String: PENDING, WON, LOST, PUSH)
- `profit` (Float)

## Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set up database
python init_db.py

# Run development server
python app.py
```

### Database Management

View your database in Python:
```python
from app import app, db
from models import User, Game, Bet

with app.app_context():
    # Get all users
    users = User.query.all()
    
    # Get all games
    games = Game.query.all()
    
    # Get pending bets
    pending = Bet.query.filter_by(result='PENDING').all()
```

### Testing the Scheduler

The scheduler runs automatically when the app starts. To test manually:

```python
from app import app, db
from odds_api import fetch_odds_from_api, parse_and_save_odds, update_scores_and_grade_bets

with app.app_context():
    # Fetch and save odds
    odds_data = fetch_odds_from_api()
    parse_and_save_odds(odds_data, db)
    
    # Update scores and grade bets
    update_scores_and_grade_bets(db)
```

## Troubleshooting

### Database connection errors
- Check your `DATABASE_URL` in `.env`
- Make sure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### No games showing up
- Click "Refresh Odds" to fetch from API
- Check your `ODDS_API_KEY` is correct
- Verify it's during basketball season (Nov-Apr)
- Check API credits: https://the-odds-api.com

### Scheduler not running
- Make sure the Flask app is running continuously
- Check logs for scheduler messages
- Scheduler only works while app is active

### Railway deployment issues
- Make sure `Procfile` exists
- Check Railway logs for errors
- Verify all environment variables are set

## Cost Breakdown (Free Tier)

- **Railway**: Free tier (500 hours/month)
- **PostgreSQL**: Railway includes 500 MB free
- **The Odds API**: Free tier (500 requests/month)

Perfect for small groups!

## Security Notes

- Passwords are hashed with bcrypt
- Session management via Flask-Login
- CSRF protection recommended for production
- Use strong `SECRET_KEY` in production
- Keep `.env` file secure and never commit it

## Future Enhancements

Ideas for v2:
- Live score updates via websockets
- Email notifications for bet results
- More sports (NFL, NBA, etc.)
- Parlay/multi-bet support
- Mobile app
- Social features (chat, comments)
- Advanced analytics and charts

## Support

For issues or questions:
1. Check this README
2. Review Railway logs
3. Test API connection
4. Open an issue on GitHub

---

Built with ❤️ for basketball season 🏀

**Note**: This is the Flask version. The original Next.js version is archived in the repo.

