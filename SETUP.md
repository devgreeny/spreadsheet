# Setup Checklist

Follow this checklist to get The Spreadsheet running:

## ✅ Installation

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed (local or Neon account created)
- [ ] Project dependencies installed (`npm install`)

## ✅ Configuration

- [ ] `.env` file created in root directory
- [ ] `DATABASE_URL` set (PostgreSQL connection string)
- [ ] `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` set to `http://localhost:3000`
- [ ] `ODDS_API_KEY` obtained from https://the-odds-api.com

## ✅ Database Setup

- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] Confirmed "Your database is now in sync with your schema"

## ✅ First Run

- [ ] Development server started (`npm run dev`)
- [ ] Opened http://localhost:3000
- [ ] No errors in terminal or browser console
- [ ] Register page loads correctly
- [ ] Created first user account
- [ ] Successfully logged in

## ✅ Testing Features

- [ ] Clicked "Refresh Odds" on homepage
- [ ] Games loaded (or confirmed no games today)
- [ ] Placed a test bet
- [ ] Viewed bet in dashboard
- [ ] Checked leaderboard

## ✅ Next Steps

- [ ] Invited friends to register
- [ ] Placed some real bets
- [ ] Explored the codebase
- [ ] Planned future features

## Common Issues

### Database Connection Error
```
Error: Can't reach database server
```
**Fix**: Check PostgreSQL is running, verify DATABASE_URL in `.env`

### Module Not Found
```
Error: Cannot find module 'X'
```
**Fix**: Run `npm install` again

### NextAuth Error
```
Error: [next-auth][error][NO_SECRET]
```
**Fix**: Ensure NEXTAUTH_SECRET is set in `.env`, restart server

### No Games Loading
- Basketball season runs November to April
- Check ODDS_API_KEY is correct
- Open browser console for API errors
- Verify you have API credits remaining

### Authentication Not Working
- Clear browser cookies
- Check `.env` file has all required variables
- Restart dev server after changing `.env`

## Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/spreadsheet"
NEXTAUTH_SECRET="generated-secret-32-chars"
NEXTAUTH_URL="http://localhost:3000"
ODDS_API_KEY="your-api-key"

# Production (when deploying)
NEXTAUTH_URL="https://your-domain.vercel.app"
```

## Quick Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start dev server
npm run dev

# View database
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## Database Tables

After setup, you should have these tables:
- ✅ User (email, username, password)
- ✅ Game (teams, scores, time)
- ✅ Odds (lines from bookmakers)
- ✅ Bet (user bets, results)

Verify in Prisma Studio: `npx prisma studio`

## File Structure Check

```
spread/
├── .env                    ✅ Created by you
├── app/                    ✅ Next.js pages
├── components/             ✅ React components
├── lib/                    ✅ Utilities
├── prisma/                 ✅ Database schema
├── types/                  ✅ TypeScript types
├── package.json            ✅ Dependencies
├── README.md               ✅ Documentation
└── QUICKSTART.md           ✅ Setup guide
```

## Ready for Production?

Once everything works locally:
1. Push code to GitHub
2. Deploy to Vercel
3. Use Neon for PostgreSQL
4. Add environment variables in Vercel
5. Deploy!

## Need Help?

- Check README.md for overview
- Check QUICKSTART.md for detailed setup
- Open browser console for errors
- Check terminal for error messages

---

**You're all set!** 🎉 Start tracking those bets!

