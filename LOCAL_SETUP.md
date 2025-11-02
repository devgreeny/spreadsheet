# 🏀 Local Setup Guide

## ✅ Your Project is Ready!

Everything is set up and ready to run locally. Here's how to use it:

---

## 🚀 Quick Start (Easiest Way)

### Option 1: Use the Startup Script

Just run this in your terminal:

```bash
cd /Users/noah/Desktop/spread
./start.sh
```

That's it! The script will:
- ✅ Check all dependencies
- ✅ Set up the database if needed
- ✅ Start the development server
- ✅ Open at http://localhost:3000

---

### Option 2: Manual Start

If you prefer manual control:

```bash
cd /Users/noah/Desktop/spread
npm run dev
```

Then open: http://localhost:3000

---

## 🛑 Stopping the Server

Press `Ctrl + C` in the terminal where the server is running

---

## 📋 What's Already Set Up

✅ **Dependencies Installed**
- Next.js 14
- React 18
- Prisma (SQLite database)
- NextAuth (authentication)
- Tailwind CSS (styling)

✅ **Database Created**
- Location: `prisma/dev.db`
- Type: SQLite (no PostgreSQL needed!)
- Tables: User, Game, Odds, Bet

✅ **Environment Variables**
- File: `.env` (hidden file in root)
- Database configured
- Auth secrets set
- Ready for Odds API key (optional)

✅ **TypeScript & Linting**
- All types configured
- No errors

---

## 🎯 First Steps

### 1. Start the Server
```bash
./start.sh
```

### 2. Open in Browser
Go to: http://localhost:3000

### 3. Register an Account
- Click "Register" (top right)
- Enter email, username, password
- Click "Register"

### 4. Sign In
- Click "Sign In"
- Enter your credentials

### 5. Explore
- **Homepage**: View games (empty until you add API key)
- **Dashboard**: See your bets and stats
- **Leaderboard**: Compete with friends

---

## 🔑 Adding Real Game Data (Optional)

To fetch actual college basketball games:

### 1. Get API Key
- Go to https://the-odds-api.com
- Sign up for free (500 requests/month)
- Copy your API key

### 2. Add to .env
Open `.env` and add your key:
```env
ODDS_API_KEY="your-key-here"
```

### 3. Restart Server
```bash
# Stop with Ctrl+C, then:
./start.sh
```

### 4. Fetch Games
- Go to http://localhost:3000
- Click "Refresh Odds"
- Games will load!

---

## 📁 Project Structure

```
spread/
├── app/              # Pages and API routes
├── components/       # React components
├── lib/             # Utilities (database, auth, API)
├── prisma/          # Database schema + SQLite file
├── .env             # Environment variables (hidden)
├── start.sh         # Easy startup script ⭐
└── package.json     # Dependencies
```

---

## 🔧 Useful Commands

### Start Development
```bash
./start.sh
# or
npm run dev
```

### View Database
```bash
npx prisma studio
```
Opens GUI at http://localhost:5555 to view/edit data

### Reset Database
```bash
rm prisma/dev.db
npx prisma db push
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
```

### Build for Production
```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart
./start.sh
```

### Database Issues
```bash
# Reset the database
rm prisma/dev.db
npx prisma generate
npx prisma db push
```

### Module Not Found Errors
```bash
# Reinstall dependencies
npm install
```

### Can't See .env File
The `.env` file is hidden (starts with dot).

**To view in terminal:**
```bash
cat .env
```

**To edit in VS Code/Cursor:**
- File → Open → Type full path: `/Users/noah/Desktop/spread/.env`

**To show in Finder:**
- Press `Cmd + Shift + .` to show hidden files

---

## 🎮 Testing the App

### 1. Create Multiple Users
- Register 3-4 test accounts
- Sign in with each one

### 2. Place Test Bets
- Without API key: You won't see games, but you can test the UI
- With API key: Click "Refresh Odds" to load real games

### 3. Check Dashboard
- View your bet history
- See statistics
- Track profit/loss

### 4. View Leaderboard
- See all users ranked by profit
- Compare win rates

---

## 🌐 Accessing from Other Devices

### Same WiFi Network

1. Find your local IP:
```bash
ipconfig getifaddr en0
```

2. Update `.env`:
```env
NEXTAUTH_URL="http://YOUR-IP:3000"
```

3. Restart server

4. Access from phone/tablet:
```
http://YOUR-IP:3000
```

---

## 📱 Current Features

✅ **Authentication**
- Register new users
- Login/logout
- Session management

✅ **Game Viewing**
- Today's games with odds
- Moneyline, Spreads, Totals
- One-click bet placement

✅ **Betting**
- Place bets on any market
- See potential payout
- Track all bets

✅ **Dashboard**
- Personal bet history
- Win rate, ROI, profit
- Statistics breakdown

✅ **Leaderboard**
- User rankings
- Compete with friends
- Real-time updates

---

## 🔮 What's NOT Included (Yet)

This is the **simple version**. These features can be added later:

❌ Automatic bet grading (manual for now)
❌ Scheduled odds updates (manual refresh)
❌ Push notifications
❌ Advanced analytics
❌ Mobile app
❌ Live score updates

**But that's okay!** This version works perfectly for getting started and testing with friends.

---

## 🚀 Ready to Use!

Your app is fully set up and ready to run locally. Just run:

```bash
./start.sh
```

And open http://localhost:3000 in your browser! 🎉

---

## 💡 Pro Tips

1. **Keep the terminal open** while using the app
2. **Check terminal for errors** if something doesn't work
3. **Use Prisma Studio** (`npx prisma studio`) to view/edit database
4. **Restart server** after changing `.env` file
5. **Basketball season** runs November-April for real games

---

## 📚 More Resources

- **README.md** - Project overview
- **QUICKSTART.md** - Detailed setup
- **PROJECT_STRUCTURE.md** - Code organization
- **SETUP.md** - Troubleshooting checklist

---

**Need help?** Check the terminal output for errors, or ask! 🏀

