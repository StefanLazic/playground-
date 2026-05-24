const { test, expect } = require('@playwright/test');
const { mockCatApi, matchAllPairs } = require('./helpers');

test.describe('Single Player Regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
    await page.locator('#mode1pBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('1P full flow - moves, pairs, win overlay', async ({ page }) => {
    // Verify toolbar shows moves and pairs
    await expect(page.locator('#moves')).toHaveText('0');
    await expect(page.locator('#pairs')).toHaveText('0');

    // Match all pairs
    await matchAllPairs(page);

    // Win overlay should show
    await expect(page.locator('#winOverlay')).toHaveClass(/show/, { timeout: 5000 });
    await expect(page.locator('#winTitle')).toContainText('You Win');
    await expect(page.locator('.win-emoji')).toHaveText('🎉');
  });

  test('1P moves counter increments correctly', async ({ page }) => {
    const cards = await page.locator('.card').all();
    // Click first two cards (a move)
    await cards[0].click();
    await cards[1].click();
    await expect(page.locator('#moves')).toHaveText('1');
  });

  test('1P pairs counter increments on match', async ({ page }) => {
    const cards = await page.locator('.card').all();
    // Find a matching pair
    const url0 = await cards[0].getAttribute('data-url');
    for (let i = 1; i < cards.length; i++) {
      const url = await cards[i].getAttribute('data-url');
      if (url === url0) {
        await cards[0].click();
        await cards[i].click();
        await expect(page.locator('#pairs')).toHaveText('1');
        break;
      }
    }
  });
});
