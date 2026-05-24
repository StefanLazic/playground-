const { test, expect } = require('@playwright/test');
const { mockCatApi, matchPairByIndex, makeMiss } = require('./helpers');

test.describe('Multiplayer Turns', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
    await page.locator('#mode2pBtn').click();
    await page.locator('#modePlayBtn').click();
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#startGameBtn').click();
    // Wait for board to load
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('matching pair keeps active player turn and scores', async ({ page }) => {
    // Match a pair - P1 should score
    await matchPairByIndex(page, 0);
    await page.waitForTimeout(200);

    // P1 should still be active
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    await expect(p1Stat).toHaveClass(/active/);
    // P1 should have 1 pair
    await expect(p1Stat.locator('.player-pairs')).toHaveText('1');
  });

  test('miss switches turn to other player', async ({ page }) => {
    // Make a miss
    await makeMiss(page);
    // Wait for flip-back animation
    await page.waitForTimeout(1000);

    // P2 should now be active
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    const p2Stat = page.locator('.player-stat[data-player="2"]');
    await expect(p1Stat).toHaveClass(/inactive/);
    await expect(p2Stat).toHaveClass(/active/);
    await expect(p1Stat.locator('.turn-indicator')).toBeHidden();
    await expect(p2Stat.locator('.turn-indicator')).toBeVisible();
  });

  test('matched cards show active player color via data-player attribute', async ({ page }) => {
    await matchPairByIndex(page, 0);
    await page.waitForTimeout(200);

    // Matched cards should have data-player="1"
    const matchedCards = page.locator('.card.matched[data-player="1"]');
    await expect(matchedCards).toHaveCount(2);
  });

  test('Player 1 always starts', async ({ page }) => {
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    await expect(p1Stat).toHaveClass(/active/);
  });
});
