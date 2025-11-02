# How to Check Your API Credits

## Quick Start

1. **Install required packages** (if you haven't already):
```bash
pip install requests python-dotenv jupyter
```

2. **Navigate to the project directory**:
```bash
cd /Users/noah/Desktop/spread
```

3. **Start Jupyter**:
```bash
jupyter notebook check_api_credits.ipynb
```

4. **Run all cells** (in Jupyter):
   - Click "Cell" → "Run All"
   - Or press Shift+Enter in each cell

## What the Notebook Does

The notebook will:
- ✅ Load your API key from `.env`
- ✅ Make a test request to The Odds API
- ✅ Show your remaining credits
- ✅ Display any games currently available
- ✅ Give you a summary of your API status

## Expected Output

You should see:
- **API Key loaded**: Yes/No
- **Status Code**: 200 (success) or error code
- **Requests Remaining**: Your available credits
- **Number of games found**: 0 (if off-season) or actual count

## Common Issues

### "API Key loaded: No"
- Make sure your `.env` file has `ODDS_API_KEY="your-key-here"`
- Check the file is in the same directory as the notebook

### Status Code 401
- Invalid API key
- Check your key at https://the-odds-api.com

### Status Code 429
- No credits remaining
- You've used all 500 free requests this month

### 0 games found
- NCAA basketball is off-season (runs November-April)
- No games scheduled today
- This is normal and your API is still working!

## Alternative: Run Without Jupyter

If you prefer, run this Python script instead:

```bash
cd /Users/noah/Desktop/spread
python -c "
import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('ODDS_API_KEY')

if not api_key:
    print('❌ No API key found')
else:
    url = f'https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey={api_key}&regions=us&markets=h2h'
    response = requests.get(url)
    print(f'Status: {response.status_code}')
    print(f'Credits Remaining: {response.headers.get(\"x-requests-remaining\", \"Unknown\")}')
    if response.status_code == 200:
        print(f'Games Found: {len(response.json())}')
"
```

