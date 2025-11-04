# ✅ Feature: Editable Spread/Line Values When Placing Bets

## What Was Added:

Users can now **edit the spread/line value** when placing bets if they got different odds than what the API shows.

## Changes Made:

### 1. New Input Field (Line 162-165)
Added a conditional line/spread input field that only shows for relevant bet types:
- **Spread bets** - Edit the point spread (e.g., -7.5 → -6.5)
- **Over/Under bets** - Edit the total line (e.g., 145.5 → 144.5)
- **Moneyline bets** - Field hidden (not applicable)

### 2. Smart Display Logic (Line 185-195)
The line input automatically:
- ✅ Shows for spread and total bets
- ✅ Hides for moneyline bets
- ✅ Pre-fills with the API value
- ✅ Accepts decimal values (step 0.5)

### 3. Real-Time Updates (Line 238-257)
New `updateBetDescription()` function:
- Updates bet description as you type
- Shows your custom line value
- Recalculates potential payout

### 4. Submit Custom Values (Line 269-270)
Modified `confirmBet()` to send your edited line value to the server

## User Experience:

### Example: Spread Bet
**API Shows:** Duke -7.5 at -110  
**You Got:** Duke -6.5 at -110

**Steps:**
1. Click the spread button
2. Modal opens with fields:
   - Units: 1.0
   - Odds: -110 (editable)
   - Line: -7.5 (editable) ← **NEW**
3. Change line to `-6.5`
4. Bet description updates in real-time: "Duke -6.5 (-110)"
5. Place bet with your custom values ✅

### Example: Total Bet
**API Shows:** Over 145.5 at -110  
**You Got:** Over 144.5 at -105

**Steps:**
1. Click "Over 145.5"
2. Change line to `144.5`
3. Change odds to `-105`
4. Description updates: "Over 144.5 (-105)"
5. Place bet ✅

### Example: Moneyline Bet
**No line field shown** - only odds and units

## Benefits:

1. ✅ **Accurate tracking** - Record the exact bet you made
2. ✅ **Shopping lines** - Compare different books' odds
3. ✅ **Retroactive bets** - Log bets from other books
4. ✅ **Real-time preview** - See exactly what you're betting
5. ✅ **Flexible** - Change odds AND lines

## UI Features:

- **Smart visibility** - Only shows for relevant bet types
- **Helpful placeholder** - "e.g., -3.5 or 145.5"
- **Decimal support** - Step 0.5 for half-point lines
- **Live updates** - Bet description changes as you type
- **Optional** - Falls back to API values if not changed

## Technical Details:

### Field Attributes:
```html
<input type="number" 
       id="lineInput" 
       class="form-input" 
       step="0.5" 
       placeholder="e.g., -3.5 or 145.5">
```

### Display Conditions:
- Visible: `SPREAD`, `TOTAL_OVER`, `TOTAL_UNDER`
- Hidden: `ML`

### Data Flow:
1. User clicks bet → Modal opens with API line
2. User edits line → Description updates
3. User confirms → Custom line sent to server
4. Server saves bet with custom line
5. Dashboard shows your custom line ✅

## Deploy:

```bash
cd /Users/noah/Desktop/Projects/spread

git add templates/index.html FEATURE_EDITABLE_LINES.md
git commit -m "Add ability to edit spread/line values when placing bets"
git push origin main
```

## Testing Checklist:

After deploy, test:
1. ✅ Place spread bet - line field shows
2. ✅ Edit line value - description updates
3. ✅ Place total bet - line field shows
4. ✅ Edit total value - description updates
5. ✅ Place ML bet - line field hidden
6. ✅ Edit odds - still works
7. ✅ Check dashboard - shows custom line

## Summary:

You can now accurately track bets from any sportsbook by editing both the odds AND the line/spread when placing a bet. This makes your tracking system truly universal! 🎯

