import { test as base, expect } from '@playwright/test';

export const SAVE_KEY = 'booker-save';

// Every test gets the Anthropic API mocked; tests can read `npcRequests` or override the reply
export const test = base.extend({
  npcReply: ['Alright, mate.', { option: true }],
  npcRequests: async ({ page, npcReply }, use) => {
    const requests = [];
    await page.route('https://api.anthropic.com/**', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        json: {
          id: 'msg_e2e',
          type: 'message',
          role: 'assistant',
          model: 'claude-haiku-4-5-20251001',
          content: [{ type: 'text', text: npcReply }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 1, output_tokens: 1 },
        },
      });
    });
    await use(requests);
  },
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
  npc: { conversations: {} },
};
