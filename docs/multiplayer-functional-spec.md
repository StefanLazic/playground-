# Functional Specification: Local Hot-Seat Multiplayer

**Status:** Draft  
**Date:** 2026-05-24  
**Game:** Cat Memory Game 🐱

---

## 1. Overview

Add a local hot-seat multiplayer mode to the Cat Memory Game, allowing two players to compete on the same device by taking alternating turns. The existing single-player mode remains unchanged.

---

## 2. Scope

### In Scope
- Mode selection screen (1 Player / 2 Players)
- Player name input with color-coded identities
- Turn-based gameplay with alternating-on-miss rule
- Per-player score tracking and matched-card ownership
- Multiplayer end-game result screen (win/draw)

### Out of Scope
- Online/networked multiplayer
- AI opponent
- More than 2 players
- Configurable board size or pair count
- Persistent scores or leaderboard

---

## 3. User Flow

### 3.1 Mode Selection Screen

When the page loads, a mode selection screen is displayed **before** any cat images are loaded.

| Element | Description |
|---|---|
| Title | "Cat Memory Game 🐱" (existing) |
| Subtitle | "Choose your game mode" |
| Button: 1 Player | Starts a single-player game (existing behavior) |
| Button: 2 Players | Reveals player name inputs, then starts a multiplayer game |

**Behavior:**
- Clicking **1 Player** dismisses the mode screen and starts the game exactly as it works today (loads cats, renders board, tracks moves and pairs for a solo player).
- Clicking **2 Players** reveals two text input fields for player names (see §3.2), plus a **Start Game** button.

### 3.2 Player Name Input (2-Player Mode Only)

| Element | Description |
|---|---|
| Input 1 | Text field, placeholder "Player 1", colored with coral (`#ff6f61`) accent |
| Input 2 | Text field, placeholder "Player 2", colored with ocean blue (`#42a5f5`) accent |
| Start Game button | Begins the multiplayer game |

**Behavior:**
- If a player leaves their name blank, the default placeholder name is used ("Player 1" / "Player 2").
- Name length is not restricted, but the UI should truncate display gracefully (CSS `text-overflow: ellipsis` if needed).
- Pressing Enter in either input field triggers Start Game.

### 3.3 Player Colors

| Player | Color | Hex |
|---|---|---|
| Player 1 | Coral | `#ff6f61` |
| Player 2 | Ocean Blue | `#42a5f5` |

Colors are used for:
- Player name styling in the toolbar
- Active turn indicator
- Matched card border color
- Win screen text

---

## 4. Gameplay Rules (2-Player Mode)

### 4.1 Turn Structure

- **Player 1 always goes first.**
- A turn consists of flipping two cards (selecting a first card, then a second card).
- **On match:** The active player scores 1 pair and **continues their turn** (flips another pair).
- **On miss:** The two cards flip back face-down, and the turn passes to the other player.
- The board is locked during the flip-back animation (existing `lockBoard` behavior).

### 4.2 Scoring

- Each player has an independent **pairs** counter.
- The total pairs across both players always sums to 10 when the game ends.
- There is no per-player move counter in multiplayer (moves are not tracked per player; only pairs matter).

### 4.3 Win Condition

The game ends when all 10 pairs are matched (same trigger as single-player).

| Scenario | Result |
|---|---|
| Player 1 has more pairs than Player 2 | Player 1 wins |
| Player 2 has more pairs than Player 1 | Player 2 wins |
| Both players have 5 pairs | Draw |

---

## 5. UI Components (2-Player Mode)

### 5.1 Toolbar (During Gameplay)

The toolbar replaces the single-player stats with a two-player layout:

```
[ Player1Name: X pairs ]   [ Player2Name: Y pairs ]   [ New Game ]
```

**Active player indicator:**
- The active player's name section is **highlighted** — full opacity, bold text, colored background or underline in their player color.
- The inactive player's name section is **dimmed** — reduced opacity (`opacity: 0.5`).
- On turn switch, the highlight transitions smoothly to the other player.

### 5.2 Matched Card Styling

When a pair is matched in 2-player mode:
- The matched cards receive a colored border/box-shadow in the **matching player's color** instead of the default green.
  - Player 1 matches: `box-shadow: 0 0 0 3px #ff6f61` (coral)
  - Player 2 matches: `box-shadow: 0 0 0 3px #42a5f5` (blue)
- The card receives a `data-player="1"` or `data-player="2"` attribute to drive the styling.

### 5.3 End-Game Overlay (Multiplayer)

Reuses the existing win overlay structure with different content:

**Win scenario:**
- Emoji: 🎉
- Title: "[WinnerName] Wins!"
- Subtitle: "Final score: [P1Name] [P1Pairs] – [P2Pairs] [P2Name]"
- Title text color: winner's player color
- Confetti: **yes** (existing confetti behavior)
- Button: "Play Again" (returns to mode selection screen)

**Draw scenario:**
- Emoji: 🤝
- Title: "It's a Draw!"
- Subtitle: "Final score: [P1Name] 5 – 5 [P2Name]"
- Title text color: neutral (existing gradient or white)
- Confetti: **no**
- Button: "Play Again" (returns to mode selection screen)

---

## 6. Single-Player Mode

**No changes.** All existing single-player behavior is preserved exactly as-is:
- "Moves" and "Pairs: X/10" stats in toolbar
- "You Win!" overlay with total moves on completion
- Confetti on win
- "Play Again" button starts a new single-player game (no mode selection on replay in 1P)

The only new element is the mode selection screen that appears on initial page load and when returning from a completed multiplayer game.

---

## 7. Navigation & Game Lifecycle

| Action | Result |
|---|---|
| Page load | Mode selection screen shown |
| Click "1 Player" | Mode screen dismissed → cats load → single-player game starts |
| Click "2 Players" | Name inputs shown → click "Start Game" → cats load → multiplayer game starts |
| Click "New Game" (during 1P) | Resets and starts a new single-player game (no mode screen) |
| Click "New Game" (during 2P) | Resets and starts a new multiplayer game with same players (no mode screen) |
| Click "Play Again" on win/draw overlay (1P) | Starts a new single-player game |
| Click "Play Again" on win/draw overlay (2P) | Returns to mode selection screen |

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| Player clicks the same card twice | Ignored (existing behavior) |
| Player clicks a matched card | Ignored (existing behavior) |
| Player clicks during flip-back animation | Ignored — board is locked (existing behavior) |
| Player 1 matches all 10 pairs (Player 2 scores 0) | Player 1 wins, score shown as "10–0" |
| Both name inputs are empty | Default to "Player 1" and "Player 2" |
| Both players enter the same name | Allowed — colors distinguish them |
| "New Game" clicked while cats are loading | Cancels current load, restarts (existing behavior) |

---

## 9. Technical Notes

- **No new files** — all changes are within `index.html` (single-file architecture is maintained).
- **No backend required** — all state is client-side JavaScript.
- **Game state additions for 2P:**
  - `gameMode` — `'1p'` or `'2p'`
  - `activePlayer` — `1` or `2`
  - `players` — array of `{ name, pairs, color }`
- **CSS additions:**
  - Mode selection screen styles
  - Player name input styles
  - Active/inactive player toolbar styles
  - Per-player matched card border colors (`.card.matched[data-player="1"]`, `.card.matched[data-player="2"]`)
  - Draw overlay variant
- **Cat loading is shared** — both modes load the same 10 cat images. The board is identical; only scoring and turn logic differ.
