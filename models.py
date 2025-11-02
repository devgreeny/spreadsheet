from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bets = db.relationship('Bet', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'


class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.String(36), primary_key=True)
    external_id = db.Column(db.String(255), unique=True)
    sport = db.Column(db.String(50), default='basketball_ncaab')
    game_time = db.Column(db.DateTime, nullable=False)
    away_team = db.Column(db.String(255), nullable=False)
    home_team = db.Column(db.String(255), nullable=False)
    away_score = db.Column(db.Integer, nullable=True)
    home_score = db.Column(db.Integer, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    odds = db.relationship('Odds', backref='game', lazy=True, cascade='all, delete-orphan')
    bets = db.relationship('Bet', backref='game', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Game {self.away_team} @ {self.home_team}>'


class Odds(db.Model):
    __tablename__ = 'odds'
    
    id = db.Column(db.String(36), primary_key=True)
    game_id = db.Column(db.String(36), db.ForeignKey('games.id', ondelete='CASCADE'), nullable=False)
    bookmaker = db.Column(db.String(100), default='draftkings')
    away_ml = db.Column(db.Integer, nullable=True)
    home_ml = db.Column(db.Integer, nullable=True)
    away_spread = db.Column(db.Float, nullable=True)
    home_spread = db.Column(db.Float, nullable=True)
    spread_odds = db.Column(db.Integer, nullable=True)
    total_line = db.Column(db.Float, nullable=True)
    over_odds = db.Column(db.Integer, nullable=True)
    under_odds = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Odds for Game {self.game_id}>'


class Bet(db.Model):
    __tablename__ = 'bets'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    game_id = db.Column(db.String(36), db.ForeignKey('games.id', ondelete='CASCADE'), nullable=False)
    bet_type = db.Column(db.String(20), nullable=False)  # ML, SPREAD, TOTAL_OVER, TOTAL_UNDER
    team = db.Column(db.String(255), nullable=True)  # which team (for ML and SPREAD)
    line = db.Column(db.Float, nullable=True)  # spread or total line
    odds = db.Column(db.Integer, nullable=False)  # American odds
    stake = db.Column(db.Float, nullable=False)  # amount wagered
    result = db.Column(db.String(20), default='PENDING')  # PENDING, WON, LOST, PUSH
    profit = db.Column(db.Float, nullable=True)  # profit/loss amount
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Bet {self.bet_type} on {self.team}>'

