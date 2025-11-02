# Quick Start Guide

Get The Spreadsheet running locally in 10 minutes!

## Step 1: Prerequisites

Make sure you have:
- Node.js 18+ installed
- PostgreSQL installed (or use a hosted service)
- A text editor (VS Code recommended)

## Step 2: Clone and Install

```bash
# Navigate to your project directory
cd /Users/noah/Desktop/spread

# Install dependencies
npm install
```

## Step 3: Set Up Database

### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create a database
createdb spreadsheet

# Or use psql
psql
CREATE DATABASE spreadsheet;
\q
```

### Option B: Hosted Database (Neon)

1. Go to https://neon.tech
2. Sign up for free
3. Create a new project
4. Copy the connection string

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/spreadsheet"
NEXTAUTH_SECRET="run-openssl-rand-base64-32-to-generate"
NEXTAUTH_URL="http://localhost:3000"
ODDS_API_KEY="your-odds-api-key"
```

### Get Your Odds API Key

1. Go to https://the-odds-api.com
2. Sign up for free (500 requests/month)
3. Copy your API key
4. Paste it in the `.env` file

### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env`

## Step 5: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

You should see: "Your database is now in sync with your schema."

## Step 6: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Step 7: Create Your First Account

1. Click "Register" in the top right
2. Enter email, username, and password
3. Click "Register"
4. Sign in with your credentials

## Step 8: Load Games

1. On the homepage, click "Refresh Odds"
2. Wait a few seconds for games to load
3. Games will appear if there are any scheduled for today

**Note**: If no games appear, it might be the off-season or no games today. The NCAA basketball season runs from November to April.

## Step 9: Place Your First Bet

1. Click on any odds (ML, Spread, or Total)
2. Enter a stake amount (e.g., 10)
3. Review the potential payout
4. Click "Place Bet"

## Step 10: Check Your Dashboard

Click "Dashboard" in the navigation to see:
- Your bet history
- Win rate
- Total profit
- ROI

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Database connection errors
- Check your DATABASE_URL in `.env`
- Make sure PostgreSQL is running
- Try running `npx prisma db push` again

### No games showing up
- Make sure you clicked "Refresh Odds"
- Check that your ODDS_API_KEY is correct
- Verify it's during basketball season (Nov-Apr)
- Check the browser console for API errors

### Authentication not working
- Make sure NEXTAUTH_SECRET is set in `.env`
- Restart the dev server after changing `.env`

## Next Steps

Now that you have it running:

1. **Invite friends** - Have them register accounts
2. **Place some bets** - Test the functionality
3. **Check the leaderboard** - See the competition
4. **Explore the code** - Customize it to your liking

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma db push --force-reset
```

## Database Management

View and edit your database:
```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can:
- View all tables
- Edit records
- Add test data

## Testing

Create a few test accounts to see the leaderboard in action:
1. Register multiple users
2. Place bets from each account
3. Manually update bet results in Prisma Studio
4. Check the leaderboard

## Ready to Deploy?

Once everything works locally, you're ready to deploy to production!

See the main README.md for deployment instructions.

---

**Need Help?** Check the README.md or open an issue on GitHub.

