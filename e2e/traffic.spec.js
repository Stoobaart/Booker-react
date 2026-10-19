import { test, expect, seedSave, barrierReleasedSave } from './fixtures.js';

test('traffic keeps to the left in both directions, and every car is heard', async ({ page }) => {
  await page.addInitScript(() => {
    window.__carSounds = new Set();
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('car-passing')) window.__carSounds.add(this);
      return play.call(this);
    };
  });
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street-exterior');

  const far = page.locator('.driving-car--far');
  const near = page.locator('.driving-car--near');
  await expect(far).toHaveClass(/driving-car--right/);
  await expect(near).toHaveClass(/driving-car--left/);

  // the lane heading right runs by the pavement, above the lane heading left
  const bottom = async (car) => {
    const box = await car.boundingBox();
    return box.y + box.height;
  };
  expect(await bottom(far)).toBeLessThan(await bottom(near));

  // the westbound car sets off straight away, the eastbound one after its delay: each plays its own sound
  await expect.poll(() => page.evaluate(() => window.__carSounds.size), { timeout: 10_000 }).toBe(2);
});
