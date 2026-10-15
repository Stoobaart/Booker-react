import { test, expect, seedSave, continueGame, arrivedAtStationSave, barrierReleasedSave } from './fixtures';

const framePosition = (page) =>
  page.locator('#player-container').evaluate((el) => ({ left: el.offsetLeft, top: el.offsetTop }));

const clickWalkArea = async (page, fx, fy) => {
  const box = await page.locator('#walk-area').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
};

for (const viewport of [
  { width: 1920, height: 980 },
  { width: 1280, height: 900 }, // scaled down and letterboxed
]) {
  test(`Frank walks towards the click at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seedSave(page, arrivedAtStationSave);
    await page.goto('/great-portland-street');

    const start = await framePosition(page);
    await clickWalkArea(page, 0.1, 0.5); // far left of the platform

    await expect.poll(async () => (await framePosition(page)).left, { timeout: 15_000 }).toBeLessThan(start.left - 200);
    await expect(page.locator('#player-sprite')).toHaveClass(/left/);
  });
}

test("Frank's position is saved and restored on Continue", async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  await clickWalkArea(page, 0.2, 0.5);
  // wait for the walk to settle
  let last;
  await expect.poll(async () => {
    const now = await framePosition(page);
    const settled = last && now.left === last.left && now.top === last.top;
    last = now;
    return settled;
  }, { intervals: [500], timeout: 15_000 }).toBe(true);

  await page.getByRole('button', { name: 'Inventory' }).click(); // any Redux change triggers a save
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('booker-save')).game.playerPosition);
  expect(saved.x).toBe(`${last.left}px`);

  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect.poll(async () => (await framePosition(page)).left).toBe(last.left);
});

test('Frank is drawn as one crisp frame, scaled for depth without a transform', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  const container = page.locator('#player-container');
  const depthScale = Number(await container.evaluate((el) => el.style.getPropertyValue('--depth-scale')));
  expect(depthScale).toBeGreaterThan(0.7);
  await expect(container).toHaveCSS('transform', 'none');

  // The frame is the 232x424 container resized about Frank's feet
  const frame = await page.locator('.player-frame').boundingBox();
  const box = await container.boundingBox();
  expect(frame.width).toBeCloseTo(232 * depthScale, 0);
  expect(frame.height).toBeCloseTo(424 * depthScale, 0);
  expect(frame.y + frame.height).toBeCloseTo(box.y + box.height, 0);
  expect(frame.x + frame.width / 2).toBeCloseTo(box.x + box.width / 2, 0);

  // Standing still, he breathes on the row for the way he faces
  const sprite = page.locator('#player-sprite');
  await expect(sprite).toHaveClass('standing left');
  await expect(sprite).toHaveCSS('animation-name', 'frank-breathe');
  await expect(sprite).toHaveCSS('image-rendering', 'pixelated');
});

test('Frank turns to the camera and fidgets after standing still', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.clock.install();
  await page.goto('/great-portland-street');

  const sprite = page.locator('#player-sprite');
  await expect(sprite).toHaveClass('standing left');

  // The longest wait before an idle action is 16s
  await page.clock.fastForward(16_000);
  await expect(sprite).toHaveClass(/down/);

  // Walking off cancels it
  await clickWalkArea(page, 0.1, 0.5);
  await expect(sprite).toHaveClass('walk left');
});

test('New Game starts from scratch even when an old game is still in memory', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await continueGame(page);
  await expect(page).toHaveURL(/\/great-portland-street$/);

  // Go back to the start screen without reloading, so the old game is still in the store, then delete
  // the save. Not before: every store change re-saves while a scene is set, and the scene's own
  // mount-time dispatch can land after the URL changes, which would write the save straight back.
  await page.goBack();
  const enter = page.getByRole('button', { name: 'CONTINUE' });
  await expect(enter).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await enter.click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'New Game' }).click();

  await expect(page).toHaveURL(/\/great-portland-street$/);
  await expect(page.locator('.underground-train')).toHaveCount(1);
});

test("Frank's size matches where his feet are after walking to an exit", async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street');
  await page.locator('#to-street').click();

  // Measure once he has stopped at the exit, just before the scene changes
  const { height, expected } = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const sprite = document.getElementById('player-sprite');
        new MutationObserver(() => {
          if (!sprite.classList.contains('standing')) return;
          const frame = document.querySelector('.player-frame').getBoundingClientRect();
          const walkArea = document.getElementById('walk-area').getBoundingClientRect();
          const depth = Math.max(0, Math.min(frame.bottom - walkArea.top, walkArea.height)) / walkArea.height;
          // 424px is Frank's full height; he is drawn at 70% at the back of the walk area and 140% at the front
          resolve({ height: frame.height, expected: 424 * (0.7 + 0.7 * depth) });
        }).observe(sprite, { attributes: true, attributeFilter: ['class'] });
      }),
  );

  expect(Math.abs(height - expected)).toBeLessThan(2);
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/);
});
