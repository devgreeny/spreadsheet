import requests
from datetime import datetime
from config import Config
import uuid

def fetch_odds_from_api(sport='basketball_ncaab'):
    """Fetch odds from The Odds API"""
    if not Config.ODDS_API_KEY:
        print('❌ ODDS_API_KEY not set in environment variables')
        return []
    
    url = f"{Config.ODDS_API_BASE_URL}/sports/{sport}/odds/"
    params = {
        'apiKey': Config.ODDS_API_KEY,
        'regions': 'us',
        'markets': 'h2h,spreads,totals',
        'oddsFormat': 'american'
    }
    
    sport_emoji = '🏀' if sport == 'basketball_ncaab' else '🏈'
    print(f'{sport_emoji} Fetching {sport} odds from The Odds API...')
    
    try:
        response = requests.get(url, params=params)
        print(f'📡 API Response Status: {response.status_code}')
        
        if response.status_code != 200:
            print(f'❌ API Error {response.status_code}: {response.text}')
            return []
        
        data = response.json()
        print(f'✅ Successfully fetched {len(data)} games')
        
        if len(data) == 0:
            print('⚠️ API returned 0 games. This could mean:')
            print('  - No games scheduled today')
            print('  - Off-season (NCAA basketball: Nov-Apr)')
            print('  - API key issue')
        
        return data
    except Exception as e:
        print(f'❌ Error fetching odds: {e}')
        return []


def fetch_scores_from_api(sport='basketball_ncaab'):
    """Fetch scores from The Odds API"""
    if not Config.ODDS_API_KEY:
        print('❌ ODDS_API_KEY not set')
        return []
    
    url = f"{Config.ODDS_API_BASE_URL}/sports/{sport}/scores/"
    params = {
        'apiKey': Config.ODDS_API_KEY,
        'daysFrom': 1
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            print(f'❌ Scores API Error {response.status_code}')
            return []
        
        data = response.json()
        print(f'✅ Successfully fetched {len(data)} game scores')
        return data
    except Exception as e:
        print(f'❌ Error fetching scores: {e}')
        return []


def parse_and_save_odds(odds_data, db):
    """Parse odds data and save to database"""
    from models import Game, Odds
    
    games_processed = 0
    
    for game_data in odds_data:
        try:
            # Parse game time
            game_time = datetime.fromisoformat(game_data['commence_time'].replace('Z', '+00:00'))
            
            # Find or create game
            game = Game.query.filter_by(external_id=game_data['id']).first()
            
            if not game:
                game = Game(
                    id=str(uuid.uuid4()),
                    external_id=game_data['id'],
                    sport=game_data['sport_key'],
                    game_time=game_time,
                    away_team=game_data['away_team'],
                    home_team=game_data['home_team']
                )
                db.session.add(game)
            else:
                # Update game time in case it changed
                game.game_time = game_time
            
            # Parse bookmaker odds (use first available bookmaker, prefer DraftKings)
            bookmakers = game_data.get('bookmakers', [])
            if not bookmakers:
                continue
            
            # Try to find DraftKings, otherwise use first bookmaker
            bookmaker_data = next((b for b in bookmakers if b['key'] == 'draftkings'), bookmakers[0])
            
            # Delete old odds for this game
            Odds.query.filter_by(game_id=game.id).delete()
            
            # Parse markets
            markets = {m['key']: m for m in bookmaker_data.get('markets', [])}
            
            odds = Odds(
                id=str(uuid.uuid4()),
                game_id=game.id,
                bookmaker=bookmaker_data['key']
            )
            
            # Moneyline
            if 'h2h' in markets:
                for outcome in markets['h2h']['outcomes']:
                    if outcome['name'] == game.away_team:
                        odds.away_ml = int(outcome['price'])
                    elif outcome['name'] == game.home_team:
                        odds.home_ml = int(outcome['price'])
            
            # Spreads
            if 'spreads' in markets:
                for outcome in markets['spreads']['outcomes']:
                    if outcome['name'] == game.away_team:
                        odds.away_spread = float(outcome['point'])
                        odds.spread_odds = int(outcome['price'])
                    elif outcome['name'] == game.home_team:
                        odds.home_spread = float(outcome['point'])
            
            # Totals
            if 'totals' in markets:
                for outcome in markets['totals']['outcomes']:
                    if outcome['name'] == 'Over':
                        odds.total_line = float(outcome['point'])
                        odds.over_odds = int(outcome['price'])
                    elif outcome['name'] == 'Under':
                        odds.under_odds = int(outcome['price'])
            
            db.session.add(odds)
            games_processed += 1
            
        except Exception as e:
            print(f'❌ Error processing game {game_data.get("id")}: {e}')
            continue
    
    db.session.commit()
    print(f'✅ Processed and saved {games_processed} games with odds')
    return games_processed


def update_scores_and_grade_bets(db):
    """Update game scores and grade bets"""
    from models import Game, Bet
    from grading import grade_bet
    
    scores_data = fetch_scores_from_api()
    games_updated = 0
    bets_graded = 0
    
    for score_data in scores_data:
        if not score_data.get('completed'):
            continue
        
        try:
            game = Game.query.filter_by(external_id=score_data['id']).first()
            if not game:
                continue
            
            # Parse scores
            scores = {s['name']: int(s['score']) for s in score_data.get('scores', [])}
            
            if game.away_team in scores and game.home_team in scores:
                game.away_score = scores[game.away_team]
                game.home_score = scores[game.home_team]
                game.is_completed = True
                games_updated += 1
                
                # Grade all pending bets for this game
                pending_bets = Bet.query.filter_by(game_id=game.id, result='PENDING').all()
                for bet in pending_bets:
                    grade_bet(bet, game)
                    bets_graded += 1
        
        except Exception as e:
            print(f'❌ Error updating scores for game {score_data.get("id")}: {e}')
            continue
    
    db.session.commit()
    print(f'✅ Updated {games_updated} games, graded {bets_graded} bets')
    return games_updated, bets_graded

