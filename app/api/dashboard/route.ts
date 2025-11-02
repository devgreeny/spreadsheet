import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all user bets
    const bets = await prisma.bet.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        game: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate overall statistics
    const stats = {
      totalBets: bets.length,
      pendingBets: bets.filter(b => b.result === 'PENDING').length,
      wonBets: bets.filter(b => b.result === 'WON').length,
      lostBets: bets.filter(b => b.result === 'LOST').length,
      totalStaked: bets.reduce((sum, b) => sum + b.stake, 0),
      totalProfit: bets.reduce((sum, b) => sum + (b.profit || 0), 0),
      winRate: 0,
      roi: 0,
    }

    const settledBets = stats.wonBets + stats.lostBets
    if (settledBets > 0) {
      stats.winRate = (stats.wonBets / settledBets) * 100
    }

    if (stats.totalStaked > 0) {
      stats.roi = (stats.totalProfit / stats.totalStaked) * 100
    }

    // Calculate bet type statistics
    const betTypes = ['ML', 'SPREAD', 'TOTAL_OVER', 'TOTAL_UNDER']
    const betTypeStats = betTypes.map(betType => {
      const typeBets = bets.filter(b => b.betType === betType)
      const won = typeBets.filter(b => b.result === 'WON').length
      const lost = typeBets.filter(b => b.result === 'LOST').length
      const settled = won + lost
      const totalStaked = typeBets.reduce((sum, b) => sum + b.stake, 0)
      const totalProfit = typeBets.reduce((sum, b) => sum + (b.profit || 0), 0)

      return {
        betType,
        totalBets: typeBets.length,
        wonBets: won,
        lostBets: lost,
        winRate: settled > 0 ? (won / settled) * 100 : 0,
        totalProfit,
        totalStaked,
        roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
      }
    }).filter(stat => stat.totalBets > 0) // Only include bet types with bets

    // Get recent bets for trend analysis
    const recentBets = bets.slice(0, 10).map(bet => ({
      id: bet.id,
      betType: bet.betType,
      team: bet.team,
      result: bet.result,
      profit: bet.profit,
      stake: bet.stake,
      createdAt: bet.createdAt.toISOString(),
    }))

    // Calculate team statistics
    const teamMap = new Map<string, { bets: number; wins: number; losses: number; profit: number }>()
    
    bets.forEach(bet => {
      if (bet.team) {
        const current = teamMap.get(bet.team) || { bets: 0, wins: 0, losses: 0, profit: 0 }
        current.bets++
        if (bet.result === 'WON') current.wins++
        if (bet.result === 'LOST') current.losses++
        current.profit += bet.profit || 0
        teamMap.set(bet.team, current)
      }
    })

    const teamStats = Array.from(teamMap.entries())
      .map(([team, data]) => ({
        team,
        bets: data.bets,
        wins: data.wins,
        losses: data.losses,
        winRate: (data.wins + data.losses) > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0,
        profit: data.profit,
      }))
      .sort((a, b) => b.profit - a.profit) // Sort by profit descending

    // Calculate this week's statistics
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const thisWeekBets = bets.filter(b => new Date(b.createdAt) >= oneWeekAgo)
    const thisWeekWon = thisWeekBets.filter(b => b.result === 'WON').length
    const thisWeekLost = thisWeekBets.filter(b => b.result === 'LOST').length
    const thisWeekSettled = thisWeekWon + thisWeekLost
    
    const thisWeekStats = {
      bets: thisWeekBets.length,
      profit: thisWeekBets.reduce((sum, b) => sum + (b.profit || 0), 0),
      winRate: thisWeekSettled > 0 ? (thisWeekWon / thisWeekSettled) * 100 : 0,
    }

    // Combine analytics data
    const analytics = {
      betTypeStats,
      recentBets,
      teamStats,
      thisWeekStats,
    }

    return NextResponse.json({ bets, stats, analytics })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

