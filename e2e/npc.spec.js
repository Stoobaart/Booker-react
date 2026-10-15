import { test, expect, seedSave, readSave, arrivedAtStationSave } from './fixtures';

const derek = (page) => page.locator('.npc', { has: page.getByAltText('Derek the station worker') });

const openDerek = async (page) => {
  // Click the NPC itself: his sprite sheet image is far wider than the frame that clips it
  await derek(page).click();
  await page.locator('.npc .interaction-btn').click();
  const dialogue = page.locator('.npc-dialogue');
  await expect(dialogue).toBeVisible({ timeout: 15_000 });
  return dialogue;
};

test.use({ npcReply: 'Mind the gap, son.' });

test('talking to Derek sends the persona and shows his reply', async ({ page, npcRequests }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  // Frank walked in leftwards from the platform stairs, then turned to face Derek on his right
  await expect(page.locator('#player-sprite')).toHaveClass('standing right');
  await dialogue.getByPlaceholder('Say something...').fill('Where is the exit?');
  await dialogue.getByPlaceholder('Say something...').press('Enter');

  await expect(dialogue.locator('.npc-dialogue__message--assistant')).toContainText('Mind the gap, son.');
  expect(npcRequests).toHaveLength(1);
  expect(npcRequests[0].system[0].text).toContain('Derek');
  expect(npcRequests[0].messages.at(-1)).toEqual({ role: 'user', content: 'Where is the exit?' });
});

test('Derek remembers the conversation after Continue', async ({ page, npcRequests }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await dialogue.getByPlaceholder('Say something...').fill('Hello');
  await dialogue.getByPlaceholder('Say something...').press('Enter');
  await expect(dialogue.locator('.npc-dialogue__message--assistant')).toContainText('Mind the gap, son.');
  await expect.poll(async () => (await readSave(page))?.npc?.conversations?.['station-worker']).toHaveLength(2);

  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  const reopened = await openDerek(page);
  await expect(reopened.locator('.npc-dialogue__message--user')).toContainText('Hello');
  await expect(reopened.locator('.npc-dialogue__message--assistant')).toContainText('Mind the gap, son.');
  expect(npcRequests).toHaveLength(1);
});

test.describe('puzzle facts', () => {
  test.use({ npcReply: "It'd be my neck on the line, son.", npcRevealedFacts: ['derek_fears_blame'] });

  test('a fact Derek reveals is saved, kept after Continue, and never shown in the chat', async ({ page, npcRequests }) => {
    await seedSave(page, arrivedAtStationSave);
    await page.goto('/great-portland-street-ticket-hall');

    const dialogue = await openDerek(page);
    await dialogue.getByPlaceholder('Say something...').fill('Why not just open it?');
    await dialogue.getByPlaceholder('Say something...').press('Enter');

    const reply = dialogue.locator('.npc-dialogue__message--assistant p');
    await expect(reply).toHaveText("It'd be my neck on the line, son.");
    await expect(dialogue).not.toContainText('derek_fears_blame');
    expect(npcRequests[0].output_config.format.schema.properties.revealedFacts.items.enum).toEqual([
      'barrier_is_faulty',
      'derek_fears_blame',
    ]);
    await expect
      .poll(async () => (await readSave(page))?.npc?.discoveredFacts?.['station-worker'])
      .toEqual(['derek_fears_blame']);

    await page.goto('/');
    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await page.locator('.logo_overlay').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/);

    expect((await readSave(page)).npc.discoveredFacts['station-worker']).toEqual(['derek_fears_blame']);
  });
});

test.describe('barrier puzzle', () => {
  test.use({ npcReply: 'Go on then, through you go.', npcResolved: true });

  const tellDerek = async (page, text) => {
    const dialogue = await openDerek(page);
    await dialogue.getByPlaceholder('Say something...').fill(text);
    await dialogue.getByPlaceholder('Say something...').press('Enter');
    await expect(dialogue.locator('.npc-dialogue__message--assistant').last()).toContainText('through you go');
    await dialogue.locator('.npc-dialogue__close').click();
  };

  test('the exit is blocked until Frank names the sacked colleague and Derek agrees', async ({ page, npcRequests }) => {
    await seedSave(page, arrivedAtStationSave);
    await page.goto('/great-portland-street-ticket-hall');

    await page.locator('#to-street').click();
    const overlay = page.locator('.talk-overlay');
    await expect(overlay).toContainText('B', { timeout: 15_000 });
    // Skip each of Frank's two lines to its end, then on to the next
    for (let i = 0; i < 4; i++) await overlay.click();
    await expect(overlay).toHaveCount(0);
    await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/);
    const gate = page.locator('#ticket-gate');
    await expect(gate).not.toHaveClass(/ticket-gate--open/);

    // Derek agreeing counts for nothing while Frank hasn't named his mate
    await tellDerek(page, "I'll sign whatever you like.");
    expect(npcRequests[0].system[0].text).not.toContain('Hargreaves');
    await expect.poll(async () => (await readSave(page)).npc.conversations['station-worker']).toHaveLength(2);
    expect((await readSave(page)).game.storyProgress.barrierReleased).toBeFalsy();

    await tellDerek(page, 'Shame what they did to Clive Hargreaves.');
    expect(npcRequests[1].system[0].text).toContain('Clive Hargreaves');
    await expect.poll(async () => (await readSave(page)).game.storyProgress.barrierReleased).toBe(true);
    expect((await readSave(page)).game.storyProgress.namedDereksFriend).toBe(true);
    // The middle gate swings open in front of him
    await expect(gate).toHaveClass(/ticket-gate--opening/);
    await expect(gate).toHaveCSS('background-position-x', '-520px');

    await page.locator('#to-street').click();
    await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
  });
});

test('Derek stands by the ticket gates showing one animated sprite frame', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const frame = derek(page).locator('.npc__sprite-frame');
  await expect(frame).toBeVisible();
  const box = await frame.boundingBox();
  expect(box.width).toBeCloseTo(270, 0);
  expect(box.height).toBeCloseTo(488, 0);
  // Feet sit at his position
  expect(box.x + box.width / 2).toBeCloseTo(1095, 0);
  expect(box.y + box.height).toBeCloseTo(672, 0);

  const sprite = page.getByAltText('Derek the station worker');
  await expect(sprite).toHaveCSS('animation-name', 'npc-sheet');
  await expect(sprite).toHaveCSS('animation-timing-function', 'steps(8)');
  // The sheet is 16 frames wide and 3 rows tall
  const sheet = await sprite.evaluate((el) => [el.offsetWidth, el.offsetHeight]);
  expect(sheet).toEqual([4320, 1464]);
});

test('only Derek himself is clickable, not the empty space around him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const box = await derek(page).locator('.npc__sprite-frame').boundingBox();
  const frank = page.locator('#player-container');
  const frankLeft = () => frank.evaluate((el) => el.style.left);
  const startLeft = await frankLeft();

  // Bottom-left corner of his frame: empty pixels over the walk area, so Frank walks there
  await page.mouse.click(box.x + 8, box.y + box.height - 20);
  await expect(page.locator('.npc .interaction-menu')).toHaveCount(0);
  await expect.poll(frankLeft).not.toBe(startLeft);

  // His chest opens the menu
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4);
  await expect(page.locator('.npc .interaction-menu')).toBeVisible();
});

test('Frank walks behind Derek when he stands further back than him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');
  const npc = derek(page);
  await expect(npc).not.toHaveClass(/npc--over-player/);

  // Just behind Derek (his feet are at y 672, and he takes up the floor back to 615), off to one side
  await page.mouse.click(1200, 600);
  await expect(npc).toHaveClass(/npc--over-player/, { timeout: 15_000 });
  await expect(npc).toHaveCSS('z-index', '4');

  // Back out in front of him
  await page.mouse.click(1000, 800);
  await expect(npc).not.toHaveClass(/npc--over-player/, { timeout: 15_000 });
});

test('Frank walks round Derek rather than through him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');
  const feet = () => page.locator('#player-container .player-frame').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.bottom];
  });

  await page.mouse.click(950, 680);
  await expect.poll(async () => (await feet())[0], { timeout: 15_000 }).toBeCloseTo(950, -1);

  // Straight across would take him through the floor Derek stands on (x 1050-1140, y 615-690)
  await page.mouse.click(1250, 680);
  const seen = [];
  for (let i = 0; i < 120; i++) {
    seen.push(await feet());
    if (Math.abs(seen.at(-1)[0] - 1250) < 3 && Math.abs(seen.at(-1)[1] - 680) < 3) break;
    await page.waitForTimeout(50);
  }
  expect(seen.at(-1)[0]).toBeCloseTo(1250, -1);
  const through = seen.filter(([x, y]) => x > 1050 && x < 1140 && y > 615 && y < 690);
  expect(through).toEqual([]);
});

test('Derek is no longer on the platform', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');
  await expect(page.getByAltText('Newspaper')).toBeVisible();
  await expect(derek(page)).toHaveCount(0);
});
