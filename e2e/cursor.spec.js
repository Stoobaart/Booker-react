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
