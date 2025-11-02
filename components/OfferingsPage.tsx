'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import GameCard from './GameCard'
import Leaderboard from './Leaderboard'

interface Game {
  id: string
  gameTime: string
  awayTeam: string
  homeTeam: string
  awayScore: number | null
  homeScore: number | null
  isCompleted: boolean
  odds: Array<{
    awayML: number | null
    homeML: number | null
    awaySpread: number | null
    homeSpread: number | null
    spreadOdds: number | null
    totalLine: number | null
    overOdds: number | null
    underOdds: number | null
  }>
}

export default function OfferingsPage() {
  const { data: session } = useSession()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<'basketball_ncaab' | 'americanfootball_nfl'>('basketball_ncaab')

  const fetchGames = async () => {
    try {
      const response = await fetch(`/api/odds?sport=${selectedSport}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch games')
      }
      
      setGames(data.games || [])
      console.log('📊 Games loaded:', data.games?.length || 0)
    } catch (error) {
      console.error('❌ Error fetching games:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshOdds = async () => {
    setRefreshing(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      console.log(`🔄 Refreshing ${selectedSport} odds from API...`)
      const response = await fetch('/api/odds', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: selectedSport })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to refresh odds')
      }
      
      console.log('✅ Refresh response:', data)
      
      if (data.gamesProcessed === 0) {
        setError('No games available. Check console for details.')
      } else {
        setSuccessMessage(`Successfully loaded ${data.gamesProcessed} games!`)
      }
      
      await fetchGames()
    } catch (error) {
      console.error('❌ Error refreshing odds:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh odds')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSportChange = (sport: 'basketball_ncaab' | 'americanfootball_nfl') => {
    setSelectedSport(sport)
    setGames([])
    setError(null)
    setSuccessMessage(null)
  }

  const handleUpdateScores = async () => {
    setRefreshing(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      console.log(`🔄 Updating ${selectedSport} scores...`)
      const response = await fetch('/api/scores', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: selectedSport })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to update scores')
      }
      
      console.log('✅ Scores response:', data)
      
      if (data.gamesUpdated === 0) {
        setSuccessMessage('No new scores available.')
      } else {
        const betsMsg = data.betsGraded > 0 ? ` Graded ${data.betsGraded} bet(s)!` : ''
        setSuccessMessage(`Updated ${data.gamesUpdated} game scores!${betsMsg}`)
      }
      
      await fetchGames()
    } catch (error) {
      console.error('❌ Error updating scores:', error)
      setError(error instanceof Error ? error.message : 'Failed to update scores')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [selectedSport])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-black">Upcoming Games</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshOdds}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Odds'}
            </button>
            <button
              onClick={handleUpdateScores}
              disabled={refreshing}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
            >
              🔄 Update Scores
            </button>
          </div>
        </div>
        
        {/* Sport Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => handleSportChange('basketball_ncaab')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedSport === 'basketball_ncaab'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-black hover:text-blue-600'
            }`}
          >
            🏀 NCAA Basketball
          </button>
          <button
            onClick={() => handleSportChange('americanfootball_nfl')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedSport === 'americanfootball_nfl'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-black hover:text-blue-600'
            }`}
          >
            🏈 NFL
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Check the browser console (F12) for more details.</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {games.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-black mb-4">
                No games available. Click "Refresh Odds" to fetch upcoming games.
              </p>
              <p className="text-sm text-black">
                💡 Make sure your ODDS_API_KEY is set in the .env file
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isAuthenticated={!!session}
                  onBetPlaced={fetchGames}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

