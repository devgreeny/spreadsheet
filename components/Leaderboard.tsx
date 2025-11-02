'use client'

import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  username: string
  totalProfit: number
  totalStaked: number
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  roi: number
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Leaderboard</h2>
        <p className="text-black">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-black">Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <p className="text-black">No bets placed yet.</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <div
              key={entry.username}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-lg text-black">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold text-black">{entry.username}</p>
                  <p className="text-xs text-black">
                    {entry.wonBets}W - {entry.lostBets}L
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${entry.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.totalProfit >= 0 ? '+' : ''}${entry.totalProfit.toFixed(2)}
                </p>
                <p className="text-xs text-black">
                  {entry.winRate.toFixed(0)}% WR
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

