const { test, expect } = require('@playwright/test');
const { mockCatApi } = require('./helpers');

test.describe('Mode Selection Screen', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
  });

  test('page loads showing mode selection screen', async ({ page }) => {
    const modeSelect = page.locator('#modeSelect');
    await expect(modeSelect).toBeVisible();
    await expect(page.locator('#mode1pBtn')).toBeVisible();
    await expect(page.locator('#mode2pBtn')).toBeVisible();
  });

  test('toolbar and board are hidden on page load', async ({ page }) => {
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeHidden();
    const board = page.locator('#boardContainer');
    await expect(board).toBeHidden();
  });

  test('clicking 1 Player starts the game', async ({ page }) => {
    await page.locator('#mode1pBtn').click();
    await expect(page.locator('#modeSelect')).toBeHidden();
    await expect(page.locator('.toolbar')).toBeVisible();
    // Board should eventually show cards (after loading)
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('clicking 2 Players shows name inputs', async ({ page }) => {
    await page.locator('#mode2pBtn').click();
    await expect(page.locator('#nameInputs')).toBeVisible();
    // Game should NOT start yet
    await expect(page.locator('.toolbar')).toBeHidden();
  });
});
