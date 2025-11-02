'use client'

import { useState } from 'react'

interface PlaceBetModalProps {
  game: {
    id: string
    awayTeam: string
    homeTeam: string
  }
  betType: string
  team: string | null
  line: number | null
  odds: number
  onClose: () => void
  onSuccess: () => void
}

export default function PlaceBetModal({
  game,
  betType,
  team,
  line,
  odds,
  onClose,
  onSuccess,
}: PlaceBetModalProps) {
  const [stake, setStake] = useState('')
  const [loading, setLoading] = useState(false)
  const [useCustomOdds, setUseCustomOdds] = useState(false)
  const [customLine, setCustomLine] = useState(line?.toString() || '')
  const [customOdds, setCustomOdds] = useState(odds.toString())

  const calculatePayout = () => {
    const stakeAmount = parseFloat(stake) || 0
    const effectiveOdds = useCustomOdds ? parseFloat(customOdds) : odds
    
    if (effectiveOdds > 0) {
      return stakeAmount + (stakeAmount * effectiveOdds) / 100
    } else {
      return stakeAmount + (stakeAmount * 100) / Math.abs(effectiveOdds)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const finalLine = useCustomOdds && (betType === 'SPREAD' || betType.includes('TOTAL')) 
        ? parseFloat(customLine) 
        : line
      const finalOdds = useCustomOdds ? parseFloat(customOdds) : odds

      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: game.id,
          betType,
          team,
          line: finalLine,
          odds: finalOdds,
          stake: parseFloat(stake),
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        alert('Failed to place bet')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      alert('Error placing bet')
    } finally {
      setLoading(false)
    }
  }

  const getBetDescription = () => {
    const effectiveLine = useCustomOdds ? parseFloat(customLine) : line
    
    if (betType === 'ML') {
      return `${team} to win`
    } else if (betType === 'SPREAD') {
      return `${team} ${effectiveLine! > 0 ? '+' : ''}${effectiveLine}`
    } else if (betType === 'TOTAL_OVER') {
      return `Over ${effectiveLine}`
    } else if (betType === 'TOTAL_UNDER') {
      return `Under ${effectiveLine}`
    }
    return ''
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Place Bet</h2>
        
        <div className="mb-4">
          <p className="text-sm text-black">{game.awayTeam} @ {game.homeTeam}</p>
          <p className="text-lg font-semibold">{getBetDescription()}</p>
          <p className="text-sm text-black">Odds: {useCustomOdds ? (parseFloat(customOdds) > 0 ? '+' : '') + customOdds : (odds > 0 ? '+' : '') + odds}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Custom Odds Toggle */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomOdds}
                onChange={(e) => setUseCustomOdds(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-black">
                Use custom odds
              </span>
            </label>
          </div>

          {/* Custom Odds Inputs */}
          {useCustomOdds && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-3">Custom Bet Details</p>
              
              {(betType === 'SPREAD' || betType === 'TOTAL_OVER' || betType === 'TOTAL_UNDER') && (
                <div className="mb-3">
                  <label htmlFor="customLine" className="block text-sm font-medium text-black mb-1">
                    Line
                  </label>
                  <input
                    type="number"
                    id="customLine"
                    step="0.5"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customLine}
                    onChange={(e) => setCustomLine(e.target.value)}
                    placeholder={line?.toString() || '0'}
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="customOdds" className="block text-sm font-medium text-black mb-1">
                  Odds (American format, e.g., -110, +150)
                </label>
                <input
                  type="number"
                  id="customOdds"
                  step="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={customOdds}
                  onChange={(e) => setCustomOdds(e.target.value)}
                  placeholder={odds.toString()}
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="stake" className="block text-sm font-medium text-black mb-2">
              Stake ($)
            </label>
            <input
              type="number"
              id="stake"
              step="0.01"
              min="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
          </div>

          {stake && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-black">Potential Payout</p>
              <p className="text-xl font-bold text-green-600">
                ${calculatePayout().toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Placing...' : 'Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

