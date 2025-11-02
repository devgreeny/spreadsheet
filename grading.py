def calculate_profit(stake, odds, won=True):
    """Calculate profit from American odds"""
    if not won:
        return -stake
    
    if odds > 0:
        # Positive odds (underdog)
        return stake * (odds / 100)
    else:
        # Negative odds (favorite)
        return stake * (100 / abs(odds))


def grade_bet(bet, game):
    """Grade a bet based on game result"""
    if not game.is_completed:
        return
    
    away_score = game.away_score
    home_score = game.home_score
    
    if away_score is None or home_score is None:
        return
    
    # Moneyline
    if bet.bet_type == 'ML':
        if bet.team == game.away_team:
            if away_score > home_score:
                bet.result = 'WON'
                bet.profit = calculate_profit(bet.stake, bet.odds, True)
            else:
                bet.result = 'LOST'
                bet.profit = -bet.stake
        elif bet.team == game.home_team:
            if home_score > away_score:
                bet.result = 'WON'
                bet.profit = calculate_profit(bet.stake, bet.odds, True)
            else:
                bet.result = 'LOST'
                bet.profit = -bet.stake
    
    # Spread
    elif bet.bet_type == 'SPREAD':
        if bet.line is None:
            return
        
        if bet.team == game.away_team:
            # Away team with spread
            covered_score = away_score + bet.line
            if covered_score > home_score:
                bet.result = 'WON'
                bet.profit = calculate_profit(bet.stake, bet.odds, True)
            elif covered_score == home_score:
                bet.result = 'PUSH'
                bet.profit = 0
            else:
                bet.result = 'LOST'
                bet.profit = -bet.stake
        
        elif bet.team == game.home_team:
            # Home team with spread
            covered_score = home_score + bet.line
            if covered_score > away_score:
                bet.result = 'WON'
                bet.profit = calculate_profit(bet.stake, bet.odds, True)
            elif covered_score == away_score:
                bet.result = 'PUSH'
                bet.profit = 0
            else:
                bet.result = 'LOST'
                bet.profit = -bet.stake
    
    # Totals
    elif bet.bet_type == 'TOTAL_OVER':
        if bet.line is None:
            return
        
        total_score = away_score + home_score
        if total_score > bet.line:
            bet.result = 'WON'
            bet.profit = calculate_profit(bet.stake, bet.odds, True)
        elif total_score == bet.line:
            bet.result = 'PUSH'
            bet.profit = 0
        else:
            bet.result = 'LOST'
            bet.profit = -bet.stake
    
    elif bet.bet_type == 'TOTAL_UNDER':
        if bet.line is None:
            return
        
        total_score = away_score + home_score
        if total_score < bet.line:
            bet.result = 'WON'
            bet.profit = calculate_profit(bet.stake, bet.odds, True)
        elif total_score == bet.line:
            bet.result = 'PUSH'
            bet.profit = 0
        else:
            bet.result = 'LOST'
            bet.profit = -bet.stake
    
    print(f'✅ Graded bet {bet.id}: {bet.result} (profit: ${bet.profit})')

