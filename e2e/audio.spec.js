import { test, expect, seedSave, arrivedAtStationSave } from './fixtures.js';

test('the sound stops while the game is hidden and comes back with it', async ({ page }) => {
  // Keep hold of every sound, and let the test say whether the page is hidden
  await page.addInitScript(() => {
    window.__sounds = new Set();
    window.__hidden = false;
    Object.defineProperty(document, 'hidden', { get: () => window.__hidden });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__sounds.add(this);
      return play.call(this);
    };
  });
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const playing = () => page.evaluate(() =>
    [...window.__sounds].filter((a) => !a.paused).map((a) => a.src.split('/').pop().split('.')[0]).sort());
  const setHidden = (hidden) => page.evaluate((value) => {
    window.__hidden = value;
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

  await page.mouse.click(1700, 900);
  await expect.poll(playing).toEqual(
    expect.arrayContaining([expect.stringMatching(/^underground-ambience/), expect.stringMatching(/^rain-exterior/)]),
  );

  await setHidden(true);
  expect(await playing()).toEqual([]);
  await page.waitForTimeout(1500);
  expect(await playing()).toEqual([]);

  await setHidden(false);
  await expect.poll(playing).toEqual(
    expect.arrayContaining([expect.stringMatching(/^underground-ambience/), expect.stringMatching(/^rain-exterior/)]),
  );
});
