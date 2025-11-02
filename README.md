# The Spreadsheet - College Basketball Betting Tracker

A simple, full-stack web application for tracking college basketball bets with friends.

## Features

- 🔐 User authentication (register/login)
- 🏀 View today's college basketball games with live odds
- 💰 Place bets on Moneyline, Spreads, and Totals
- 📊 Personal dashboard with bet history and statistics
- 🏆 Leaderboard to compete with friends
- 📱 Mobile-friendly design

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **APIs**: The Odds API for live odds and scores

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)
- The Odds API key (get one at https://the-odds-api.com)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spread
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/spreadsheet"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
ODDS_API_KEY="your-odds-api-key"
```

To generate a secret for NextAuth:
```bash
openssl rand -base64 32
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### First Time Setup

1. **Register an account** at `/register`
2. **Sign in** at `/login`
3. **Refresh odds** on the homepage to fetch today's games
4. **Place a bet** by clicking on any odds
5. **View your bets** on the dashboard

### Fetching Odds

- On the homepage, click "Refresh Odds" to fetch today's college basketball games from The Odds API
- Odds include Moneyline, Spreads, and Totals from DraftKings (or first available bookmaker)

### Placing Bets

1. Click on any odds button (ML, Spread, or Total)
2. Enter your stake amount
3. Review the potential payout
4. Click "Place Bet"

### Dashboard

- View all your bets (pending and settled)
- See your statistics: Win Rate, Total Profit, ROI
- Track your performance over time

### Leaderboard

- Compete with friends
- Ranked by total profit
- Shows win rate and ROI for each user

## Database Schema

- **Users**: Authentication and profile data
- **Games**: Basketball matchups and scores
- **Odds**: Betting lines from bookmakers
- **Bets**: User bets and results

## API Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `GET /api/odds` - Get today's games
- `POST /api/odds` - Fetch fresh odds from API
- `GET /api/bets` - Get user's bets
- `POST /api/bets` - Place a new bet
- `GET /api/dashboard` - Get user stats
- `GET /api/leaderboard` - Get rankings

## Development

### Project Structure

```
spread/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Register page
│   └── page.tsx          # Home page
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema
└── types/                # TypeScript definitions
```

### Adding Features

This is a simple version to get started. Here are some features you could add:

- Automatic bet grading with scores API
- Cron jobs for updating odds
- More detailed statistics
- Betting history filters
- Team-specific stats
- Push notifications
- Mobile app

## Deployment

### Recommended: Vercel + Neon

1. Push code to GitHub
2. Import to Vercel
3. Create a Neon PostgreSQL database
4. Add environment variables in Vercel
5. Deploy!

See full deployment instructions in `DEPLOYMENT.md` (coming soon)

## Cost

- **Free tier**: Perfect for small groups
- Vercel: Free
- Neon PostgreSQL: Free (0.5GB)
- The Odds API: Free (500 requests/month)

## License

MIT

## Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ for basketball season 🏀

