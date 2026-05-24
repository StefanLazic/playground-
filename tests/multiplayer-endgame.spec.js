const { test, expect } = require('@playwright/test');
const { mockCatApi, matchPairByIndex, makeMiss } = require('./helpers');

test.describe('Multiplayer End Game', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatApi(page);
    await page.goto('/');
    await page.locator('#mode2pBtn').click();
    await page.locator('#modePlayBtn').click();
    await page.locator('#p1Name').fill('Alice');
    await page.locator('#p2Name').fill('Bob');
    await page.locator('#startGameBtn').click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('2P win shows winner name and confetti', async ({ page }) => {
    // Have P1 match all pairs (P1 stays active since they keep matching)
    for (let i = 0; i < 10; i++) {
      await matchPairByIndex(page, i);
      await page.waitForTimeout(150);
    }

    // Win overlay should appear
    await expect(page.locator('#winOverlay')).toHaveClass(/show/, { timeout: 5000 });
    // Should show winner name
    await expect(page.locator('#winTitle')).toContainText('Alice');
    await expect(page.locator('#winTitle')).toContainText('Wins');
    // Confetti should be present
    await expect(page.locator('.confetti').first()).toBeAttached();
    // Win emoji should be 🎉
    await expect(page.locator('.win-emoji')).toHaveText('🎉');
  });

  test('2P draw shows draw message without confetti', async ({ page }) => {
    // Strategy: P1 matches 5 pairs, then misses so P2 matches remaining 5
    // P1 matches pairs 0-4
    for (let i = 0; i < 5; i++) {
      await matchPairByIndex(page, i);
      await page.waitForTimeout(200);
    }

    // Verify P1 has 5 pairs before miss
    const p1Stat = page.locator('.player-stat[data-player="1"]');
    await expect(p1Stat.locator('.player-pairs')).toHaveText('5');

    // P1 misses to switch to P2 - click two unmatched cards with different URLs
    const unmatchedCards = await page.locator('.card:not(.matched)').all();
    const url0 = await unmatchedCards[0].getAttribute('data-url');
    let secondCard = null;
    for (let i = 1; i < unmatchedCards.length; i++) {
      const url = await unmatchedCards[i].getAttribute('data-url');
      if (url !== url0) {
        secondCard = unmatchedCards[i];
        break;
      }
    }
    await unmatchedCards[0].click();
    await secondCard.click();
    // Wait for flip-back + turn switch
    await page.waitForTimeout(1200);

    // Verify turn switched to P2
    const p2Stat = page.locator('.player-stat[data-player="2"]');
    await expect(p2Stat).toHaveClass(/active/);

    // P2 matches pairs 5-9
    for (let i = 5; i < 10; i++) {
      await matchPairByIndex(page, i);
      await page.waitForTimeout(200);
    }

    // Win overlay should appear
    await expect(page.locator('#winOverlay')).toHaveClass(/show/, { timeout: 5000 });
    // Should show draw message
    await expect(page.locator('#winTitle')).toContainText('Draw');
    // Win emoji should be 🤝
    await expect(page.locator('.win-emoji')).toHaveText('🤝');
  });
});
