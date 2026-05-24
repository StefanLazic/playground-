/**
 * Mock all cataas.com requests with a tiny 1x1 PNG placeholder.
 * Each request gets a unique "image" based on the URL query string,
 * ensuring pairs can still be matched by URL.
 */
async function mockCatApi(page) {
  // 1x1 red PNG as base64
  const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(PNG_BASE64, 'base64');

  await page.route('**/cataas.com/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: pngBuffer,
    });
  });
}

/**
 * Get all card elements from the board.
 */
async function getCards(page) {
  return page.locator('.card').all();
}

/**
 * Click all matching pairs to complete the game.
 * Cards are matched by their data-url attribute.
 */
async function matchAllPairs(page) {
  const cards = await page.locator('.card').all();
  const urlMap = {};

  // Group cards by their data-url
  for (const card of cards) {
    const url = await card.getAttribute('data-url');
    if (!urlMap[url]) urlMap[url] = [];
    urlMap[url].push(card);
  }

  // Click each pair
  for (const url of Object.keys(urlMap)) {
    const pair = urlMap[url];
    if (pair.length === 2) {
      await pair[0].click();
      await pair[1].click();
      // Small delay to let animations complete
      await page.waitForTimeout(100);
    }
  }
}

/**
 * Click a specific pair of matching cards (by index into the unique URLs).
 * Returns the two card locators that were clicked.
 */
async function matchPairByIndex(page, pairIndex) {
  const cards = await page.locator('.card').all();
  const urlMap = {};

  for (const card of cards) {
    const url = await card.getAttribute('data-url');
    if (!urlMap[url]) urlMap[url] = [];
    urlMap[url].push(card);
  }

  const urls = Object.keys(urlMap);
  const pair = urlMap[urls[pairIndex]];
  await pair[0].click();
  await pair[1].click();
  return pair;
}

/**
 * Click two cards that do NOT match (a miss).
 * Returns the two card locators that were clicked.
 */
async function makeMiss(page) {
  const cards = await page.locator('.card:not(.matched):not(.flipped)').all();
  const url0 = await cards[0].getAttribute('data-url');

  // Find a card with a different URL
  for (let i = 1; i < cards.length; i++) {
    const url = await cards[i].getAttribute('data-url');
    if (url !== url0) {
      await cards[0].click();
      await cards[i].click();
      return [cards[0], cards[i]];
    }
  }
}

module.exports = { mockCatApi, getCards, matchAllPairs, matchPairByIndex, makeMiss };
