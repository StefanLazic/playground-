# Implementation Plan: Local Hot-Seat Multiplayer

**Date:** 2026-05-24  
**Based on:** [Functional Spec](./multiplayer-functional-spec.md) | [Design Doc](./multiplayer-design-doc.md)

---

## Overview

This plan breaks the multiplayer feature into 6 sequential phases. Each phase is independently testable and produces a working (though incomplete) game state. All work is within `index.html`.

---

## Phase 1: Mode Selection Screen

**Goal:** Add a pre-game screen that gates entry into the game.

### Tasks
1. Add `#modeSelect` HTML block with "1 Player" and "2 Players" buttons.
2. Add CSS for the mode selection layout (centered, card-like container).
3. Hide toolbar and board container on page load.
4. Wire `mode1pBtn` click → hide mode screen, show toolbar/board, call `startNewGame()`.
5. Wire `mode2pBtn` click → reveal name inputs + Start Game button.
6. Add `gameMode` variable; set to `'1p'` or `'2p'` on selection.

### Acceptance Criteria
- Page loads showing mode selection, not the game.
- Clicking "1 Player" starts the existing game exactly as before.
- Clicking "2 Players" shows name inputs (game doesn't start yet).

---

## Phase 2: Player Name Input & Identity

**Goal:** Capture player names and establish color-coded identities.

### Tasks
1. Add two styled text inputs with coral/blue left-border accents.
2. Add "Start Game" button inside `#nameInputs`.
3. Read input values on Start Game click; default to "Player 1"/"Player 2" if blank.
4. Initialize `players` array with names and colors.
5. Support Enter key in inputs to trigger Start Game.
6. Add CSS for input styling, including color accents and focus states.

### Acceptance Criteria
- Entering names and clicking Start Game stores player data.
- Empty names default correctly.
- Enter key works as submit shortcut.

---

## Phase 3: Two-Player Toolbar

**Goal:** Display a multiplayer-specific toolbar during 2P gameplay.

### Tasks
1. Create a conditional toolbar renderer: show 1P stats (Moves/Pairs) or 2P stats (Player scores).
2. Add `.toolbar-2p` layout with two `.player-stat` blocks.
3. Implement active/inactive styling (opacity, bold, colored background/underline).
4. Set Player 1 as active initially.
5. Add `updateToolbar()` function that refreshes scores and active state.

### Acceptance Criteria
- 2P game shows both player names with scores, P1 highlighted.
- 1P toolbar is unchanged.
- New Game button is present in both modes.

---

## Phase 4: Turn Logic & Scoring

**Goal:** Implement the alternating-on-miss turn mechanic and per-player scoring.

### Tasks
1. Refactor `onCardClick` to branch on `gameMode`.
2. **2P match path:** Increment active player's `pairs`, add `data-player` attribute to matched cards, keep same player active.
3. **2P miss path:** Flip back cards, call `switchTurn()` to toggle `activePlayer` and update toolbar.
4. Add `switchTurn()` function with toolbar class toggling.
5. Add CSS for per-player matched card borders (`.card.matched[data-player="1"]`, `[data-player="2"]`).
6. Derive total matched pairs from `players[0].pairs + players[1].pairs` for win check.

### Acceptance Criteria
- Matching pair → active player scores, keeps turn, cards show their color.
- Missing → turn switches, toolbar updates smoothly.
- Player 1 always starts.
- All 1P behavior remains unchanged.

---

## Phase 5: End-Game Screen (Win/Draw)

**Goal:** Show appropriate end-game overlay for 2P results.

### Tasks
1. Extend `showWin()` to accept mode context.
2. **2P Win:** Set emoji to 🎉, title to "[Name] Wins!", subtitle to score line, title color to winner's color. Fire confetti.
3. **2P Draw:** Set emoji to 🤝, title to "It's a Draw!", neutral color. No confetti.
4. Update overlay content dynamically based on game result.
5. Wire "Play Again" button: in 2P, return to mode selection; in 1P, restart game directly.

### Acceptance Criteria
- Winner gets confetti and colored title.
- Draw gets handshake emoji, no confetti.
- Play Again returns to mode select in 2P, restarts in 1P.

---

## Phase 6: Navigation & New Game Behavior

**Goal:** Ensure all navigation paths work correctly per the functional spec.

### Tasks
1. "New Game" during 2P: reset board and scores, keep same players, P1 starts.
2. "New Game" during 1P: existing behavior (no mode screen).
3. "Play Again" in 2P end overlay: return to mode selection, reset all state.
4. Ensure cancellation of in-flight cat loads works when switching modes.
5. Reset `gameMode` to `null` when returning to mode selection.
6. Hide/show appropriate DOM sections on each transition.

### Acceptance Criteria
- All navigation paths from the functional spec table work correctly.
- No orphaned state between mode transitions.
- Cat loading cancellation works cleanly.

---

## Phase 7: Playwright E2E Test Suite

**Goal:** Add automated end-to-end tests so every phase can be validated without manual testing.

### Tasks
1. Run `npm init -y` to create `package.json`.
2. Install Playwright: `npm install -D @playwright/test`.
3. Create `playwright.config.js` — configure base URL to serve `index.html` locally (use Playwright's built-in `webServer` option with a simple static server like `npx serve .`).
4. Create test helper (`tests/helpers.js`) with:
   - Route interception to mock `cataas.com` with local placeholder images.
   - Utility to click through card pairs deterministically (read `data-url` attributes).
5. Write test suites per design doc §8.3:
   - `tests/mode-select.spec.js` — mode selection screen behavior.
   - `tests/player-setup.spec.js` — name inputs and defaults.
   - `tests/single-player.spec.js` — full 1P regression (unchanged behavior).
   - `tests/multiplayer-turns.spec.js` — turn alternation logic.
   - `tests/multiplayer-scoring.spec.js` — per-player scoring and card colors.
   - `tests/multiplayer-endgame.spec.js` — win/draw overlays.
   - `tests/navigation.spec.js` — New Game / Play Again routing.
6. Add `.github/workflows/test.yml` for CI (run tests on push/PR).
7. Add `"test": "npx playwright test"` script to `package.json`.

### Acceptance Criteria
- `npm test` runs all E2E tests and passes.
- Tests complete in < 30s (no real network calls).
- CI workflow runs on every push and PR.
- 1P regression suite catches any breakage from multiplayer changes.

---

## Implementation Order & Dependencies

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5 ──▶ Phase 6 ──▶ Phase 7
(screen)    (names)      (toolbar)   (turns)     (endgame)   (navigation) (tests)
```

Each phase depends on the previous one. Phase 4 is the most complex and carries the highest regression risk for single-player mode. Phase 7 (tests) can optionally be started earlier — a 1P regression suite can be written after Phase 1 to catch breakages immediately.

---

## Key Principles

1. **1P isolation:** The single-player code path must remain untouched. Branch on `gameMode` early in shared functions.
2. **Single file:** All HTML, CSS, and JS stay in `index.html`.
3. **Dev dependencies only:** Playwright is a devDependency for testing — the shipped game remains dependency-free.
4. **Progressive enhancement:** Each phase leaves the game in a working state.
5. **Minimal refactoring:** Extend existing functions rather than rewriting them.
6. **Test coverage:** Every phase's acceptance criteria maps to at least one Playwright test case. Tests use network mocking for deterministic, fast execution.
