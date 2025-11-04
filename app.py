from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_caching import Cache
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import bcrypt
import uuid
import os
from sqlalchemy import desc, func, case

from config import Config
from models import db, User, Game, Odds, Bet
from odds_api import fetch_odds_from_api, parse_and_save_odds, update_scores_and_grade_bets

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Initialize cache
cache = Cache(app, config={
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes default
})

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
            # Clear cache after updating odds
            cache.delete('homepage')
            cache.delete_memoized(get_todays_or_next_games)
        print('🕐 Scheduled odds fetch complete!')

def scheduled_update_scores():
    """Scheduled job to update scores and grade bets"""
    with app.app_context():
        print('🕐 Scheduled score update starting...')
        update_scores_and_grade_bets(db)
        # Clear all caches after grading bets (affects leaderboard and user stats)
        cache.clear()
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
@cache.cached(timeout=60, key_prefix='homepage')
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
    # Pagination for better performance
    page = request.args.get('page', 1, type=int)
    per_page = 50
    
    # Get user's bets with pagination
    bets_pagination = Bet.query.filter_by(user_id=current_user.id)\
        .order_by(desc(Bet.created_at))\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    bets = bets_pagination.items
    
    # Calculate statistics (cached)
    stats = calculate_user_stats(current_user.id)
    
    # Get analytics (cached)
    analytics = calculate_analytics(current_user.id)
    
    return render_template('dashboard.html', 
                         bets=bets, 
                         stats=stats, 
                         analytics=analytics,
                         pagination=bets_pagination)


@app.route('/leaderboard')
def leaderboard():
    """Full leaderboard page"""
    leaderboard_data = get_leaderboard_data()
    return render_template('leaderboard.html', leaderboard=leaderboard_data)


@app.route('/user/<username>')
def user_profile(username):
    """Public user profile - view anyone's bets and stats"""
    # Find user by username
    user = User.query.filter_by(username=username).first()
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('leaderboard'))
    
    # Pagination for bets
    page = request.args.get('page', 1, type=int)
    per_page = 50
    
    # Get user's bets with pagination
    bets_pagination = Bet.query.filter_by(user_id=user.id)\
        .order_by(desc(Bet.created_at))\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    bets = bets_pagination.items
    
    # Calculate statistics
    stats = calculate_user_stats(user.id)
    
    # Get analytics
    analytics = calculate_analytics(user.id)
    
    # Check if viewing own profile
    is_own_profile = current_user.is_authenticated and current_user.id == user.id
    
    return render_template('user_profile.html', 
                         user=user,
                         bets=bets, 
                         stats=stats, 
                         analytics=analytics,
                         pagination=bets_pagination,
                         is_own_profile=is_own_profile)


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
        
        # Allow betting on any game (past, present, or future)
        # This enables retroactive bet logging
        
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


@app.route('/api/edit-bet/<bet_id>', methods=['PUT'])
@login_required
def api_edit_bet(bet_id):
    """Edit an existing bet"""
    try:
        # Find the bet
        bet = Bet.query.get(bet_id)
        if not bet:
            return jsonify({'error': 'Bet not found'}), 404
        
        # Check ownership
        if bet.user_id != current_user.id:
            return jsonify({'error': 'Not authorized to edit this bet'}), 403
        
        # Don't allow editing graded bets
        if bet.result != 'PENDING':
            return jsonify({'error': 'Cannot edit a graded bet. Delete and create a new one instead.'}), 400
        
        data = request.get_json()
        
        # Update fields if provided
        if 'odds' in data:
            bet.odds = int(data['odds'])
        if 'line' in data:
            bet.line = float(data['line']) if data['line'] else None
        if 'stake' in data:
            bet.stake = float(data['stake'])
        if 'team' in data:
            bet.team = data['team']
        
        db.session.commit()
        
        # Clear user stats cache
        cache.delete_memoized(calculate_user_stats, current_user.id)
        cache.delete_memoized(calculate_analytics, current_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Bet updated successfully'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete-bet/<bet_id>', methods=['DELETE'])
@login_required
def api_delete_bet(bet_id):
    """Delete a bet"""
    try:
        # Find the bet
        bet = Bet.query.get(bet_id)
        if not bet:
            return jsonify({'error': 'Bet not found'}), 404
        
        # Check ownership
        if bet.user_id != current_user.id:
            return jsonify({'error': 'Not authorized to delete this bet'}), 403
        
        # Delete the bet
        db.session.delete(bet)
        db.session.commit()
        
        # Clear caches
        cache.delete_memoized(calculate_user_stats, current_user.id)
        cache.delete_memoized(calculate_analytics, current_user.id)
        cache.delete_memoized(get_leaderboard_data)
        
        return jsonify({
            'success': True,
            'message': 'Bet deleted successfully'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== HELPER FUNCTIONS ====================

@cache.memoize(timeout=300)
def get_todays_or_next_games():
    """Get games for today - OPTIMIZED to limit queries"""
    from pytz import timezone as pytz_timezone
    from collections import defaultdict
    
    # Define EST timezone
    est = pytz_timezone('America/New_York')
    utc = pytz_timezone('UTC')
    
    # Get current time
    now_utc = datetime.utcnow()
    now_utc_aware = now_utc.replace(tzinfo=utc)
    now_est = now_utc_aware.astimezone(est)
    
    # Only get games for next 7 days (not ALL upcoming games)
    week_from_now = now_utc + timedelta(days=7)
    
    # Limit query to recent games only
    upcoming_games = Game.query.filter(
        Game.game_time >= now_utc,
        Game.game_time <= week_from_now
    ).order_by(Game.game_time).limit(200).all()
    
    if not upcoming_games:
        print('📅 No upcoming games found in database')
        return []
    
    print(f'📊 Found {len(upcoming_games)} games in next 7 days')
    
    # Group games by EST date
    games_by_date = defaultdict(list)
    
    for game in upcoming_games:
        # Convert UTC game time to EST
        game_time_utc = game.game_time.replace(tzinfo=utc)
        game_time_est = game_time_utc.astimezone(est)
        
        # Extract just the EST date (ignore time)
        game_date_est = game_time_est.date()
        games_by_date[game_date_est].append(game)
    
    # Get today's date in EST
    today_date_est = now_est.date()
    
    # Debug: Print dates with game counts (in EST)
    print('📊 Games by date (EST):')
    for date in sorted(games_by_date.keys())[:3]:  # Only show first 3 dates
        print(f'   {date}: {len(games_by_date[date])} games')
    
    # Check if we have games today (EST)
    if today_date_est in games_by_date:
        print(f'📅 Showing {len(games_by_date[today_date_est])} games for today (EST)')
        return games_by_date[today_date_est]
    
    # Get the next available date (EST)
    print('📅 No games today, showing next available day...')
    next_date = min(games_by_date.keys())
    next_games = games_by_date[next_date]
    
    print(f'📅 Showing {len(next_games)} games for {next_date.strftime("%B %d, %Y")} (EST)')
    return next_games


@cache.memoize(timeout=60)
def calculate_user_stats(user_id):
    """Calculate user statistics - OPTIMIZED with aggregation"""
    # Use database aggregation instead of loading all bets
    stats_query = db.session.query(
        func.count(Bet.id).label('totalBets'),
        func.coalesce(func.sum(Bet.stake), 0).label('totalStaked'),
        func.coalesce(func.sum(Bet.profit), 0).label('totalProfit'),
        func.sum(case((Bet.result == 'PENDING', 1), else_=0)).label('pendingBets'),
        func.sum(case((Bet.result == 'WON', 1), else_=0)).label('wonBets'),
        func.sum(case((Bet.result == 'LOST', 1), else_=0)).label('lostBets')
    ).filter(Bet.user_id == user_id).first()
    
    if not stats_query or stats_query.totalBets == 0:
        return {
            'totalBets': 0,
            'pendingBets': 0,
            'wonBets': 0,
            'lostBets': 0,
            'totalStaked': 0,
            'totalProfit': 0,
            'winRate': 0,
            'roi': 0
        }
    
    total_bets = stats_query.totalBets
    pending_bets = stats_query.pendingBets
    won_bets = stats_query.wonBets
    lost_bets = stats_query.lostBets
    total_staked = float(stats_query.totalStaked)
    total_profit = float(stats_query.totalProfit)
    
    settled_bets = won_bets + lost_bets
    win_rate = (won_bets / settled_bets * 100) if settled_bets > 0 else 0
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


@cache.memoize(timeout=60)
def calculate_analytics(user_id):
    """Calculate detailed analytics - OPTIMIZED"""
    # Bet type stats using aggregation
    bet_type_query = db.session.query(
        Bet.bet_type,
        func.count(Bet.id).label('totalBets'),
        func.coalesce(func.sum(Bet.stake), 0).label('totalStaked'),
        func.coalesce(func.sum(Bet.profit), 0).label('totalProfit'),
        func.sum(case((Bet.result == 'WON', 1), else_=0)).label('wonBets'),
        func.sum(case((Bet.result == 'LOST', 1), else_=0)).label('lostBets')
    ).filter(Bet.user_id == user_id)\
     .group_by(Bet.bet_type)\
     .all()
    
    bet_type_stats = []
    for row in bet_type_query:
        total_decided = row.wonBets + row.lostBets
        win_rate = (row.wonBets / total_decided * 100) if total_decided > 0 else 0
        roi = (row.totalProfit / row.totalStaked * 100) if row.totalStaked > 0 else 0
        
        bet_type_stats.append({
            'betType': row.bet_type,
            'totalBets': row.totalBets,
            'wonBets': row.wonBets,
            'lostBets': row.lostBets,
            'totalStaked': float(row.totalStaked),
            'totalProfit': float(row.totalProfit),
            'winRate': win_rate,
            'roi': roi
        })
    
    # Team stats using aggregation (only for decided bets)
    team_query = db.session.query(
        Bet.team,
        func.count(Bet.id).label('bets'),
        func.sum(case((Bet.result == 'WON', 1), else_=0)).label('wins'),
        func.sum(case((Bet.result == 'LOST', 1), else_=0)).label('losses'),
        func.coalesce(func.sum(Bet.profit), 0).label('profit')
    ).filter(
        Bet.user_id == user_id,
        Bet.team.isnot(None),
        Bet.result.in_(['WON', 'LOST'])
    ).group_by(Bet.team)\
     .order_by(desc(func.sum(Bet.profit)))\
     .limit(10)\
     .all()
    
    team_stats = []
    for row in team_query:
        total = row.wins + row.losses
        win_rate = (row.wins / total * 100) if total > 0 else 0
        
        team_stats.append({
            'team': row.team,
            'bets': row.bets,
            'wins': row.wins,
            'losses': row.losses,
            'profit': float(row.profit),
            'winRate': win_rate
        })
    
    return {
        'betTypeStats': bet_type_stats,
        'teamStats': team_stats
    }


@cache.memoize(timeout=120)
def get_leaderboard_data():
    """Get leaderboard rankings - OPTIMIZED with single query"""
    # Single aggregated query instead of N+1 queries
    leaderboard_query = db.session.query(
        User.username,
        func.count(Bet.id).label('totalBets'),
        func.coalesce(func.sum(Bet.stake), 0).label('totalStaked'),
        func.coalesce(func.sum(Bet.profit), 0).label('totalProfit'),
        func.sum(case((Bet.result == 'WON', 1), else_=0)).label('wonBets'),
        func.sum(case((Bet.result == 'LOST', 1), else_=0)).label('lostBets')
    ).outerjoin(Bet, User.id == Bet.user_id)\
     .group_by(User.id, User.username)\
     .having(func.count(Bet.id) > 0)\
     .all()
    
    leaderboard = []
    for row in leaderboard_query:
        settled_bets = row.wonBets + row.lostBets
        win_rate = (row.wonBets / settled_bets * 100) if settled_bets > 0 else 0
        roi = (row.totalProfit / row.totalStaked * 100) if row.totalStaked > 0 else 0
        
        leaderboard.append({
            'username': row.username,
            'totalProfit': float(row.totalProfit),
            'totalStaked': float(row.totalStaked),
            'totalBets': row.totalBets,
            'wonBets': row.wonBets,
            'lostBets': row.lostBets,
            'winRate': win_rate,
            'roi': roi
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

