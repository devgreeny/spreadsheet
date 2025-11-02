'use client'

interface Bet {
  id: string
  betType: string
  team: string | null
  result: string
  profit: number | null
  stake: number
  createdAt: string
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
  recentBets: Bet[]
  teamStats: TeamStats[]
  thisWeekStats: {
    bets: number
    profit: number
    winRate: number
  }
}

interface BettingAnalyticsProps {
  data: AnalyticsData
}

export default function BettingAnalytics({ data }: BettingAnalyticsProps) {
  const { betTypeStats, recentBets, teamStats, thisWeekStats } = data

  const getBetTypeLabel = (betType: string) => {
    switch (betType) {
      case 'ML': return 'Moneyline'
      case 'SPREAD': return 'Spread'
      case 'TOTAL_OVER': return 'Over'
      case 'TOTAL_UNDER': return 'Under'
      default: return betType
    }
  }

  const getResultColor = (result: string) => {
    if (result === 'WON') return 'bg-green-500'
    if (result === 'LOST') return 'bg-red-500'
    if (result === 'PUSH') return 'bg-gray-400'
    return 'bg-yellow-500'
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Bet Type Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-black">Performance by Bet Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {betTypeStats.map((stat) => (
            <div key={stat.betType} className="border rounded-lg p-4">
              <h4 className="font-semibold text-black mb-2">{getBetTypeLabel(stat.betType)}</h4>
              <div className="space-y-1 text-sm">
                <p className="text-black">Bets: {stat.totalBets}</p>
                <p className="text-black">Record: {stat.wonBets}W - {stat.lostBets}L</p>
                <p className={`font-semibold ${stat.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                  Win Rate: {stat.winRate.toFixed(1)}%
                </p>
                <p className={`font-semibold ${stat.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Profit: {stat.totalProfit >= 0 ? '+' : ''}${stat.totalProfit.toFixed(2)}
                </p>
                <p className="text-black">ROI: {stat.roi.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
        {betTypeStats.length === 0 && (
          <p className="text-black text-center py-4">No bets placed yet</p>
        )}
      </div>

      {/* Recent Performance Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-black">Recent Performance</h3>
        {recentBets.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-black">Last 10 Bets:</span>
              <div className="flex gap-1">
                {recentBets.slice(0, 10).map((bet) => (
                  <div
                    key={bet.id}
                    className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${getResultColor(bet.result)}`}
                    title={`${bet.result} - ${bet.profit ? (bet.profit >= 0 ? '+' : '') + '$' + bet.profit.toFixed(2) : 'Pending'}`}
                  >
                    {bet.result === 'WON' ? 'W' : bet.result === 'LOST' ? 'L' : bet.result === 'PUSH' ? 'P' : '-'}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-black">Recent Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const settled = recentBets.filter(b => b.result === 'WON' || b.result === 'LOST')
                    const won = settled.filter(b => b.result === 'WON').length
                    return settled.length > 0 ? ((won / settled.length) * 100).toFixed(1) : '0.0'
                  })()}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-black">Recent Profit</p>
                <p className={`text-2xl font-bold ${(() => {
                  const profit = recentBets.reduce((sum, b) => sum + (b.profit || 0), 0)
                  return profit >= 0 ? 'text-green-600' : 'text-red-600'
                })()}`}>
                  {(() => {
                    const profit = recentBets.reduce((sum, b) => sum + (b.profit || 0), 0)
                    return (profit >= 0 ? '+' : '') + '$' + profit.toFixed(2)
                  })()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-black">Trend</p>
                <p className="text-2xl">
                  {(() => {
                    const last5 = recentBets.slice(0, 5).filter(b => b.result !== 'PENDING')
                    const wins = last5.filter(b => b.result === 'WON').length
                    if (wins >= 4) return '🔥'
                    if (wins >= 3) return '📈'
                    if (wins >= 2) return '📊'
                    if (wins >= 1) return '📉'
                    return '❄️'
                  })()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-black text-center py-4">No bets yet</p>
        )}
      </div>

      {/* Team Performance & This Week Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-black">Top Teams</h3>
          {teamStats.length > 0 ? (
            <div className="space-y-2">
              {teamStats.slice(0, 5).map((team, index) => (
                <div key={team.team} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-black text-sm">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-black">{team.team}</p>
                      <p className="text-xs text-black">{team.wins}W - {team.losses}L ({team.winRate.toFixed(0)}%)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${team.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {team.profit >= 0 ? '+' : ''}${team.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-black">{team.bets} bets</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black text-center py-4">No team data yet</p>
          )}
        </div>

        {/* This Week Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-black">This Week vs All Time</h3>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="text-sm text-black mb-2">This Week</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-black">Bets</p>
                  <p className="text-xl font-bold">{thisWeekStats.bets}</p>
                </div>
                <div>
                  <p className="text-xs text-black">Win Rate</p>
                  <p className="text-xl font-bold text-blue-600">{thisWeekStats.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-black">Profit</p>
                  <p className={`text-xl font-bold ${thisWeekStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {thisWeekStats.profit >= 0 ? '+' : ''}${thisWeekStats.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-black mb-2">Performance Indicator</p>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {thisWeekStats.bets === 0 ? (
                  <p className="text-black">No bets this week</p>
                ) : thisWeekStats.winRate >= 60 ? (
                  <p className="text-green-600 font-semibold">🔥 Hot Streak!</p>
                ) : thisWeekStats.winRate >= 50 ? (
                  <p className="text-blue-600 font-semibold">📈 Profitable</p>
                ) : thisWeekStats.profit >= 0 ? (
                  <p className="text-yellow-600 font-semibold">💪 Grinding</p>
                ) : (
                  <p className="text-red-600 font-semibold">📉 Needs Work</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

