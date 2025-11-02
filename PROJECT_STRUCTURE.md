# Project Structure

## 📁 Complete File Tree

```
spread/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind CSS setup
│   ├── postcss.config.js         # PostCSS configuration
│   ├── next.config.js            # Next.js configuration
│   ├── .gitignore                # Git ignore rules
│   └── env.example               # Environment variables template
│
├── 📱 App Directory (Next.js 14 App Router)
│   ├── layout.tsx                # Root layout with Navbar
│   ├── globals.css               # Global styles
│   ├── page.tsx                  # Home page (Offerings)
│   │
│   ├── 🔐 Authentication Pages
│   │   ├── login/page.tsx        # Sign in page
│   │   └── register/page.tsx     # Registration page
│   │
│   ├── 📊 Dashboard
│   │   └── dashboard/page.tsx    # User dashboard
│   │
│   └── 🔌 API Routes
│       └── api/
│           ├── auth/
│           │   ├── [...nextauth]/route.ts    # NextAuth handler
│           │   └── register/route.ts         # User registration
│           ├── odds/route.ts                 # Fetch/serve odds
│           ├── bets/route.ts                 # Place/get bets
│           ├── dashboard/route.ts            # User statistics
│           └── leaderboard/route.ts          # Rankings
│
├── 🎨 Components
│   ├── Providers.tsx             # NextAuth session provider
│   ├── Navbar.tsx                # Navigation bar
│   ├── OfferingsPage.tsx         # Main game listings
│   ├── GameCard.tsx              # Individual game display
│   ├── PlaceBetModal.tsx         # Bet placement modal
│   ├── Leaderboard.tsx           # User rankings
│   └── DashboardPage.tsx         # User dashboard UI
│
├── 🔧 Library Functions
│   ├── prisma.ts                 # Prisma database client
│   ├── auth.ts                   # NextAuth configuration
│   └── odds-api.ts               # The Odds API client
│
├── 💾 Database
│   └── prisma/
│       └── schema.prisma         # Database schema
│           ├── User model        # Users and auth
│           ├── Game model        # Basketball games
│           ├── Odds model        # Betting lines
│           └── Bet model         # User bets
│
├── 📘 TypeScript
│   └── types/
│       └── next-auth.d.ts        # NextAuth type definitions
│
└── 📚 Documentation
    ├── README.md                 # Project overview
    ├── QUICKSTART.md             # 10-minute setup guide
    ├── SETUP.md                  # Setup checklist
    └── PROJECT_STRUCTURE.md      # This file
```

## 🎯 Key Features by File

### Authentication System
- `app/api/auth/[...nextauth]/route.ts` - Handles sign in/out
- `app/api/auth/register/route.ts` - User registration
- `app/login/page.tsx` - Login UI
- `app/register/page.tsx` - Registration UI
- `lib/auth.ts` - NextAuth configuration

### Betting System
- `app/api/bets/route.ts` - Place and retrieve bets
- `components/PlaceBetModal.tsx` - Bet placement UI
- `components/GameCard.tsx` - Display betting options

### Odds & Games
- `app/api/odds/route.ts` - Fetch from API, serve to frontend
- `lib/odds-api.ts` - The Odds API integration
- `components/OfferingsPage.tsx` - Display games

### User Dashboard
- `app/api/dashboard/route.ts` - User statistics
- `app/dashboard/page.tsx` - Dashboard page
- `components/DashboardPage.tsx` - Dashboard UI

### Leaderboard
- `app/api/leaderboard/route.ts` - Calculate rankings
- `components/Leaderboard.tsx` - Leaderboard UI

### Database
- `prisma/schema.prisma` - All models and relationships
- `lib/prisma.ts` - Database client singleton

## 🔄 Data Flow

### Placing a Bet
```
User clicks odds in GameCard
  ↓
PlaceBetModal opens
  ↓
User enters stake
  ↓
POST /api/bets
  ↓
Bet saved to database
  ↓
Dashboard updates
```

### Fetching Odds
```
User clicks "Refresh Odds"
  ↓
POST /api/odds
  ↓
Fetch from The Odds API
  ↓
Save to database (Games + Odds)
  ↓
GET /api/odds
  ↓
Display in OfferingsPage
```

### Viewing Dashboard
```
User navigates to /dashboard
  ↓
GET /api/dashboard
  ↓
Fetch user's bets + calculate stats
  ↓
Display in DashboardPage
```

## 🗄️ Database Models

### User
- id, email, username, password
- → has many Bets

### Game
- id, gameTime, awayTeam, homeTeam
- awayScore, homeScore, isCompleted
- → has many Odds
- → has many Bets

### Odds
- id, gameId (→ Game)
- awayML, homeML
- awaySpread, homeSpread, spreadOdds
- totalLine, overOdds, underOdds

### Bet
- id, userId (→ User), gameId (→ Game)
- betType, team, line, odds, stake
- result (PENDING, WON, LOST, PUSH)
- profit

## 🎨 Component Hierarchy

```
App (layout.tsx)
├── Navbar
└── Page Content
    │
    ├── Home (page.tsx)
    │   └── OfferingsPage
    │       ├── GameCard (multiple)
    │       │   └── PlaceBetModal (conditional)
    │       └── Leaderboard
    │
    ├── Dashboard (dashboard/page.tsx)
    │   └── DashboardPage
    │       ├── Stats Cards
    │       └── Bets Table
    │
    ├── Login (login/page.tsx)
    └── Register (register/page.tsx)
```

## 🔌 API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/[...nextauth]` | POST | Sign in/out | No |
| `/api/auth/register` | POST | Create account | No |
| `/api/odds` | GET | Get today's games | No |
| `/api/odds` | POST | Fetch fresh odds | No |
| `/api/bets` | GET | Get user's bets | Yes |
| `/api/bets` | POST | Place new bet | Yes |
| `/api/dashboard` | GET | Get user stats | Yes |
| `/api/leaderboard` | GET | Get rankings | No |

## 💅 Styling

- **Framework**: Tailwind CSS
- **Design**: Clean, modern, mobile-first
- **Colors**: 
  - Primary: Blue (betting actions)
  - Success: Green (wins, positive)
  - Danger: Red (losses, negative)
  - Accent: Purple (totals), Yellow (pending)

## 🚀 Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open database GUI

# Production
npm run build            # Build for production
npm start                # Start production server
```

## 📦 Dependencies

### Production
- `next` - React framework
- `react` & `react-dom` - UI library
- `next-auth` - Authentication
- `@prisma/client` - Database ORM
- `bcryptjs` - Password hashing

### Development
- `typescript` - Type safety
- `tailwindcss` - Styling
- `prisma` - Database tools
- TypeScript types for all packages

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth**: https://next-auth.js.org
- **Tailwind**: https://tailwindcss.com/docs
- **The Odds API**: https://the-odds-api.com/liveapi/guides/v4

## ✨ Simple vs Full Version

### ✅ This Simple Version Has:
- User authentication
- View games and odds
- Place bets
- Dashboard with stats
- Leaderboard

### 🔮 Full Version Could Add:
- Automatic bet grading
- Cron jobs for updates
- Push notifications
- Advanced statistics
- Betting history filters
- Team-specific analytics
- Mobile app
- Social features

---

**This is your starting point!** Build on it as you need. 🚀

