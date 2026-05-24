# Design Document: Local Hot-Seat Multiplayer

**Status:** Draft  
**Date:** 2026-05-24  
**Based on:** [Functional Specification](./multiplayer-functional-spec.md)

---

## 1. Architecture Overview

The multiplayer feature is implemented entirely within the existing single-file architecture (`index.html`). No new files, build tools, or backend services are introduced. The design adds a state machine layer on top of the current game logic, with mode-specific rendering paths.

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   index.html                         │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────────────────┐   │
│  │ Mode Select  │──▶│ Game Engine               │   │
│  │   Screen     │   │  ├── State Manager        │   │
│  └──────────────┘   │  ├── Card Logic           │   │
│                      │  ├── Turn Controller (2P) │   │
│                      │  └── Score Tracker        │   │
│                      └──────────────────────────┘   │
│                              │                       │
│                      ┌───────▼───────┐              │
│                      │ Renderer      │              │
│                      │  ├── Board    │              │
│                      │  ├── Toolbar  │              │
│                      │  └── Overlay  │              │
│                      └───────────────┘              │
└─────────────────────────────────────────────────────┘
```

---

## 2. State Design

### 2.1 New State Variables

```javascript
// Game mode — determines which rendering and logic path is active
let gameMode = null;          // '1p' | '2p' | null (mode selection)

// Active player index (2P only)
let activePlayer = 1;         // 1 or 2

// Player data (2P only)
let players = [
  { name: 'Player 1', pairs: 0, color: '#ff6f61' },
  { name: 'Player 2', pairs: 0, color: '#42a5f5' }
];
```

### 2.2 Existing State (Unchanged for 1P)

All current state variables (`firstCard`, `secondCard`, `lockBoard`, `moves`, `matchedPairs`, `gameToken`, `loadingCats`) remain and continue to drive single-player mode. In 2P mode, `moves` is unused and `matchedPairs` is derived from the sum of `players[*].pairs`.

### 2.3 State Transitions

```
[Page Load] ──▶ MODE_SELECT
                   │
          ┌────────┴────────┐
          ▼                  ▼
     1P_LOADING          2P_NAME_INPUT
          │                  │
          ▼                  ▼
     1P_PLAYING          2P_LOADING
          │                  │
          ▼                  ▼
     1P_WIN              2P_PLAYING
          │                  │
          ▼                  ▼
     MODE_SELECT         2P_END (win/draw)
     (Play Again)            │
                             ▼
                        MODE_SELECT
                        (Play Again)
```

---

## 3. DOM Structure Changes

### 3.1 Mode Selection Screen (New)

Inserted between the `<h1>` subtitle and the toolbar. Hidden once a mode is selected.

```html
<div id="modeSelect">
  <p>Choose your game mode</p>
  <button id="mode1pBtn">1 Player</button>
  <button id="mode2pBtn">2 Players</button>
  <div id="nameInputs" hidden>
    <input id="p1Name" type="text" placeholder="Player 1" />
    <input id="p2Name" type="text" placeholder="Player 2" />
    <button id="startGameBtn">Start Game</button>
  </div>
</div>
```

### 3.2 Toolbar (Conditional Rendering)

- **1P mode:** Unchanged (`Moves: X`, `Pairs: X/10`, `New Game`).
- **2P mode:** Two player stat blocks with active/inactive styling, plus `New Game`.

```html
<!-- 2P toolbar variant -->
<div class="toolbar toolbar-2p">
  <div class="stat player-stat" data-player="1">
    <span class="player-name">Player1</span>: <span class="player-pairs">0</span> pairs
  </div>
  <div class="stat player-stat" data-player="2">
    <span class="player-name">Player2</span>: <span class="player-pairs">0</span> pairs
  </div>
  <button id="newGameBtn" type="button">New Game</button>
</div>
```

### 3.3 Card Markup (Minor Addition)

Matched cards in 2P mode receive `data-player="1"` or `data-player="2"` to drive CSS styling for the per-player border color.

### 3.4 Win Overlay (Extended)

The existing overlay structure is reused. In 2P mode, the inner content is dynamically set:
- `win-emoji`: `🎉` (win) or `🤝` (draw)
- `winTitle`: `"[Name] Wins!"` or `"It's a Draw!"`
- Subtitle: score summary
- Title color: winner's player color (or neutral for draw)

---

## 4. CSS Additions

| Selector | Purpose |
|---|---|
| `#modeSelect` | Mode selection screen layout (centered, flex-column) |
| `#nameInputs input` | Player name fields with colored left-border accent |
| `.toolbar-2p` | Two-player toolbar layout |
| `.player-stat[data-player="1"]` | Coral styling for P1 stat block |
| `.player-stat[data-player="2"]` | Ocean Blue styling for P2 stat block |
| `.player-stat.active` | Full opacity, bold, colored underline |
| `.player-stat.inactive` | `opacity: 0.5` |
| `.card.matched[data-player="1"] .card-face` | Coral box-shadow (`#ff6f61`) |
| `.card.matched[data-player="2"] .card-face` | Blue box-shadow (`#42a5f5`) |

Transition on `.player-stat` opacity/background for smooth turn-switch animation.

---

## 5. Logic Changes

### 5.1 Turn Controller (New — 2P Only)

```
onCardClick(card):
  if 2P mode:
    if match:
      mark cards with activePlayer
      players[activePlayer-1].pairs++
      update toolbar scores
      if all pairs matched → show end screen
      else → same player continues (no turn switch)
    if miss:
      flip cards back
      switchTurn()

switchTurn():
  activePlayer = (activePlayer === 1) ? 2 : 1
  update toolbar active/inactive classes
```

### 5.2 `onCardClick` Modification

The existing function is refactored to branch on `gameMode`:
- **1P path:** Existing logic (increment `moves`, increment `matchedPairs`, check win).
- **2P path:** No move counter; increment active player's `pairs`; on miss, call `switchTurn()`.

### 5.3 Game Initialization Paths

| Trigger | Action |
|---|---|
| `mode1pBtn` click | Set `gameMode = '1p'`, hide mode screen, show 1P toolbar, call `startNewGame()` |
| `startGameBtn` click | Read names, set `gameMode = '2p'`, hide mode screen, show 2P toolbar, call `startNewGame()` |
| `newGameBtn` (1P) | `resetState()` + `loadCats()` + `renderBoard()` (existing) |
| `newGameBtn` (2P) | `resetMultiplayerState()` + `loadCats()` + `renderBoard()` (keeps same players) |
| `playAgainBtn` (1P) | Start new 1P game directly |
| `playAgainBtn` (2P) | Return to mode selection screen |

### 5.4 Reset Functions

- `resetState()` — Existing; resets 1P state.
- `resetMultiplayerState()` — Resets `activePlayer = 1`, both player `pairs = 0`, toolbar highlight.

---

## 6. Cat Loading (Shared)

Both modes use the identical `loadCats()` → `fetchOneCat()` pipeline. No changes to the loading mechanism. The 10 loaded URLs are passed to `renderBoard()` regardless of mode.

---

## 7. Accessibility Considerations

- Mode selection buttons have clear labels.
- `aria-label` on player name inputs.
- Active player announced via `aria-live="polite"` region (toolbar score area).
- Win/draw overlay maintains existing `role="dialog"` and `aria-modal="true"`.
- Keyboard navigation: Enter in name inputs triggers Start Game.

---

## 8. Testing Strategy

Automated end-to-end tests using **Playwright** (`@playwright/test`). Playwright interacts with the game in a real browser, simulating user clicks and verifying DOM state — ideal for this interaction-heavy, single-file project.

### 8.1 Setup

- `npm init -y` + `npm install -D @playwright/test`
- `npx playwright install` (downloads browser binaries)
- Test files live in `tests/` directory
- `npx playwright test` runs the full suite

### 8.2 Network Mocking

All tests intercept `cataas.com` requests via Playwright's `page.route()` and respond with local placeholder images. This makes tests:
- **Fast** — no network latency
- **Deterministic** — same images every run
- **Offline-capable** — CI doesn't depend on an external API

### 8.3 Test Suites

| Suite | File | Covers |
|---|---|---|
| Mode Selection | `tests/mode-select.spec.js` | Page load shows mode screen; 1P button starts game; 2P button reveals inputs |
| Player Setup | `tests/player-setup.spec.js` | Name input, defaults for blank names, Enter key shortcut |
| 1P Regression | `tests/single-player.spec.js` | Full 1P flow unchanged — moves, pairs, win overlay |
| 2P Turns | `tests/multiplayer-turns.spec.js` | Turn alternation on miss, active player keeps turn on match, toolbar updates |
| 2P Scoring | `tests/multiplayer-scoring.spec.js` | Per-player pair count, matched card colors (data-player attribute) |
| 2P End Game | `tests/multiplayer-endgame.spec.js` | Win overlay (confetti, winner color), draw overlay (no confetti, neutral) |
| Navigation | `tests/navigation.spec.js` | New Game behavior per mode, Play Again routing, mode transitions |

### 8.4 Key Test Cases

| Test Case | Assertion |
|---|---|
| 1P unchanged | Select 1 Player → play to win → verify "You Win!" overlay with move count |
| 2P basic flow | Select 2P → enter names → play → verify turns alternate on miss, stats update |
| 2P match streak | Active player matches 3 in a row → same player stays active, scores 3 |
| 2P turn switch | Miss → other player's stat block gets `.active` class, toolbar opacity changes |
| 2P draw | Each player matches exactly 5 → overlay shows "It's a Draw!", no confetti elements in DOM |
| 2P win | One player gets majority → overlay shows "[Name] Wins!", confetti elements present |
| New Game (2P) | Click New Game during 2P → board resets, same players, P1 active |
| Play Again (2P) | Click Play Again on end overlay → mode selection screen visible |
| Empty names | Leave both blank, start game → toolbar shows "Player 1" / "Player 2" |
| Same names | Both enter "Cat" → works, cards distinguished by `data-player` color |

### 8.5 CI Integration

Tests run in GitHub Actions on every push/PR:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Performance & Compatibility

- No additional network requests beyond cat image loading.
- **Dev dependency only:** Playwright is a devDependency — zero impact on the shipped `index.html`.
- CSS transitions for turn indicator are lightweight (opacity + background).
- Works in all modern browsers (same baseline as current game).
- Single-file approach means no bundle size or loading concerns.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Refactoring `onCardClick` introduces 1P regressions | Branch early on `gameMode`; 1P path remains unchanged |
| DOM structure changes break existing CSS | Toolbar changes are additive (new class, not replacing) |
| Turn indicator transition feels janky | Use CSS transitions (`opacity 0.3s ease`) |
| Players confused about whose turn it is | Strong visual differentiation (color + opacity + bold) |
