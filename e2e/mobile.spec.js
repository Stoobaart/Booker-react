import { test, expect, seedSave, barrierReleasedSave } from './fixtures';

test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

// Already been outside, so Frank doesn't stop to talk on the way out of the station
const leftStationSave = {
  ...barrierReleasedSave,
  game: { ...barrierReleasedSave.game, storyProgress: { ...barrierReleasedSave.game.storyProgress, leftStation: true } },
};

test('on a phone the whole game fits the screen, so an exit at its edge can be tapped', async ({ page }) => {
  await seedSave(page, leftStationSave);
  await page.goto('/great-portland-street-exterior');

  const root = await page.locator('#root').boundingBox();
  expect(await page.evaluate(() => innerWidth)).toBe(844);
  expect(root.x).toBeGreaterThanOrEqual(0);
  expect(root.x + root.width).toBeLessThanOrEqual(844.5);
  expect(root.y + root.height).toBeLessThanOrEqual(390.5);

  const exit = await page.locator('#to-residential-street').boundingBox();
  await page.touchscreen.tap(exit.x + exit.width / 2, exit.y + exit.height / 2);
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 25_000 });
});
