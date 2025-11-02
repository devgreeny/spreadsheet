# Deployment Guide - The Spreadsheet

Complete guide to deploy your Flask betting app to production on Railway.

## Pre-Deployment Checklist

✅ Manual API refresh buttons removed  
✅ Automatic scheduler configured (4x daily odds, 7x daily scores)  
✅ Production config ready  
✅ `.env` in `.gitignore`  
✅ All dependencies in `requirements.txt`  

## Step 1: Test Locally

Make sure everything works locally first:

```bash
# Test with your current database
python3 app.py

# Visit http://localhost:3005
# Check console for scheduler messages
```

You should see:
```
✅ Scheduler started:
   - Odds fetch: 6 AM, 12 PM, 6 PM, 11 PM EST
   - Score updates: Every 3 hours (7 AM - 1 AM EST)
```

## Step 2: Push to GitHub

1. **Initialize git** (if not already done):
```bash
cd /Users/noah/Desktop/spread
git init
```

2. **Add files**:
```bash
git add .
git commit -m "Flask betting app ready for deployment"
```

3. **Create GitHub repo**:
   - Go to github.com → New repository
   - Name it: `spread` or `betting-tracker`
   - Don't initialize with README (you already have files)

4. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### 3.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (easiest)

### 3.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `spread` repository
4. Railway will auto-detect it's a Python app

### 3.3 Add PostgreSQL Database
1. In your Railway project dashboard
2. Click **"New"** → **"Database"** → **"PostgreSQL"**
3. Railway automatically sets `DATABASE_URL` environment variable
4. ✅ Your Flask app will connect automatically!

### 3.4 Set Environment Variables

Click on your Flask app service → **"Variables"** tab:

**Required Variables:**

```bash
SECRET_KEY=<generate-below>
FLASK_ENV=production
ODDS_API_KEY=<your-existing-key>
```

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste as `SECRET_KEY` in Railway.

**Get ODDS_API_KEY:**
- Copy from your local `.env` file
- Or get from [the-odds-api.com](https://the-odds-api.com)

### 3.5 Deploy!

Railway automatically:
- ✅ Installs dependencies from `requirements.txt`
- ✅ Runs database migrations
- ✅ Starts app with `gunicorn` (from `Procfile`)
- ✅ Provides public URL

**Your app will be live at:** `https://your-app-name.up.railway.app`

## Step 4: Initialize Database

Railway doesn't run `init_db.py` automatically, so we need to create tables.

**Option A: Use Railway CLI** (recommended):

1. Install Railway CLI:
```bash
npm install -g @railway/cli
# or
brew install railway
```

2. Login and run init script:
```bash
railway login
railway link  # Select your project
railway run python init_db.py
```

**Option B: One-time manual trigger:**

Temporarily add this to your `app.py` (already exists):
```python
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # This line creates tables
    app.run(debug=Config.DEBUG, port=int(os.environ.get('PORT', 3005)))
```

Railway will run this on first deploy and create tables automatically! ✅

## Step 5: Test Production

1. **Visit your Railway URL**
2. **Register a new account**
3. **Login**
4. **Check if games are displayed** (may need to wait for next scheduled fetch)
5. **Place a test bet**
6. **Check dashboard**

### View Logs

In Railway dashboard:
- Click **"Deployments"** tab
- Click latest deployment
- View real-time logs
- Look for scheduler messages:
```
🕐 Scheduled odds fetch starting...
✅ Processed and saved 45 games with odds
```

## Step 6: Monitor API Usage

1. Login to [the-odds-api.com](https://the-odds-api.com)
2. Go to **"Usage"** dashboard
3. Check daily/monthly requests
4. Should use ~10-15 requests/day = ~300-450/month
5. Well within 500 free requests/month ✅

## Automatic Updates

Your scheduler will automatically:

**Odds Updates (4x daily):**
- 6:00 AM EST - Morning update
- 12:00 PM EST - Noon update  
- 6:00 PM EST - Evening games
- 11:00 PM EST - Late games

**Score Updates & Bet Grading (7x daily):**
- Every 3 hours from 7 AM to 1 AM EST
- Automatically grades all pending bets
- Updates game scores

## Continuous Deployment

After initial setup, Railway auto-deploys:

1. Make changes locally
2. Commit: `git commit -am "Your change"`
3. Push: `git push`
4. Railway detects push and auto-deploys in ~2 minutes ✅

## Custom Domain (Optional)

1. In Railway project → **"Settings"**
2. Click **"Generate Domain"** for free Railway subdomain
3. Or add your custom domain (requires DNS setup)

## Troubleshooting

### App Won't Start

Check Railway logs for errors:
```
ModuleNotFoundError: No module named 'X'
```
→ Add missing package to `requirements.txt` and push

### Database Connection Error
```
Could not parse SQLAlchemy URL
```
→ Make sure PostgreSQL database is added in Railway
→ Check `DATABASE_URL` is automatically set

### No Games Showing

→ Wait for next scheduled odds fetch (check times above)
→ Or manually trigger: use Railway CLI to run a one-time fetch

### Scheduler Not Running

Check logs for:
```
✅ Scheduler started:
```

If missing, scheduler might not be starting. Check `app.py` is running.

### Out of API Credits

→ Check usage at the-odds-api.com
→ Reduce scheduler frequency in `app.py`
→ Or upgrade to paid tier ($20/month for 5,000 requests)

## Cost Estimate

**Free Tier (Recommended Start):**
- Railway: $5 credit/month (≈500 hours) - **FREE**
- PostgreSQL: Included with Railway - **FREE**
- The Odds API: 500 requests/month - **FREE**
- **Total: $0/month** ✅

**Paid Tier (If Needed):**
- Railway Hobby: $5/month
- The Odds API Pro: $20/month
- **Total: $25/month**

## Scaling Tips

1. **Add more users**: Free tier handles 100+ users easily
2. **Add caching**: Use Redis for leaderboard (Railway add-on)
3. **Optimize queries**: Add database indexes
4. **Monitor performance**: Railway provides metrics

## Security Notes

✅ `.env` not committed to Git
✅ `SECRET_KEY` set in Railway (not in code)
✅ HTTPS enabled automatically by Railway
✅ Database credentials never exposed
✅ Production debug mode disabled

## Support

**Railway Issues:**
- Check [Railway docs](https://docs.railway.app)
- Railway Discord community

**App Issues:**
- Check Railway logs
- Review `README_FLASK.md` for app details

## Next Steps

After successful deployment:

1. ✅ Share URL with friends
2. ✅ Monitor API usage first few days
3. ✅ Test bet grading when games complete
4. ✅ Customize as needed
5. ✅ Enjoy! 🎉

---

**Your app is now live 24/7!** 🚀

