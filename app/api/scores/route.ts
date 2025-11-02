import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchScores } from '@/lib/odds-api'
import { gradeBetsForGame } from '@/lib/grade-bets'

export async function POST(request: Request) {
  try {
    const { sport } = await request.json().catch(() => ({ sport: 'basketball_ncaab' }))
    
    console.log(`🔄 Fetching scores for ${sport}...`)
    
    // Fetch scores from API
    const scoresData = await fetchScores(sport)
    
    if (scoresData.length === 0) {
      return NextResponse.json({ 
        message: 'No scores available',
        gamesUpdated: 0,
      }, { status: 200 })
    }

    let gamesUpdated = 0
    let betsGraded = 0
    const errors: string[] = []

    for (const scoreData of scoresData) {
      try {
        // Find the game by external ID
        const game = await prisma.game.findUnique({
          where: { externalId: scoreData.id }
        })

        if (!game) {
          console.log(`⚠️ Game not found: ${scoreData.id}`)
          continue
        }

        // Extract scores - match by team name, not array position
        let awayScore = null
        let homeScore = null
        
        if (scoreData.scores && scoreData.scores.length >= 2) {
          const awayScoreData = scoreData.scores.find(s => s.name === game.awayTeam)
          const homeScoreData = scoreData.scores.find(s => s.name === game.homeTeam)
          
          awayScore = awayScoreData ? parseInt(awayScoreData.score) : null
          homeScore = homeScoreData ? parseInt(homeScoreData.score) : null
          
          console.log(`📊 ${game.awayTeam} ${awayScore} @ ${game.homeTeam} ${homeScore}`)
        }

        // Update game with scores
        await prisma.game.update({
          where: { externalId: scoreData.id },
          data: {
            awayScore,
            homeScore,
            isCompleted: scoreData.completed || false,
          }
        })

        gamesUpdated++
        
        const status = scoreData.completed ? '✅ FINAL' : '🔴 LIVE'
        console.log(`${status} Updated: ${awayScore} - ${homeScore}`)

        // Grade bets if game is completed and we have valid scores
        if (scoreData.completed && awayScore !== null && homeScore !== null) {
          const gradedForGame = await gradeBetsForGame(
            game.id,
            game.awayTeam,
            game.homeTeam,
            awayScore,
            homeScore
          )
          betsGraded += gradedForGame
        }
        
      } catch (gameError) {
        const errorMsg = `Error updating game ${scoreData.id}`
        console.error(errorMsg, gameError)
        errors.push(errorMsg)
      }
    }

    console.log(`✅ Scores update complete: ${gamesUpdated} games updated, ${betsGraded} bets graded`)
    
    return NextResponse.json({ 
      message: 'Scores updated successfully',
      gamesUpdated,
      betsGraded,
      totalGames: scoresData.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('❌ Error updating scores:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

