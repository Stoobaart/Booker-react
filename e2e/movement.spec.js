import { test, expect, seedSave, arrivedAtStationSave } from './fixtures';

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
