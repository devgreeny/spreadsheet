import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchOdds } from '@/lib/odds-api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'basketball_ncaab'
    
    // Get upcoming games AND live games (started but not completed)
    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const games = await prisma.game.findMany({
      where: {
        sport,
        OR: [
          {
            // Upcoming games (next 7 days)
            gameTime: {
              gte: now,
              lt: nextWeek,
            },
          },
          {
            // Live games (started recently but not completed)
            gameTime: {
              gte: yesterday,
              lt: now,
            },
            isCompleted: false,
          },
        ],
      },
      include: {
        odds: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        gameTime: 'asc',
      },
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching odds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch odds' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sport } = await request.json().catch(() => ({ sport: 'basketball_ncaab' }))
    
    console.log(`🔄 Starting odds update for ${sport}...`)
    
    // Fetch odds from API and update database
    const oddsData = await fetchOdds(sport)

    if (oddsData.length === 0) {
      return NextResponse.json({ 
        message: 'No games available',
        gamesProcessed: 0,
        warning: 'API returned 0 games. Check console logs for details.'
      }, { status: 200 })
    }

    let gamesProcessed = 0
    const errors: string[] = []

    for (const gameData of oddsData) {
      try {
        const gameTime = new Date(gameData.commence_time)

        // Create or update game
        let game = await prisma.game.upsert({
          where: {
            externalId: gameData.id,
          },
        create: {
          externalId: gameData.id,
          sport: sport,
          gameTime,
          awayTeam: gameData.away_team,
          homeTeam: gameData.home_team,
        },
          update: {
            gameTime,
          },
        })

        // Extract odds from bookmaker (using DraftKings or first available)
        const bookmaker = gameData.bookmakers.find(b => b.key === 'draftkings') || gameData.bookmakers[0]
        
        if (bookmaker) {
          const h2h = bookmaker.markets.find(m => m.key === 'h2h')
          const spreads = bookmaker.markets.find(m => m.key === 'spreads')
          const totals = bookmaker.markets.find(m => m.key === 'totals')

          const oddsDataToSave: any = {
            bookmaker: bookmaker.key,
          }

          if (h2h) {
            const awayML = h2h.outcomes.find(o => o.name === gameData.away_team)
            const homeML = h2h.outcomes.find(o => o.name === gameData.home_team)
            if (awayML) oddsDataToSave.awayML = awayML.price
            if (homeML) oddsDataToSave.homeML = homeML.price
          }

          if (spreads) {
            const awaySpread = spreads.outcomes.find(o => o.name === gameData.away_team)
            const homeSpread = spreads.outcomes.find(o => o.name === gameData.home_team)
            if (awaySpread) {
              oddsDataToSave.awaySpread = awaySpread.point
              oddsDataToSave.spreadOdds = awaySpread.price
            }
            if (homeSpread) {
              oddsDataToSave.homeSpread = homeSpread.point
            }
          }

          if (totals && totals.outcomes.length > 0) {
            const over = totals.outcomes.find(o => o.name === 'Over')
            const under = totals.outcomes.find(o => o.name === 'Under')
            if (over) {
              oddsDataToSave.totalLine = over.point
              oddsDataToSave.overOdds = over.price
            }
            if (under) {
              oddsDataToSave.underOdds = under.price
            }
          }

          // Create odds record
          await prisma.odds.create({
            data: {
              gameId: game.id,
              ...oddsDataToSave,
            },
          })
          
          gamesProcessed++
          console.log(`✅ Processed: ${gameData.away_team} @ ${gameData.home_team}`)
        } else {
          errors.push(`No bookmaker data for ${gameData.away_team} @ ${gameData.home_team}`)
        }
      } catch (gameError) {
        const errorMsg = `Error processing game: ${gameData.away_team} @ ${gameData.home_team}`
        console.error(errorMsg, gameError)
        errors.push(errorMsg)
      }
    }

    console.log(`✅ Odds update complete: ${gamesProcessed} games processed`)
    
    return NextResponse.json({ 
      message: 'Odds updated successfully',
      gamesProcessed,
      totalGames: oddsData.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('❌ Error updating odds:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update odds',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

