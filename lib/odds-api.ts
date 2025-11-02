const ODDS_API_KEY = process.env.ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

export interface OddsGame {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

export interface Score {
  id: string
  scores: Array<{
    name: string
    score: string
  }>
  completed: boolean
}

export async function fetchOdds(sport: string = 'basketball_ncaab'): Promise<OddsGame[]> {
  if (!ODDS_API_KEY) {
    console.error('❌ ODDS_API_KEY not set in environment variables')
    console.log('💡 Add your API key to .env file: ODDS_API_KEY="your-key-here"')
    return []
  }

  const url = `${BASE_URL}/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
  
  const sportEmoji = sport === 'americanfootball_nfl' ? '🏈' : '🏀'
  console.log(`${sportEmoji} Fetching ${sport} odds from The Odds API...`)
  
  try {
    const response = await fetch(url)
    
    console.log(`📡 API Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error ${response.status}:`, errorText)
      throw new Error(`Odds API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Successfully fetched ${data.length} games`)
    
    if (data.length === 0) {
      console.warn('⚠️ API returned 0 games. This could mean:')
      console.warn('  - No games scheduled today')
      console.warn('  - Off-season (NCAA basketball: Nov-Apr)')
      console.warn('  - API key issue')
    }
    
    return data
  } catch (error) {
    console.error('❌ Error fetching odds:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return []
  }
}

export async function fetchScores(sport: string = 'basketball_ncaab'): Promise<Score[]> {
  if (!ODDS_API_KEY) {
    console.warn('ODDS_API_KEY not set')
    return []
  }

  const url = `${BASE_URL}/sports/${sport}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=1`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Scores API error: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching scores:', error)
    return []
  }
}

