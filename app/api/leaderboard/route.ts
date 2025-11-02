import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all users with their bets
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        bets: {
          select: {
            result: true,
            profit: true,
            stake: true,
          },
        },
      },
    })

    // Calculate stats for each user
    const leaderboard = users.map(user => {
      const totalProfit = user.bets.reduce((sum, bet) => sum + (bet.profit || 0), 0)
      const totalStaked = user.bets.reduce((sum, bet) => sum + bet.stake, 0)
      const wonBets = user.bets.filter(bet => bet.result === 'WON').length
      const lostBets = user.bets.filter(bet => bet.result === 'LOST').length
      const settledBets = wonBets + lostBets
      const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0
      const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

      return {
        username: user.username,
        totalProfit,
        totalStaked,
        totalBets: user.bets.length,
        wonBets,
        lostBets,
        winRate,
        roi,
      }
    })

    // Sort by profit
    leaderboard.sort((a, b) => b.totalProfit - a.totalProfit)

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

