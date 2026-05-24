const { test, expect } = require('@playwright/test');
const { mockCatApi, matchPairByIndex, matchAllPairs } = require('./helpers');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
  });

  test('New Game during 2P resets board and scores, keeps same players, P1 starts', async ({ page }) => {
    await page.locator('#mode2pBtn').click();
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#startGameBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // Match a pair so score changes
    await matchPairByIndex(page, 0);
    await page.waitForTimeout(200);

    // Click New Game
    await page.locator('#newGameBtn').click();
    // Wait for new board to load
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // Scores should be reset
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    await expect(p1Stat.locator('.player-pairs')).toHaveText('0');
    // Same player names
    await expect(p1Stat).toContainText('Alice');
    // P1 should be active
    await expect(p1Stat).toHaveClass(/active/);
  });

  test('New Game during 1P works as before', async ({ page }) => {
    await page.locator('#mode1pBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // Click New Game
    await page.locator('#newGameBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
    // Toolbar should still show moves/pairs
    await expect(page.locator('.toolbar')).toContainText('Moves');
  });

  test('Play Again in 2P end overlay returns to mode selection', async ({ page }) => {
    await page.locator('#mode2pBtn').click();
    await page.locator('#startGameBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // Complete the game - all pairs matched by P1
    await matchAllPairs(page);

    // Win overlay should show
    await expect(page.locator('#winOverlay')).toHaveClass(/show/, { timeout: 5000 });

    // Click Play Again
    await page.locator('#playAgainBtn').click();

    // Should return to mode selection
    await expect(page.locator('#modeSelect')).toBeVisible();
    await expect(page.locator('.toolbar')).toBeHidden();
  });

  test('Play Again in 1P restarts game directly', async ({ page }) => {
    await page.locator('#mode1pBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // Complete the game
    await matchAllPairs(page);

    await expect(page.locator('#winOverlay')).toHaveClass(/show/, { timeout: 5000 });

    // Click Play Again
    await page.locator('#playAgainBtn').click();

    // Should NOT show mode selection, game restarts
    await expect(page.locator('#modeSelect')).toBeHidden();
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });
});
