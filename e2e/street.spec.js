import { test, expect, seedSave, readSave, dismissSpeech, barrierReleasedSave } from './fixtures.js';

test('Frank says why he is here the first time he leaves the station, and only then', async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street-ticket-hall');
  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });

  const overlay = page.locator('.talk-overlay');
  await expect(overlay).toContainText('Another wet night in London.');
  await expect.poll(async () => (await readSave(page)).game.storyProgress.leftStation).toBe(true);
  await dismissSpeech(page);

  // Back inside and out again: nothing more to say
  await page.locator('#to-underground').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  await page.waitForTimeout(1500);
  await expect(overlay).toHaveCount(0);
});

// The station's done with its speech, so the street is free to walk
const leftStationSave = {
  ...barrierReleasedSave,
  game: {
    ...barrierReleasedSave.game,
    storyProgress: { ...barrierReleasedSave.game.storyProgress, leftStation: true },
  },
};

const cameraX = (page) => page.evaluate(() =>
  -new DOMMatrix(getComputedStyle(document.querySelector('.scene-world')).transform).m41);

test('the left of the street leads to a long residential street that scrolls with Frank', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/great-portland-street-exterior');

  await page.locator('#to-residential-street').click();
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 15_000 });

  // He comes in at the right-hand end, facing left, with the camera at that end of the street
  await expect(page.locator('#player-sprite')).toHaveClass(/left/);
  await expect.poll(() => cameraX(page)).toBe(3840);
  expect(await page.locator('.residential-street img').evaluate((img) => img.getBoundingClientRect().width)).toBe(5760);

  // A click is a place in the street, not on the screen: the camera follows him there
  await page.mouse.click(100, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBeLessThan(3840);
  await expect.poll(async () => {
    const box = await page.locator('#player-container').boundingBox();
    return Math.round(box.x + box.width / 2 + (await cameraX(page)));
  }, { timeout: 15_000 }).toBeLessThan(4100);

  // and back to the station, arriving at its left-hand edge
  await page.mouse.click(1700, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBeGreaterThan(3700);
  await page.mouse.click(1700, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBe(3840);
  // the exit takes in the pavement at the end of the street, not just the house front
  await page.mouse.click(1880, 640);
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '0px');
  await expect(page.locator('#player-sprite')).toHaveClass(/right/);
});

test("the victim's door leads into the flat's hallway, and back out again", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  // Standing near the far end of the street, by the victim's door
  await seedSave(page, {
    ...leftStationSave,
    game: { ...leftStationSave.game, currentScene: 'residential-street', playerPosition: { x: '1100px', y: '180px' }, playerDirection: 'left' },
  });
  await page.goto('/residential-street');

  await page.locator('#to-victims-flat').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 15_000 });
  // Just inside the front door, looking down the hall
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  await expect(page.locator('#player-container')).toHaveCSS('left', '984px');

  // The near edge of the carpet is the way back out
  await page.mouse.click(600, 965);
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 15_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '577px');
  await expect(page.locator('#player-sprite')).toHaveClass(/down/);
});
