import { test as base, expect } from '@playwright/test';

export const SAVE_KEY = 'booker-save';

// Every test gets the Anthropic API mocked; tests can read `npcRequests` or override the reply.
// NPCs with puzzle facts ask for a structured reply, which also carries `npcRevealedFacts`
// and, when the request asks for it, `npcResolved`.
export const test = base.extend({
  npcReply: ['Alright, mate.', { option: true }],
  npcRevealedFacts: [[], { option: true }],
  npcResolved: [false, { option: true }],
  // auto: mocked even in a test that never asks for npcRequests, so no test reaches the real API
  npcRequests: [async ({ page, npcReply, npcRevealedFacts, npcResolved }, use) => {
    const requests = [];
    await page.route('https://api.anthropic.com/**', async (route) => {
      const request = route.request().postDataJSON();
      requests.push(request);
      const schema = request.output_config?.format?.schema;
      const text = schema
        ? JSON.stringify({
            dialogue: npcReply,
            revealedFacts: npcRevealedFacts,
            ...(schema.properties.resolved && { resolved: npcResolved }),
          })
        : npcReply;
      await route.fulfill({
        json: {
          id: 'msg_e2e',
          type: 'message',
          role: 'assistant',
          model: 'claude-haiku-4-5-20251001',
          content: [{ type: 'text', text }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 1, output_tokens: 1 },
        },
      });
    });
    await use(requests);
  }, { auto: true }],
  page: async ({ page }, use) => {
    // Fail loudly on uncaught errors in the game
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    await use(page);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
});

export { expect };

export const startNewGame = async (page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page).toHaveURL(/\/great-portland-street$/);
};

export const continueGame = async (page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'Continue' }).click();
};

// Writes a save then reloads, since the store reads the save on app start
export const seedSave = async (page, save) => {
  await page.goto('/');
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [SAVE_KEY, save]);
  await page.reload();
};

export const readSave = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);

export const arrivedAtStationSave = {
  game: {
    currentScene: 'great-portland-street',
    playerPosition: null,
    playerDirection: null,
    storyProgress: { arrivedAtStation: true },
  },
  inventory: { items: [] },
  npc: { conversations: {}, discoveredFacts: {} },
};

// Derek has let Frank through the ticket barrier, so the ticket hall's exit to the street is open
export const barrierReleasedSave = {
  ...arrivedAtStationSave,
  game: {
    ...arrivedAtStationSave.game,
    storyProgress: { arrivedAtStation: true, barrierReleased: true, namedDereksFriend: true },
  },
  npc: { conversations: {}, discoveredFacts: { 'station-worker': ['barrier_is_faulty', 'derek_fears_blame'] } },
};

// Clicks through Frank's talk overlay until it closes: each click finishes the line typing out,
// or moves on to the next one
export const dismissSpeech = async (page) => {
  const overlay = page.locator('.talk-overlay');
  await expect(overlay).toBeVisible();
  for (let i = 0; i < 20 && (await overlay.count()) > 0; i++) {
    await overlay.click({ timeout: 2_000 }).catch(() => {});
  }
  await expect(overlay).toHaveCount(0);
};
