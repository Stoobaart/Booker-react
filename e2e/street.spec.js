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

  await page.locator('#to-underground').click();
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/, { timeout: 15_000 });
  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  await page.waitForTimeout(1500);
  await expect(overlay).toHaveCount(0);
});

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

  await expect(page.locator('#player-sprite')).toHaveClass(/left/);
  await expect.poll(() => cameraX(page)).toBe(3840);
  expect(await page.locator('.residential-street img').evaluate((img) => img.getBoundingClientRect().width)).toBe(5760);

  await page.mouse.click(100, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBeLessThan(3840);
  await expect.poll(async () => {
    const box = await page.locator('#player-container').boundingBox();
    return Math.round(box.x + box.width / 2 + (await cameraX(page)));
  }, { timeout: 15_000 }).toBeLessThan(4100);

  await page.mouse.click(1700, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBeGreaterThan(3700);
  await page.mouse.click(1700, 640);
  await expect.poll(() => cameraX(page), { timeout: 15_000 }).toBe(3840);
  await page.mouse.click(1880, 640);
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '0px');
  await expect(page.locator('#player-sprite')).toHaveClass(/right/);
});

test("the victim's door leads into the flat's hallway, and back out again", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, {
    ...leftStationSave,
    game: { ...leftStationSave.game, currentScene: 'residential-street', playerPosition: { x: '1100px', y: '180px' }, playerDirection: 'left' },
  });
  await page.goto('/residential-street');

  await page.locator('#to-victims-flat').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 15_000 });
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  await expect(page.locator('#player-container')).toHaveCSS('left', '984px');

  await page.mouse.click(900, 965);
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 15_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '577px');
  await expect(page.locator('#player-sprite')).toHaveClass(/down/);
});

test("the hall's second door leads into the living room, and back", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-hallway');

  await page.locator('#to-living-room').click();
  await expect(page).toHaveURL(/\/victims-flat-living-room$/, { timeout: 20_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '184px');
  await expect(page.locator('#player-sprite')).toHaveClass(/right/);

  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '684px');
});

test("the hall's first door leads into the kitchen, and back", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-hallway');

  await page.locator('#to-kitchen').click();
  await expect(page).toHaveURL(/\/victims-flat-kitchen$/, { timeout: 20_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '844px');
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  await expect(page.locator('.rainy-window__rain')).toBeVisible();

  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '604px');
  await expect(page.locator('#player-sprite')).toHaveClass(/right/);
});

test("the door at the end of the hall leads into the bedroom, and back", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-hallway');

  await page.locator('#to-bedroom').click();
  await expect(page).toHaveURL(/\/victims-flat-bedroom$/, { timeout: 30_000 });
  await expect(page.locator('#player-container')).toHaveCSS('left', '844px');
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  await expect(page.locator('.rainy-window__rain')).toBeVisible();

  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await expect(page.locator('#player-container')).toHaveCSS('top', '201px');
  await expect(page.locator('#player-sprite')).toHaveClass(/down/);
});

test("Frank's portrait talks only while his line types out, even when he's skipped ahead", async ({ page }) => {
  await seedSave(page, barrierReleasedSave);
  await page.goto('/great-portland-street-exterior');
  const overlay = page.locator('.talk-overlay');
  const portrait = page.locator('#portrait-sprite');
  await expect(overlay).toContainText('Another', { timeout: 15_000 });
  await expect(portrait).toHaveCSS('animation-name', 'talk');

  await overlay.click();
  await expect(overlay).toHaveText('Another wet night in London.');
  await expect(portrait).toHaveCSS('animation-name', 'none');

  await overlay.click();
  await expect(portrait).toHaveCSS('animation-name', 'talk');
  await expect(overlay).toHaveText("I've been assigned a suspicious death. Male victim, found at his flat.", { timeout: 15_000 });
  await expect(portrait).toHaveCSS('animation-name', 'none');
});


test('the victim lies dead on the living room sofa', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  const body = page.locator('#occluder-victim-body');
  await expect(body).toBeVisible();
  // under Frank while he's in front of the sofa
  await expect(body).toHaveCSS('z-index', '2');
});

test('Frank remarks on each thing laid about the living room', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  for (const id of ['glass', 'pill-bottle', 'bedding']) {
    await expect(page.locator(`#occluder-${id}`)).toBeVisible();
  }
  const remarks = {
    'The glass': 'A tumbler',
    'The pill bottle': 'A prescription bottle',
    'The bedding': 'A duvet and a pillow',
    'The family photograph': 'A school photo',
    'The laptop': 'A laptop',
  };
  for (const [name, line] of Object.entries(remarks)) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: `Inspect ${name}` }).click();
    await expect(page.locator('.talk-overlay')).toContainText(line, { timeout: 20_000 });
    await dismissSpeech(page);
  }
});

test('Frank remarks on the things in the bedroom', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-bedroom');

  await expect(page.locator('#occluder-schoolwork')).toBeVisible();
  const remarks = {
    'The certificate': 'A certificate',
    'The drawings': 'Crayon drawings',
    'The schoolwork': 'Exercise books',
  };
  for (const [name, line] of Object.entries(remarks)) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: `Inspect ${name}` }).click();
    await expect(page.locator('.talk-overlay')).toContainText(line, { timeout: 20_000 });
    await dismissSpeech(page);
  }
});

test('Frank finds the overdue bills and the savings account letter in the post, and the front door still lets him out', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-hallway');

  await page.getByRole('button', { name: 'The post on the hall table', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect The post on the hall table' }).click();
  await expect(page.locator('.talk-overlay')).toContainText('Overdue bills', { timeout: 20_000 });
  await dismissSpeech(page);
  await expect(page).toHaveURL(/\/victims-flat-hallway$/);

  await page.locator('#leave-flat').click();
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 30_000 });
});

test('inspecting the fridge and the cupboards opens them while Frank talks, then shuts them, and he reads the calendar', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-kitchen');

  await expect(page.locator('.opening-door')).toHaveCount(0);
  const remarks = { 'The fridge': ['birthday cake', 'fridge'], 'The cupboards': ['A tin of beans', 'cupboards'], 'The calendar': ['A calendar'] };
  for (const [name, [line, opens]] of Object.entries(remarks)) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: `Inspect ${name}` }).click();
    await expect(page.locator('.talk-overlay')).toContainText(line, { timeout: 20_000 });
    if (opens) {
      await expect(page.locator(`[data-opening="${opens}"][data-state="open"]`)).toHaveCount(2);
      if (opens === 'fridge') await page.screenshot({ path: 'test-results/kitchen-fridge-open.png' });
    }
    await dismissSpeech(page);
    // shut again once he's said his piece
    await expect(page.locator('.opening-door')).toHaveCount(0);
  }
});

test('the SOCO stands, photographs the body, moves spot every 20 seconds, and stands still to talk', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  const soco = page.locator('.npc', { has: page.getByAltText('Scene of crime officer') });
  const sprite = page.getByAltText('Scene of crime officer');
  await expect(sprite).toHaveAttribute('data-animation', 'still');
  await expect(sprite).toHaveAttribute('data-animation', 'photograph', { timeout: 5_000 });
  await expect(page.locator('.camera-flash')).toBeAttached();
  await expect(sprite).toHaveAttribute('data-animation', 'still', { timeout: 6_000 });
  const firstSpot = await soco.evaluate((el) => el.style.left);

  await expect(sprite).toHaveAttribute('data-animation', 'walk', { timeout: 20_000 });
  await expect(sprite).toHaveAttribute('data-animation', 'still', { timeout: 10_000 });
  const secondSpot = await soco.evaluate((el) => el.style.left);
  expect(secondSpot).not.toBe(firstSpot);

  await soco.click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();
  await expect(page.locator('.npc-dialogue')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(21_000);
  await expect(sprite).toHaveAttribute('data-animation', 'still');
  expect(await soco.evaluate((el) => el.style.left)).toBe(secondSpot);
  await expect(page.locator('.camera-flash')).toHaveCount(0);
});
