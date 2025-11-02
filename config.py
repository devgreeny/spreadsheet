import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Database
    # Railway/Neon use DATABASE_URL, handle both formats
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        # Fix for SQLAlchemy - Railway sometimes uses postgres:// instead of postgresql://
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url or 'postgresql://localhost/spreadsheet'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Odds API
    ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
    ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4'
    
    # Sports
    DEFAULT_SPORT = 'basketball_ncaab'
    
    # Scheduler
    SCHEDULER_API_ENABLED = True
    SCHEDULER_TIMEZONE = 'America/New_York'
    
    # Production settings
    if FLASK_ENV == 'production':
        # Disable debug mode
        DEBUG = False
        # Ensure secret key is set
        if SECRET_KEY == 'dev-secret-key-change-in-production':
            raise ValueError('Must set SECRET_KEY environment variable in production!')
    else:
        DEBUG = True

