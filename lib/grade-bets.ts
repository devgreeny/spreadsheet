import { prisma } from './prisma'

interface GradeBetParams {
  betId: string
  betType: string
  team: string | null
  line: number | null
  odds: number
  stake: number
  awayTeam: string
  homeTeam: string
  awayScore: number
  homeScore: number
}

export function calculateBetResult(params: GradeBetParams): {
  result: 'WON' | 'LOST' | 'PUSH'
  profit: number
} {
  const { betType, team, line, odds, stake, awayTeam, homeTeam, awayScore, homeScore } = params

  let result: 'WON' | 'LOST' | 'PUSH' = 'LOST'

  // Grade Moneyline bets
  if (betType === 'ML') {
    if (team === awayTeam && awayScore > homeScore) {
      result = 'WON'
    } else if (team === homeTeam && homeScore > awayScore) {
      result = 'WON'
    } else if (awayScore === homeScore) {
      result = 'PUSH'
    } else {
      result = 'LOST'
    }
  }

  // Grade Spread bets
  else if (betType === 'SPREAD' && line !== null) {
    const teamScore = team === awayTeam ? awayScore : homeScore
    const opponentScore = team === awayTeam ? homeScore : awayScore
    const margin = teamScore + line - opponentScore

    if (margin > 0) {
      result = 'WON'
    } else if (margin === 0) {
      result = 'PUSH'
    } else {
      result = 'LOST'
    }
  }

  // Grade Total Over bets
  else if (betType === 'TOTAL_OVER' && line !== null) {
    const total = awayScore + homeScore
    if (total > line) {
      result = 'WON'
    } else if (total === line) {
      result = 'PUSH'
    } else {
      result = 'LOST'
    }
  }

  // Grade Total Under bets
  else if (betType === 'TOTAL_UNDER' && line !== null) {
    const total = awayScore + homeScore
    if (total < line) {
      result = 'WON'
    } else if (total === line) {
      result = 'PUSH'
    } else {
      result = 'LOST'
    }
  }

  // Calculate profit
  let profit = 0
  if (result === 'WON') {
    // American odds calculation
    if (odds > 0) {
      // Positive odds: profit = stake * (odds / 100)
      profit = stake * (odds / 100)
    } else {
      // Negative odds: profit = stake / (|odds| / 100)
      profit = stake / (Math.abs(odds) / 100)
    }
  } else if (result === 'LOST') {
    profit = -stake
  } else {
    // PUSH - no profit or loss
    profit = 0
  }

  return { result, profit }
}

export async function gradeBetsForGame(
  gameId: string,
  awayTeam: string,
  homeTeam: string,
  awayScore: number,
  homeScore: number
): Promise<number> {
  // Find all pending bets for this game
  const pendingBets = await prisma.bet.findMany({
    where: {
      gameId,
      result: 'PENDING',
    },
  })

  if (pendingBets.length === 0) {
    console.log(`   No pending bets to grade for this game`)
    return 0
  }

  console.log(`   🎯 Grading ${pendingBets.length} pending bet(s)...`)

  let gradedCount = 0

  for (const bet of pendingBets) {
    try {
      const { result, profit } = calculateBetResult({
        betId: bet.id,
        betType: bet.betType,
        team: bet.team,
        line: bet.line,
        odds: bet.odds,
        stake: bet.stake,
        awayTeam,
        homeTeam,
        awayScore,
        homeScore,
      })

      // Update the bet with result and profit
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          result,
          profit,
        },
      })

      const profitDisplay = profit > 0 ? `+$${profit.toFixed(2)}` : `$${profit.toFixed(2)}`
      const resultEmoji = result === 'WON' ? '✅' : result === 'LOST' ? '❌' : '🔄'
      
      console.log(
        `   ${resultEmoji} ${result}: ${bet.betType} ${bet.team || ''} (${profitDisplay})`
      )

      gradedCount++
    } catch (error) {
      console.error(`   ❌ Error grading bet ${bet.id}:`, error)
    }
  }

  return gradedCount
}

