import { test as base, expect } from '@playwright/test';

export const SAVE_KEY = 'booker-save';

export const test = base.extend({
  page: async ({ page }, use) => {
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
  investigation: { discoveredNoteIds: [] },
  // e2e/tutorial.spec.js plays it; everything else skips it
  tutorial: { skipped: true },
};

export const barrierReleasedSave = {
  ...arrivedAtStationSave,
  game: {
    ...arrivedAtStationSave.game,
    storyProgress: { arrivedAtStation: true, barrierReleased: true },
  },
};

export const dismissSpeech = async (page) => {
  const overlay = page.locator('.talk-overlay');
  await expect(overlay).toBeVisible();
  for (let i = 0; i < 20 && (await overlay.count()) > 0; i++) {
    await overlay.click({ timeout: 2_000 }).catch(() => {});
  }
  await expect(overlay).toHaveCount(0);
};
