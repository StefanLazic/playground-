const { test, expect } = require('@playwright/test');
const { mockCatApi } = require('./helpers');

test.describe('Player Setup', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
    await page.locator('#mode2pBtn').click();
    await page.locator('#modePlayBtn').click();
  });

  test('entering names and clicking Start Game stores player data', async ({ page }) => {
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#startGameBtn').click();

    // Game should start - mode select hidden, toolbar visible
    await expect(page.locator('#modeSelect')).toBeHidden();
    await expect(page.locator('.toolbar')).toBeVisible();

    // Player names should appear in the toolbar
    await expect(page.locator('.toolbar')).toContainText('Alice');
    await expect(page.locator('.toolbar')).toContainText('Bob');
  });

  test('empty names default to Player 1 and Player 2', async ({ page }) => {
    await page.locator('#startGameBtn').click();

    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.toolbar')).toContainText('Player 1');
    await expect(page.locator('.toolbar')).toContainText('Player 2');
  });

  test('Enter key in name input triggers Start Game', async ({ page }) => {
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#p2Name').press('Enter');

    await expect(page.locator('#modeSelect')).toBeHidden();
    await expect(page.locator('.toolbar')).toBeVisible();
  });
});
