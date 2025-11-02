import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    return NextResponse.json({ bets })
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { gameId, betType, team, line, odds, stake } = await request.json()

    if (!gameId || !betType || !odds || !stake) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate bet type
    const validBetTypes = ['ML', 'SPREAD', 'TOTAL_OVER', 'TOTAL_UNDER']
    if (!validBetTypes.includes(betType)) {
      return NextResponse.json(
        { error: 'Invalid bet type' },
        { status: 400 }
      )
    }

    // Create bet
    const bet = await prisma.bet.create({
      data: {
        userId: session.user.id,
        gameId,
        betType,
        team,
        line,
        odds,
        stake: parseFloat(stake),
      },
      include: {
        game: true,
      },
    })

    return NextResponse.json({ bet }, { status: 201 })
  } catch (error) {
    console.error('Error creating bet:', error)
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    )
  }
}

