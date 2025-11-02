from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import bcrypt
import uuid
import os
from sqlalchemy import desc, func

from config import Config
from models import db, User, Game, Odds, Bet
from odds_api import fetch_odds_from_api, parse_and_save_odds, update_scores_and_grade_bets

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, user_id)


# Initialize APScheduler for automatic updates
scheduler = BackgroundScheduler(timezone=Config.SCHEDULER_TIMEZONE)

def scheduled_fetch_odds():
    """Scheduled job to fetch odds multiple times daily"""
    with app.app_context():
        print('🕐 Scheduled odds fetch starting...')
        odds_data = fetch_odds_from_api()
        if odds_data:
            parse_and_save_odds(odds_data, db)
        print('🕐 Scheduled odds fetch complete!')

def scheduled_update_scores():
    """Scheduled job to update scores and grade bets"""
    with app.app_context():
        print('🕐 Scheduled score update starting...')
        update_scores_and_grade_bets(db)
        print('🕐 Scheduled score update complete!')

# Add scheduled jobs - Odds fetch 4x daily
scheduler.add_job(scheduled_fetch_odds, 'cron', hour=6, minute=0)   # 6 AM EST
scheduler.add_job(scheduled_fetch_odds, 'cron', hour=12, minute=0)  # 12 PM EST
scheduler.add_job(scheduled_fetch_odds, 'cron', hour=18, minute=0)  # 6 PM EST
scheduler.add_job(scheduled_fetch_odds, 'cron', hour=23, minute=0)  # 11 PM EST

# Score updates every 3 hours during game times
scheduler.add_job(scheduled_update_scores, 'cron', hour=7, minute=0)   # 7 AM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=10, minute=0)  # 10 AM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=13, minute=0)  # 1 PM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=16, minute=0)  # 4 PM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=19, minute=0)  # 7 PM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=22, minute=0)  # 10 PM EST
scheduler.add_job(scheduled_update_scores, 'cron', hour=1, minute=0)   # 1 AM EST

scheduler.start()

print('✅ Scheduler started:')
print('   - Odds fetch: 6 AM, 12 PM, 6 PM, 11 PM EST')
print('   - Score updates: Every 3 hours (7 AM - 1 AM EST)')


# ==================== ROUTES ====================

@app.route('/')
def index():
    """Home page with games and odds"""
    # Get games for today or next available day
    games = get_todays_or_next_games()
    
    # Determine which date we're showing
    game_date = None
    if games:
        game_date = games[0].game_time
    
    # Get leaderboard (top 10)
    leaderboard = get_leaderboard_data()[:10]
    
    return render_template('index.html', games=games, leaderboard=leaderboard, game_date=game_date)


@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Validate
        if not email or not username or not password:
            flash('All fields are required', 'error')
            return render_template('register.html')
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(username=username).first():
            flash('Username already taken', 'error')
            return render_template('register.html')
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            username=username,
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            login_user(user)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))


@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard with bets and statistics"""
    # Get user's bets
    bets = Bet.query.filter_by(user_id=current_user.id).order_by(desc(Bet.created_at)).all()
    
    # Calculate statistics
    stats = calculate_user_stats(current_user.id)
    
    # Get analytics
    analytics = calculate_analytics(current_user.id)
    
    return render_template('dashboard.html', bets=bets, stats=stats, analytics=analytics)


@app.route('/leaderboard')
def leaderboard():
    """Full leaderboard page"""
    leaderboard_data = get_leaderboard_data()
    return render_template('leaderboard.html', leaderboard=leaderboard_data)


# ==================== API ROUTES ====================

@app.route('/api/place-bet', methods=['POST'])
@login_required
def api_place_bet():
    """Place a bet"""
    try:
        data = request.get_json()
        
        game_id = data.get('gameId')
        bet_type = data.get('betType')
        team = data.get('team')
        line = data.get('line')
        odds = data.get('odds')
        stake = data.get('stake')
        
        # Validate
        if not all([game_id, bet_type, odds, stake]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if game exists
        game = Game.query.get(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Check if game has already started
        if game.game_time <= datetime.utcnow():
            return jsonify({'error': 'Game has already started'}), 400
        
        # Create bet
        bet = Bet(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            game_id=game_id,
            bet_type=bet_type,
            team=team,
            line=float(line) if line else None,
            odds=int(odds),
            stake=float(stake)
        )
        
        db.session.add(bet)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'betId': bet.id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== HELPER FUNCTIONS ====================

def get_todays_or_next_games():
    """Get games for today, or if none exist, get next available day's games"""
    from pytz import timezone as pytz_timezone
    
    # Define EST timezone
    est = pytz_timezone('America/New_York')
    utc = pytz_timezone('UTC')
    
    # Get current time in EST
    now_utc = datetime.utcnow().replace(tzinfo=utc)
    now_est = now_utc.astimezone(est)
    
    # Get ALL upcoming games first (in UTC)
    all_upcoming_games = Game.query.filter(
        Game.game_time >= datetime.utcnow()
    ).order_by(Game.game_time).all()
    
    if not all_upcoming_games:
        print('📅 No upcoming games found in database')
        return []
    
    print(f'📊 Total upcoming games in database: {len(all_upcoming_games)}')
    
    # Group games by EST date
    from collections import defaultdict
    games_by_date = defaultdict(list)
    
    for game in all_upcoming_games:
        # Convert UTC game time to EST
        game_time_utc = game.game_time.replace(tzinfo=utc)
        game_time_est = game_time_utc.astimezone(est)
        
        # Extract just the EST date (ignore time)
        game_date_est = game_time_est.date()
        games_by_date[game_date_est].append(game)
    
    # Get today's date in EST
    today_date_est = now_est.date()
    
    # Debug: Print all dates with game counts (in EST)
    print('📊 Games by date (EST):')
    for date in sorted(games_by_date.keys()):
        print(f'   {date}: {len(games_by_date[date])} games')
    
    # Check if we have games today (EST)
    if today_date_est in games_by_date:
        print(f'📅 Found {len(games_by_date[today_date_est])} games for today (EST)')
        return games_by_date[today_date_est]
    
    # Get the next available date (EST)
    print('📅 No games today, finding next available day...')
    next_date = min(games_by_date.keys())
    next_games = games_by_date[next_date]
    
    print(f'📅 Found {len(next_games)} games for {next_date.strftime("%B %d, %Y")} (EST)')
    return next_games


def calculate_user_stats(user_id):
    """Calculate user statistics"""
    bets = Bet.query.filter_by(user_id=user_id).all()
    
    total_bets = len(bets)
    pending_bets = len([b for b in bets if b.result == 'PENDING'])
    won_bets = len([b for b in bets if b.result == 'WON'])
    lost_bets = len([b for b in bets if b.result == 'LOST'])
    
    total_staked = sum(b.stake for b in bets)
    total_profit = sum(b.profit for b in bets if b.profit is not None)
    
    win_rate = (won_bets / (won_bets + lost_bets) * 100) if (won_bets + lost_bets) > 0 else 0
    roi = (total_profit / total_staked * 100) if total_staked > 0 else 0
    
    return {
        'totalBets': total_bets,
        'pendingBets': pending_bets,
        'wonBets': won_bets,
        'lostBets': lost_bets,
        'totalStaked': total_staked,
        'totalProfit': total_profit,
        'winRate': win_rate,
        'roi': roi
    }


def calculate_analytics(user_id):
    """Calculate detailed analytics"""
    bets = Bet.query.filter_by(user_id=user_id).all()
    
    # Bet type stats
    bet_type_stats = {}
    for bet in bets:
        if bet.bet_type not in bet_type_stats:
            bet_type_stats[bet.bet_type] = {
                'totalBets': 0,
                'wonBets': 0,
                'lostBets': 0,
                'totalStaked': 0,
                'totalProfit': 0
            }
        
        stats = bet_type_stats[bet.bet_type]
        stats['totalBets'] += 1
        stats['totalStaked'] += bet.stake
        if bet.result == 'WON':
            stats['wonBets'] += 1
        elif bet.result == 'LOST':
            stats['lostBets'] += 1
        if bet.profit:
            stats['totalProfit'] += bet.profit
    
    # Calculate rates
    for bet_type, stats in bet_type_stats.items():
        total_decided = stats['wonBets'] + stats['lostBets']
        stats['winRate'] = (stats['wonBets'] / total_decided * 100) if total_decided > 0 else 0
        stats['roi'] = (stats['totalProfit'] / stats['totalStaked'] * 100) if stats['totalStaked'] > 0 else 0
    
    # Team stats
    team_stats = {}
    for bet in bets:
        if bet.team and bet.result in ['WON', 'LOST']:
            if bet.team not in team_stats:
                team_stats[bet.team] = {'bets': 0, 'wins': 0, 'losses': 0, 'profit': 0}
            
            team_stats[bet.team]['bets'] += 1
            if bet.result == 'WON':
                team_stats[bet.team]['wins'] += 1
            else:
                team_stats[bet.team]['losses'] += 1
            if bet.profit:
                team_stats[bet.team]['profit'] += bet.profit
    
    # Calculate win rates
    for team, stats in team_stats.items():
        total = stats['wins'] + stats['losses']
        stats['winRate'] = (stats['wins'] / total * 100) if total > 0 else 0
    
    # Sort teams by profit
    team_stats_list = [
        {'team': team, **stats} 
        for team, stats in team_stats.items()
    ]
    team_stats_list.sort(key=lambda x: x['profit'], reverse=True)
    
    return {
        'betTypeStats': [
            {'betType': bt, **stats}
            for bt, stats in bet_type_stats.items()
        ],
        'teamStats': team_stats_list[:10]
    }


def get_leaderboard_data():
    """Get leaderboard rankings"""
    users = User.query.all()
    leaderboard = []
    
    for user in users:
        stats = calculate_user_stats(user.id)
        if stats['totalBets'] > 0:
            leaderboard.append({
                'username': user.username,
                'totalProfit': stats['totalProfit'],
                'totalStaked': stats['totalStaked'],
                'totalBets': stats['totalBets'],
                'wonBets': stats['wonBets'],
                'lostBets': stats['lostBets'],
                'winRate': stats['winRate'],
                'roi': stats['roi']
            })
    
    # Sort by profit
    leaderboard.sort(key=lambda x: x['totalProfit'], reverse=True)
    return leaderboard


# ==================== TEMPLATE FILTERS ====================

@app.template_filter('format_odds')
def format_odds(odds):
    """Format American odds with + sign"""
    if odds > 0:
        return f'+{odds}'
    return str(odds)


@app.template_filter('format_currency')
def format_currency(amount):
    """Format currency"""
    if amount >= 0:
        return f'+${amount:.2f}'
    return f'-${abs(amount):.2f}'


@app.template_filter('format_datetime')
def format_datetime(dt):
    """Format datetime in EST"""
    from pytz import timezone as pytz_timezone
    
    # Define timezones
    est = pytz_timezone('America/New_York')
    utc = pytz_timezone('UTC')
    
    # Convert UTC to EST
    dt_utc = dt.replace(tzinfo=utc)
    dt_est = dt_utc.astimezone(est)
    
    return dt_est.strftime('%b %d, %Y %I:%M %p EST')


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=Config.DEBUG, port=int(os.environ.get('PORT', 3005)))

