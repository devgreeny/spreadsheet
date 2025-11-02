'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BettingAnalytics from './BettingAnalytics'

interface Bet {
  id: string
  betType: string
  team: string | null
  line: number | null
  odds: number
  stake: number
  result: string
  profit: number | null
  createdAt: string
  game: {
    awayTeam: string
    homeTeam: string
    gameTime: string
    awayScore: number | null
    homeScore: number | null
  }
}

interface Stats {
  totalBets: number
  pendingBets: number
  wonBets: number
  lostBets: number
  totalStaked: number
  totalProfit: number
  winRate: number
  roi: number
}

interface BetTypeStats {
  betType: string
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  totalProfit: number
  totalStaked: number
  roi: number
}

interface TeamStats {
  team: string
  bets: number
  wins: number
  losses: number
  winRate: number
  profit: number
}

interface AnalyticsData {
  betTypeStats: BetTypeStats[]
  recentBets: Array<{
    id: string
    betType: string
    team: string | null
    result: string
    profit: number | null
    stake: number
    createdAt: string
  }>
  teamStats: TeamStats[]
  thisWeekStats: {
    bets: number
    profit: number
    winRate: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bets, setBets] = useState<Bet[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setBets(data.bets || [])
      setStats(data.stats || null)
      setAnalytics(data.analytics || null)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getBetDescription = (bet: Bet) => {
    if (bet.betType === 'ML') {
      return `${bet.team} ML`
    } else if (bet.betType === 'SPREAD') {
      return `${bet.team} ${bet.line! > 0 ? '+' : ''}${bet.line}`
    } else if (bet.betType === 'TOTAL_OVER') {
      return `Over ${bet.line}`
    } else if (bet.betType === 'TOTAL_UNDER') {
      return `Under ${bet.line}`
    }
    return ''
  }

  const getResultBadge = (result: string) => {
    if (result === 'WON') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">WON</span>
    } else if (result === 'LOST') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">LOST</span>
    } else if (result === 'PUSH') {
      return <span className="px-2 py-1 bg-gray-100 text-black text-xs font-semibold rounded">PUSH</span>
    } else {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">PENDING</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Total Bets</p>
            <p className="text-2xl font-bold">{stats.totalBets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Win Rate</p>
            <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
            <p className="text-xs text-black">{stats.wonBets}W - {stats.lostBets}L</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Total Profit</p>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">ROI</p>
            <p className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {analytics && (
        <BettingAnalytics data={analytics} />
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">My Bets</h2>
        </div>
        <div className="overflow-x-auto">
          {bets.length === 0 ? (
            <div className="px-6 py-8 text-center text-black">
              No bets placed yet. Visit the offerings page to place your first bet!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Game</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Bet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Odds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Stake</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bets.map((bet) => (
                  <tr key={bet.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {bet.game.awayTeam} @ {bet.game.homeTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      {getBetDescription(bet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {bet.odds > 0 ? '+' : ''}{bet.odds}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      ${bet.stake.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getResultBadge(bet.result)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {bet.profit !== null ? (
                        <span className={bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

