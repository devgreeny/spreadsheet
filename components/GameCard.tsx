'use client'

import { useState } from 'react'
import PlaceBetModal from './PlaceBetModal'

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

interface GameCardProps {
  game: Game
  isAuthenticated: boolean
  onBetPlaced: () => void
}

export default function GameCard({ game, isAuthenticated, onBetPlaced }: GameCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBet, setSelectedBet] = useState<{
    betType: string
    team: string | null
    line: number | null
    odds: number
  } | null>(null)

  const odds = game.odds[0] || {}
  const gameTime = new Date(game.gameTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleBetClick = (betType: string, team: string | null, line: number | null, oddsValue: number) => {
    if (!isAuthenticated) {
      alert('Please sign in to place a bet')
      return
    }
    setSelectedBet({ betType, team, line, odds: oddsValue })
    setModalOpen(true)
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black">
              {game.awayTeam} {game.awayScore !== null && <span className="text-blue-600">({game.awayScore})</span>}
              {' @ '}
              {game.homeTeam} {game.homeScore !== null && <span className="text-blue-600">({game.homeScore})</span>}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-black block">{gameTime}</span>
            {game.isCompleted && (
              <span className="text-xs text-green-600 font-bold">✅ FINAL</span>
            )}
            {!game.isCompleted && game.awayScore !== null && (
              <span className="text-xs text-red-600 font-bold">🔴 LIVE</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Moneyline */}
          <div>
            <h4 className="text-sm font-medium text-black mb-2">Moneyline</h4>
            <div className="space-y-2">
              {odds.awayML && (
                <button
                  onClick={() => handleBetClick('ML', game.awayTeam, null, odds.awayML!)}
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded p-2 text-sm text-black font-semibold"
                >
                  {game.awayTeam}: {formatOdds(odds.awayML)}
                </button>
              )}
              {odds.homeML && (
                <button
                  onClick={() => handleBetClick('ML', game.homeTeam, null, odds.homeML!)}
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded p-2 text-sm text-black font-semibold"
                >
                  {game.homeTeam}: {formatOdds(odds.homeML)}
                </button>
              )}
            </div>
          </div>

          {/* Spread */}
          <div>
            <h4 className="text-sm font-medium text-black mb-2">Spread</h4>
            <div className="space-y-2">
              {odds.awaySpread && odds.spreadOdds && (
                <button
                  onClick={() => handleBetClick('SPREAD', game.awayTeam, odds.awaySpread!, odds.spreadOdds!)}
                  className="w-full bg-green-50 hover:bg-green-100 border border-green-300 rounded p-2 text-sm text-black font-semibold"
                >
                  {game.awayTeam} {odds.awaySpread > 0 ? '+' : ''}{odds.awaySpread} ({formatOdds(odds.spreadOdds)})
                </button>
              )}
              {odds.homeSpread && odds.spreadOdds && (
                <button
                  onClick={() => handleBetClick('SPREAD', game.homeTeam, odds.homeSpread!, odds.spreadOdds!)}
                  className="w-full bg-green-50 hover:bg-green-100 border border-green-300 rounded p-2 text-sm text-black font-semibold"
                >
                  {game.homeTeam} {odds.homeSpread > 0 ? '+' : ''}{odds.homeSpread} ({formatOdds(odds.spreadOdds)})
                </button>
              )}
            </div>
          </div>

          {/* Total */}
          <div>
            <h4 className="text-sm font-medium text-black mb-2">Total</h4>
            <div className="space-y-2">
              {odds.totalLine && odds.overOdds && (
                <button
                  onClick={() => handleBetClick('TOTAL_OVER', null, odds.totalLine!, odds.overOdds!)}
                  className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded p-2 text-sm text-black font-semibold"
                >
                  Over {odds.totalLine} ({formatOdds(odds.overOdds)})
                </button>
              )}
              {odds.totalLine && odds.underOdds && (
                <button
                  onClick={() => handleBetClick('TOTAL_UNDER', null, odds.totalLine!, odds.underOdds!)}
                  className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded p-2 text-sm text-black font-semibold"
                >
                  Under {odds.totalLine} ({formatOdds(odds.underOdds)})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && selectedBet && (
        <PlaceBetModal
          game={game}
          betType={selectedBet.betType}
          team={selectedBet.team}
          line={selectedBet.line}
          odds={selectedBet.odds}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            onBetPlaced()
          }}
        />
      )}
    </>
  )
}

