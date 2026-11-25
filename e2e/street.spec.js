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

// clicks through the neighbour's lines till her options come back or she ends the chat; returns all that was said
const clickThroughChat = async (page) => {
  const speech = page.locator('.npc-dialogue-portraits__speech');
  await expect(speech).toBeVisible({ timeout: 15_000 });
  let said = '';
  for (let i = 0; i < 40 && (await page.locator('.npc-dialogue').count()) === 0 && (await page.locator('.npc-dialogue-overlay').count()) > 0; i++) {
    said += ` ${await speech.textContent({ timeout: 500 }).catch(() => '')}`;
    await page.locator('.npc-dialogue-overlay').click({ timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  return said;
};

const talkToNeighbour = async (page) => {
  await page.locator('.npc', { has: page.getByAltText('Neighbour') }).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();
};

// Asks her all four things, each the given way
const askEverything = async (page, approach) => {
  for (const topic of ['their-friendship', 'recent-behaviour', 'work', 'family']) {
    await page.locator(`[data-option-id="${topic}"]`).click();
    await page.locator(`[data-option-id="${topic}:${approach}"]`).click();
    await clickThroughChat(page);
  }
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

  for (const id of ['glass', 'pill-bottle', 'bedding', 'tablets', 'id-card']) {
    await expect(page.locator(`#occluder-${id}`)).toBeVisible();
  }
  const remarks = {
    'The body': 'Slumped back on the sofa',
    'The glass': 'A glass of water',
    'The tablets': 'Tablets.',
    'The work pass': 'A work pass',
    'The pill bottle': 'A prescription bottle',
    'The bedding': 'A duvet and a pillow',
    'The family photograph': 'Him and a lad',
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
  await expect.poll(async () => (await readSave(page)).investigation.discoveredNoteIds)
    .toEqual(expect.arrayContaining(['flat-hallway-bills', 'flat-hallway-savings-account']));

  await page.locator('#leave-flat').click();
  await expect(page).toHaveURL(/\/residential-street$/, { timeout: 30_000 });
});

test('inspecting the fridge and the cupboards opens them while Frank talks, then shuts them, and he reads the calendar, noting the cake, the cupboards and the calendar', async ({ page }) => {
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
  await expect.poll(async () => (await readSave(page)).investigation.discoveredNoteIds).toEqual(expect.arrayContaining(['flat-kitchen-birthday-cake', 'flat-kitchen-cupboards', 'flat-kitchen-calendar']));
});

test('the neighbour leans at the back of the kitchen smoking, and Frank can talk to her', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-kitchen');

  const sprite = page.getByAltText('Neighbour');
  await expect(sprite).toHaveAttribute('data-animation', 'lean');
  await expect(sprite).toHaveAttribute('data-animation', 'drag', { timeout: 10_000 });
  await page.screenshot({ path: 'test-results/kitchen-neighbour.png' });

  await page.locator('.npc', { has: sprite }).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();
  // her account plays straight off, the first time
  await expect(page.locator('.npc-dialogue-portraits__speech--frank')).toContainText("You're the one", { timeout: 15_000 });
  await expect(page.locator('#player-sprite')).toHaveClass(/left/);
  const said = await clickThroughChat(page);
  expect(said).toContain('rang you lot');
  for (const topic of ['Ask about the two of them', "Ask how he'd been lately", 'Ask about his work', 'Ask about his family']) {
    await expect(page.getByRole('button', { name: topic })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Ask about his family' }).click();
  await expect(page.locator('.npc-dialogue__option')).toHaveText([
    'Was there anyone he was close to? Family?',
    'Did he have any family?',
    "There's a kid's bedroom in there. Whose is it?",
  ]);
});

test('the SOCO can be clicked while he stands still, facing left', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  const soco = page.locator('.npc', { has: page.getByAltText('Scene of crime officer') });
  await expect(soco.getByAltText('Scene of crime officer')).toHaveAttribute('data-animation', 'still');
  await expect(soco).toHaveClass(/npc--facing-left/);
  const frame = await soco.locator('.npc__sprite-frame').boundingBox();
  await page.mouse.click(frame.x + frame.width / 2, frame.y + frame.height * 0.4);
  await expect(soco.locator('.talk-icon')).toBeVisible();
});

test('the SOCO stands, photographs the body, moves spot every 20 seconds, and stands still to talk', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  const soco = page.locator('.npc', { has: page.getByAltText('Scene of crime officer') });
  // not his portrait in the chat
  const sprite = soco.getByAltText('Scene of crime officer');
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
  // his rundown, no questions to choose from
  await expect(page.locator('.npc-dialogue-portraits__speech--frank')).toContainText("What've we got?", { timeout: 15_000 });
  await expect(page.locator('.npc-dialogue')).toHaveCount(0);
  await page.waitForTimeout(21_000);
  await expect(sprite).toHaveAttribute('data-animation', 'still');
  expect(await soco.evaluate((el) => el.style.left)).toBe(secondSpot);
  await expect(page.locator('.camera-flash')).toHaveCount(0);
});

test("won round, the neighbour lets slip the son's name, which unlocks the laptop, and she'll say no more", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, leftStationSave);
  await page.goto('/victims-flat-living-room');

  const openLaptop = async () => {
    await page.getByRole('button', { name: 'The laptop', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect The laptop' }).click();
    await expect(page.locator('.laptop')).toBeVisible({ timeout: 20_000 });
  };
  const closeLaptop = async () => {
    await page.locator('.laptop .game-modal__close').click();
    await expect(page.locator('.laptop')).toHaveCount(0);
  };
  const goTo = async (room) => {
    await page.locator('#to-hallway').click();
    await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
    await page.locator(`#to-${room}`).click();
    await expect(page).toHaveURL(new RegExp(`/victims-flat-${room}$`), { timeout: 20_000 });
  };

  await openLaptop();
  await expect(page.getByLabel('Password')).toBeDisabled();
  await page.screenshot({ path: 'test-results/laptop-locked.png' });
  await closeLaptop();

  // her account, then all four asked nicely, and nothing to show her yet
  await goTo('kitchen');
  await talkToNeighbour(page);
  await clickThroughChat(page);
  await askEverything(page, 'nice');
  const family = await page.locator('[data-option-id="family"]').getAttribute('class');
  expect(family).toContain('heard');
  await expect(page.getByRole('button', { name: 'Show her the pill bottle' })).toHaveCount(0);
  expect((await readSave(page)).dialogue.standing.neighbour).toEqual({ rapport: 4, defensiveness: 0 });
  await page.locator('.npc-dialogue__close').click();

  // picking them up notes them and takes them out of the room
  await goTo('living-room');
  for (const [name, said, prop, itemId] of [
    ['The pill bottle', 'Not his name', 'pill-bottle', 'pill-bottle'],
    ['The work pass', 'work pass', 'id-card', 'work-pass'],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: `Pick up ${name}` }).click();
    await expect(page.locator('.talk-overlay')).toContainText(said, { timeout: 20_000 });
    await dismissSpeech(page);
    await expect(page.locator(`#occluder-${prop}`)).toHaveCount(0);
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    await expect.poll(async () => (await readSave(page)).inventory.items.map((item) => item.id)).toContain(itemId);
  }
  expect((await readSave(page)).investigation.discoveredNoteIds).toEqual(
    expect.arrayContaining(['flat-living-room-prescription', 'flat-living-room-security-pass'])
  );

  // back in the kitchen, her account doesn't play again
  await goTo('kitchen');
  await talkToNeighbour(page);
  await expect(page.locator('.npc-dialogue')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Show her the pill bottle' }).click();
  expect(await clickThroughChat(page)).toContain("that's mine");
  await page.locator('[data-option-id="show-pill-bottle:nice"]').click();
  const said = await clickThroughChat(page);
  expect(said).toContain('Sam?');
  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);
  const save = await readSave(page);
  expect(save.investigation.discoveredNoteIds).toEqual(expect.arrayContaining(['flat-kitchen-neighbours-pills', 'flat-kitchen-son-sam']));
  expect(save.game.storyProgress).toMatchObject({ neighbourShownBottle: true, samNameRevealed: true, neighbourClosedUp: true });

  // she won't talk any more
  await talkToNeighbour(page);
  expect(await clickThroughChat(page)).toContain("I've told you all");
  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);

  await goTo('living-room');
  await openLaptop();
  await page.getByLabel('Password').fill('Sam');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('button', { name: 'Wayfarer' }).click();
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.locator('.laptop__history')).toContainText('Halden Group');
  await page.screenshot({ path: 'test-results/laptop-history.png' });
  await expect.poll(async () => (await readSave(page)).investigation.discoveredNoteIds)
    .toContain('flat-living-room-browser-history');
  await closeLaptop();

  await openLaptop();
  await expect(page.getByLabel('Password')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wayfarer' })).toBeVisible();
});

test("pressed too hard, the neighbour shuts down without naming the son, for good, and the laptop stays locked", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, {
    ...leftStationSave,
    inventory: { items: [{ id: 'pill-bottle', name: 'Pill bottle', quantity: 1 }] },
  });
  await page.goto('/victims-flat-kitchen');

  // one pressing question doesn't shut her down
  await talkToNeighbour(page);
  await clickThroughChat(page);
  await page.locator('[data-option-id="work"]').click();
  await page.locator('[data-option-id="work:pressing"]').click();
  expect(await clickThroughChat(page)).toContain('not his boss');
  // nothing to show her till all four are asked, bottle or no bottle
  await expect(page.getByRole('button', { name: 'Show her the pill bottle' })).toHaveCount(0);
  for (const topic of ['their-friendship', 'recent-behaviour', 'family']) {
    await page.locator(`[data-option-id="${topic}"]`).click();
    await page.locator(`[data-option-id="${topic}:neutral"]`).click();
    await clickThroughChat(page);
  }
  // asked plainly, she says less about how he'd been
  await page.locator('[data-option-id="recent-behaviour"]').click();
  await page.locator('[data-option-id="recent-behaviour:neutral"]').click();
  expect(await clickThroughChat(page)).toContain('He said it was nothing');

  await page.getByRole('button', { name: 'Show her the pill bottle' }).click();
  await clickThroughChat(page);
  await page.locator('[data-option-id="show-pill-bottle:pressing"]').click();
  const said = await clickThroughChat(page);
  expect(said).toContain('his boy');
  expect(said).not.toContain('Sam');
  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);
  const save = await readSave(page);
  expect(save.investigation.discoveredNoteIds).not.toContain('flat-kitchen-son-sam');
  expect(save.game.storyProgress.neighbourClosedUp).toBe(true);
  expect(save.game.storyProgress.samNameRevealed).toBeFalsy();

  // leaving and coming back doesn't give Frank another go
  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await page.locator('#to-kitchen').click();
  await expect(page).toHaveURL(/\/victims-flat-kitchen$/, { timeout: 20_000 });
  await talkToNeighbour(page);
  expect(await clickThroughChat(page)).toContain("I've told you all");
  await expect(page.locator('.npc-dialogue')).toHaveCount(0);

  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await page.locator('#to-living-room').click();
  await expect(page).toHaveURL(/\/victims-flat-living-room$/, { timeout: 20_000 });
  await page.getByRole('button', { name: 'The laptop', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect The laptop' }).click();
  await expect(page.getByLabel('Password')).toBeDisabled({ timeout: 20_000 });
});
