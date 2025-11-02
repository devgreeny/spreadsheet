#!/usr/bin/env python3
"""
Database initialization script for The Spreadsheet Flask app
"""

from app import app, db
from models import User, Game, Odds, Bet

def init_database():
    """Initialize the database with all tables"""
    print('🔧 Initializing database...')
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print('✅ Database tables created successfully!')
        
        # Print table info
        print('\n📊 Created tables:')
        print('  - users')
        print('  - games')
        print('  - odds')
        print('  - bets')
        
        print('\n✨ Database is ready to use!')
        print('💡 You can now run the Flask app with: python app.py')

if __name__ == '__main__':
    init_database()

