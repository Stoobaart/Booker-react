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

  // Clear the save and go back to the start screen without reloading: the old game is still in the store
  await page.evaluate(() => localStorage.clear());
  await page.goBack();
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'New Game' }).click();

  await expect(page).toHaveURL(/\/great-portland-street$/);
  await expect(page.locator('.underground-train')).toHaveCount(1);
});

test("Frank's size matches where his feet are after walking to an exit", async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street');
  await page.locator('#to-ticket-hall').click();

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
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/);
});

test('the platform, ticket hall and street connect in order', async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street');

  await page.locator('#to-ticket-hall').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  await page.locator('#to-platform').click();
  await expect(page).toHaveURL(/\/great-portland-street$/, { timeout: 15_000 });
  await page.locator('#to-ticket-hall').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  // The passage on the far side of the hall goes down to the same platform
  await page.locator('#to-platform-left').click();
  await expect(page).toHaveURL(/\/great-portland-street$/, { timeout: 15_000 });

  await page.locator('#to-ticket-hall').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  await page.locator('#to-underground').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  // Back in from the street, he starts just inside the gates
  await expect(page.locator('#player-container')).toHaveCSS('top', '204px');
});

test('the middle ticket gate is already open once Derek has let Frank through', async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street-ticket-hall');

  const gate = page.locator('#ticket-gate');
  await expect(gate).toHaveClass(/ticket-gate--open(\s|$)/);
  // Drawn on its last frame straight away, without swinging open again
  await expect(gate).toHaveCSS('background-position-x', '-520px');
});

test('the ticket hall pillars cover Frank only while he is behind them', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');
  const pillar = page.locator('#occluder-right-pillar');

  // Up from the platform he starts at the front of the hall, in front of the pillars
  await expect(pillar).not.toHaveClass(/occluder--over-player/);
  await expect(pillar).toHaveCSS('visibility', 'hidden');

  // Behind the pillar
  await page.mouse.click(1250, 640);
  await expect(pillar).toHaveClass(/occluder--over-player/, { timeout: 15_000 });
  await expect(pillar).toHaveCSS('z-index', '4');

  // And back out in front of it
  await page.mouse.click(1250, 800);
  await expect(pillar).not.toHaveClass(/occluder--over-player/, { timeout: 15_000 });
});

test("Frank can't stand inside a pillar: clicking its base stops him at its edge", async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  // The right pillar's footprint runs to y 762; a click at 700 would put his feet at 724
  await page.mouse.click(1300, 700);
  const feetY = () => page.locator('#player-container').evaluate((el) => el.offsetTop + el.offsetHeight);
  await expect.poll(feetY, { timeout: 15_000 }).toBe(763);
});
