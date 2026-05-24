const { test, expect } = require('@playwright/test');
const { mockCatApi } = require('./helpers');

test.describe('Two-Player Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
  });

  test('2P game shows both player names with scores, P1 highlighted', async ({ page }) => {
    await page.locator('#mode2pBtn').click();
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#startGameBtn').click();

    // Wait for toolbar to be visible
    await expect(page.locator('.toolbar')).toBeVisible();

    // Check player stats are present
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    const p2Stat = page.locator('.player-stat[data-player="2"]');
    await expect(p1Stat).toContainText('Alice');
    await expect(p2Stat).toContainText('Bob');
    await expect(p1Stat).toContainText('0');
    await expect(p2Stat).toContainText('0');

    // P1 should be active, P2 inactive
    await expect(p1Stat).toHaveClass(/active/);
    await expect(p2Stat).toHaveClass(/inactive/);
  });

  test('1P toolbar shows moves and pairs', async ({ page }) => {
    await page.locator('#mode1pBtn').click();
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.toolbar')).toContainText('Moves');
    await expect(page.locator('.toolbar')).toContainText('Pairs');
  });

  test('New Game button is present in 2P mode', async ({ page }) => {
    await page.locator('#mode2pBtn').click();
    await page.locator('#startGameBtn').click();
    await expect(page.locator('#newGameBtn')).toBeVisible();
  });
});
