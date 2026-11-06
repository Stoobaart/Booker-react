import { test, expect, seedSave, arrivedAtStationSave } from './fixtures';

const cursorOf = (locator) => locator.evaluate((el) => getComputedStyle(el).cursor);

test('the scene shows the pixel arrow and clickable things the pixel hand', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  const scene = await cursorOf(page.locator('#root'));
  expect(scene).toMatch(/^image-set\(.*cursor-arrow.*\) 1 1, default$/);

  const newspaper = page.locator('.pickup-item', { has: page.getByAltText('Newspaper') });
  expect(await cursorOf(newspaper)).toMatch(/^image-set\(.*cursor-hand.*\) 9 1, pointer$/);

  const hudButton = page.getByRole('button', { name: 'Inventory' });
  expect(await cursorOf(hudButton)).toMatch(/cursor-hand/);
});

test('a dialogue talk option shows the pixel hand', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  await page.locator('.npc', { has: page.getByAltText('Derek the station worker') }).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();

  const option = page.locator('.npc-dialogue__option').first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  expect(await cursorOf(option)).toMatch(/cursor-hand/);
});

test('an exit shows the hand walking on two fingers', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  const exit = page.locator('.navigation-item').first();
  const frames = new Set();
  for (let i = 0; i < 24; i++) {
    frames.add((await cursorOf(exit)).match(/cursor-walk-(\d)/)?.[1]);
    await page.waitForTimeout(60);
  }
  expect([...frames].sort()).toEqual(['1', '2', '3', '4']);
});
