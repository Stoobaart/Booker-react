import { test, expect, seedSave, readSave, dismissSpeech, arrivedAtStationSave } from './fixtures';

const derek = (page) => page.locator('.npc', { has: page.getByAltText('Derek the station worker') });

const openDerek = async (page) => {
  // The sprite sheet is far wider than the frame that clips it
  await derek(page).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();
  const dialogue = page.locator('.npc-dialogue');
  await expect(dialogue).toBeVisible({ timeout: 15_000 });
  return dialogue;
};

const BOARD_NUDGE = "I should pin what I've found on my deductions board.";
const BARRIERS = "Hi, I can't get past the barriers, can you help?";
const OVERRIDE = "I'm working on it, you'll have to wait. And no, I can't manually override it as it's my neck on the line";
const triedBarrierSave = {
  ...arrivedAtStationSave,
  // Frank's nudges are already said, so he doesn't talk over these tests
  game: {
    ...arrivedAtStationSave.game,
    storyProgress: { arrivedAtStation: true, triedBarrier: true, boardNudged: true, talkNudged: true },
  },
};
const askAboutBarriers = (dialogue) => dialogue.getByRole('button', { name: BARRIERS }).click();
const speech = (page, who) => page.locator(`.npc-dialogue-portraits__speech--${who}`);
// Waits for the line to finish typing, so a click can't race it
const typed = async (page, who, text) => {
  await expect(speech(page, who).locator('.npc-dialogue-portraits__untyped')).toHaveText('', { timeout: 15_000 });
  await expect(speech(page, who)).toHaveText(text);
};
const skipLine = async (page, who, text) => {
  await typed(page, who, text);
  await page.locator('.npc-dialogue-overlay').click();
};

test('a talk option plays out beside the portraits, then is greyed out but can be replayed', async ({ page }) => {
  await seedSave(page, triedBarrierSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await expect(page.locator('#player-sprite')).toHaveClass('standing right');
  await expect(dialogue.getByRole('textbox')).toHaveCount(0);
  await askAboutBarriers(dialogue);
  await expect(dialogue).toHaveCount(0);

  const frankPortrait = await page.locator('.npc-dialogue-portraits__frank').boundingBox();
  const derekPortrait = await page.locator('.npc-dialogue-portraits__npc').boundingBox();
  const frankSpeech = await speech(page, 'frank').boundingBox();
  expect(frankSpeech.x).toBeCloseTo(frankPortrait.x + frankPortrait.width, 0);
  await skipLine(page, 'frank', BARRIERS);

  await expect(speech(page, 'frank')).toHaveCount(0);
  await expect(speech(page, 'npc')).toHaveCSS('color', 'rgb(255, 153, 51)');
  const derekSpeech = await speech(page, 'npc').boundingBox();
  expect(derekSpeech.x + derekSpeech.width).toBeCloseTo(derekPortrait.x, 0);
  await skipLine(page, 'npc', 'Barriers are on the blink mate');
  await skipLine(page, 'npc', OVERRIDE);

  const option = dialogue.getByRole('button', { name: BARRIERS });
  await expect(option).toHaveClass(/npc-dialogue__option--heard/);
  await expect(option).toHaveCSS('color', 'rgb(119, 119, 119)');
  await expect.poll(async () => (await readSave(page)).dialogue?.heardTalkOptions).toEqual({ 'station-worker': ['barriers'] });

  await option.click();
  await expect(speech(page, 'frank')).toBeVisible();
  await skipLine(page, 'frank', BARRIERS);
  await expect(speech(page, 'npc')).toBeVisible();
});

test('Derek\'s line types in left to right from a fixed spot beside his portrait', async ({ page }) => {
  await seedSave(page, triedBarrierSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await askAboutBarriers(dialogue);
  await skipLine(page, 'frank', BARRIERS);
  const line = speech(page, 'npc');
  const firstLetter = () => line.evaluate((el) => {
    const range = document.createRange();
    range.setStart(el.firstChild, 0);
    range.setEnd(el.firstChild, 1);
    const { x, y } = range.getBoundingClientRect();
    return { x, y };
  });
  const untyped = line.locator('.npc-dialogue-portraits__untyped');
  await expect(untyped).not.toHaveText('');
  const start = await firstLetter();
  await expect(untyped).toHaveText('', { timeout: 15_000 });
  expect(await firstLetter()).toEqual(start);
});

test('the chat calls him the station worker until Frank has read Derek\'s name tag', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await expect(dialogue.locator('.npc-dialogue__name')).toHaveText('Station worker');
  await dialogue.locator('.npc-dialogue__close').click();

  await derek(page).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.inspect-icon') }).click();
  await dismissSpeech(page);

  const reopened = await openDerek(page);
  await expect(reopened.locator('.npc-dialogue__name')).toHaveText('Derek the station worker');
});

test('Frank can inspect Derek as well as talk to him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  await derek(page).click();
  await expect(page.locator('.npc .inspect-icon')).toBeVisible();
  await expect(page.locator('.npc .talk-icon')).toBeVisible();
  await page.locator('.npc .interaction-btn', { has: page.locator('.inspect-icon') }).click();

  const overlay = page.locator('.talk-overlay');
  await expect(overlay).toContainText('The station worker. His name tag says "Derek".', { timeout: 15_000 });
  await expect(page.locator('#player-sprite')).toHaveClass('standing right');
  await expect(page.locator('.npc-dialogue')).toHaveCount(0);
});

test('the portraits face each other and each talks while their line types out', async ({ page }) => {
  await seedSave(page, triedBarrierSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  const portrait = page.locator('.npc-dialogue-portraits__npc');
  const sprite = portrait.getByAltText('Derek the station worker');
  const frame = await portrait.boundingBox();
  const frank = await page.locator('.npc-dialogue-portraits__frank').boundingBox();
  expect(frame.width).toBeCloseTo(frank.width, 0);
  expect(frame.height).toBeCloseTo(frank.height, 0);
  expect((await sprite.boundingBox()).width).toBeCloseTo(frame.width * 15, 0);
  await expect(sprite).not.toHaveClass(/--talking/);

  const frankSprite = page.locator('.npc-dialogue-portraits__frank img');
  await askAboutBarriers(dialogue);
  await expect(frankSprite).toHaveClass(/--talking/);
  await expect(sprite).not.toHaveClass(/--talking/);
  await skipLine(page, 'frank', BARRIERS);
  await expect(sprite).toHaveClass(/--talking/);
  await expect(frankSprite).not.toHaveClass(/--talking/);
  await expect(speech(page, 'npc')).toHaveText('Barriers are on the blink mate', { timeout: 15_000 });
  await expect(sprite).not.toHaveClass(/--talking/);
});

const optionNames = (dialogue) => dialogue.locator('.npc-dialogue__option').allTextContents();

test('Derek only hears about the barriers once Frank has tried them, and they stay shut', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  expect(await optionNames(dialogue)).toEqual(['Good evening', 'Goodbye']);
  await dialogue.getByRole('button', { name: 'Good evening' }).click();
  await skipLine(page, 'frank', 'Good evening');
  await skipLine(page, 'npc', "Evenin' sir");
  await dialogue.locator('.npc-dialogue__close').click();

  await page.locator('#to-street').click();
  await dismissSpeech(page);
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/);

  const reopened = await openDerek(page);
  expect(await optionNames(reopened)).toEqual(['Good evening', BARRIERS, 'Goodbye']);
  await askAboutBarriers(reopened);
  await skipLine(page, 'frank', BARRIERS);
  await skipLine(page, 'npc', 'Barriers are on the blink mate');
  await typed(page, 'npc', OVERRIDE);
  expect((await readSave(page)).investigation.discoveredNoteIds).not.toContain('derek-fears-blame');
  await page.locator('.npc-dialogue-overlay').click();
  await expect.poll(async () => (await readSave(page)).investigation.discoveredNoteIds).toEqual([
    'ticket-barrier-rejected',
    'derek-fears-blame',
  ]);
  await reopened.locator('.npc-dialogue__close').click();

  await page.locator('#to-street').click();
  await expect(page.locator('.talk-overlay')).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/great-portland-street-ticket-hall$/);
  await expect(page.locator('#ticket-gate')).not.toHaveClass(/ticket-gate--open/);
  const { storyProgress } = (await readSave(page)).game;
  expect(storyProgress.triedBarrier).toBe(true);
  expect(storyProgress.barrierReleased).toBeFalsy();
});

test('saying goodbye ends the conversation once Derek has replied', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await dialogue.getByRole('button', { name: 'Goodbye' }).click();
  await skipLine(page, 'frank', 'Goodbye');
  await typed(page, 'npc', 'Take care');
  await page.locator('.npc-dialogue-overlay').click();
  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);

  const reopened = await openDerek(page);
  await expect(reopened.getByRole('button', { name: 'Goodbye' })).not.toHaveClass(/--heard/);
});

const deducedCliveSave = {
  ...triedBarrierSave,
  investigation: { discoveredNoteIds: ['ticket-barrier-rejected', 'newspaper-sacked-tube-worker', 'derek-station-worker'] },
  deduction: { boards: {}, madeDeductionIds: ['derek-knew-sacked-worker'] },
};
const ASK_CLIVE = 'I read about the guy that was fired for letting people out';
const FOR_CLIVE = "C'mon, what would Clive do?";
const readyToPersuadeSave = {
  ...deducedCliveSave,
  investigation: { discoveredNoteIds: [...deducedCliveSave.investigation.discoveredNoteIds, 'derek-fears-blame'] },
  deduction: { boards: {}, madeDeductionIds: ['derek-knew-sacked-worker', 'derek-fears-ending-up-like-clive'] },
};

test('Derek has nothing to say about Clive until Frank has made the deduction', async ({ page }) => {
  await seedSave(page, triedBarrierSave);
  await page.goto('/great-portland-street-ticket-hall');
  const dialogue = await openDerek(page);
  expect(await optionNames(dialogue)).toEqual(['Good evening', BARRIERS, 'Goodbye']);
});

test('Frank can only appeal to Clive once he has worked out Derek fears ending up like him', async ({ page }) => {
  await seedSave(page, deducedCliveSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  await dialogue.getByRole('button', { name: ASK_CLIVE }).click();
  await skipLine(page, 'frank', ASK_CLIVE);
  await skipLine(page, 'npc', 'Yeah, Clive. Upstanding bloke he was');
  expect(await optionNames(dialogue)).toEqual(['Good evening', BARRIERS, ASK_CLIVE, 'Goodbye']);
});

test('talking Derek round for Clive opens the gate, he asks Frank to keep quiet, and Frank can leave', async ({ page }) => {
  // Note what the gate looks like whenever its sound plays
  await page.addInitScript(() => {
    window.__gateSounds = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('gate-open')) {
        const gate = document.getElementById('ticket-gate');
        window.__gateSounds.push({ className: gate.className, x: getComputedStyle(gate).backgroundPositionX });
      }
      return play.call(this);
    };
  });
  await seedSave(page, readyToPersuadeSave);
  await page.goto('/great-portland-street-ticket-hall');

  const dialogue = await openDerek(page);
  expect(await optionNames(dialogue)).toEqual(['Good evening', BARRIERS, ASK_CLIVE, 'Goodbye']);
  await dialogue.getByRole('button', { name: ASK_CLIVE }).click();
  await skipLine(page, 'frank', ASK_CLIVE);
  await skipLine(page, 'npc', 'Yeah, Clive. Upstanding bloke he was');
  expect(await optionNames(dialogue)).toEqual(['Good evening', BARRIERS, ASK_CLIVE, FOR_CLIVE, 'Goodbye']);

  await dialogue.getByRole('button', { name: FOR_CLIVE }).click();
  await skipLine(page, 'frank', FOR_CLIVE);
  await typed(page, 'npc', "You're right, rules be damned, I'm doing this for Clive");
  const gate = page.locator('#ticket-gate');
  await expect(gate).not.toHaveClass(/ticket-gate--opening/);
  expect(await page.evaluate(() => window.__gateSounds)).toEqual([]);
  await page.locator('.npc-dialogue-overlay').click();

  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);
  await expect(page.locator('.npc-dialogue-portraits')).toHaveCount(0);
  await expect(gate).toHaveClass(/ticket-gate--opening/);
  await expect(gate).toHaveCSS('background-position-x', '-520px');
  expect(await page.evaluate(() => window.__gateSounds)).toEqual([{ className: 'ticket-gate ticket-gate--opening', x: '0px' }]);
  await expect(speech(page, 'npc')).toHaveText("Let's just keep this between us");
  await expect(page.locator('.npc-dialogue')).toHaveCount(0);
  await skipLine(page, 'npc', "Let's just keep this between us");
  await expect(page.locator('.npc-dialogue-overlay')).toHaveCount(0);
  await expect.poll(async () => (await readSave(page)).game.storyProgress.barrierReleased).toBe(true);
  expect((await readSave(page)).investigation.discoveredNoteIds).toContain('derek-opened-barrier');

  const reopened = await openDerek(page);
  expect(await optionNames(reopened)).toEqual(['Good evening', ASK_CLIVE, 'Goodbye']);
  await reopened.locator('.npc-dialogue__close').click();

  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/\/great-portland-street-exterior$/, { timeout: 15_000 });
});

test('Derek stands by the ticket gates showing one animated sprite frame', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');

  const frame = derek(page).locator('.npc__sprite-frame');
  await expect(frame).toBeVisible();
  const box = await frame.boundingBox();
  expect(box.width).toBeCloseTo(270, 0);
  expect(box.height).toBeCloseTo(488, 0);
  expect(box.x + box.width / 2).toBeCloseTo(1095, 0);
  expect(box.y + box.height).toBeCloseTo(672, 0);

  const sprite = page.getByAltText('Derek the station worker');
  await expect(sprite).toHaveCSS('animation-name', 'npc-sheet');
  await expect(sprite).toHaveCSS('animation-timing-function', 'steps(8)');
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

  // Transparent corner of his frame
  await page.mouse.click(box.x + 8, box.y + box.height - 20);
  await expect(page.locator('.npc .interaction-menu')).toHaveCount(0);
  await expect.poll(frankLeft).not.toBe(startLeft);

  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4);
  await expect(page.locator('.npc .interaction-menu')).toBeVisible();
});

test('Frank walks behind Derek when he stands further back than him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street-ticket-hall');
  const npc = derek(page);
  await expect(npc).not.toHaveClass(/npc--over-player/);

  // Behind Derek's footprint (y 615-690)
  await page.mouse.click(1200, 600);
  await expect(npc).toHaveClass(/npc--over-player/, { timeout: 15_000 });
  await expect(npc).toHaveCSS('z-index', '4');

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

  // Straight across would cross Derek's footprint (x 1050-1140, y 615-690)
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

test('with two notes for the board, Frank says once that he should pin them on it', async ({ page }) => {
  await seedSave(page, {
    ...arrivedAtStationSave,
    investigation: { discoveredNoteIds: ['newspaper-sacked-tube-worker'] },
  });
  await page.goto('/great-portland-street-ticket-hall');

  await derek(page).click();
  await page.locator('.npc .interaction-btn', { has: page.locator('.inspect-icon') }).click();
  const overlay = page.locator('.talk-overlay');
  await expect(overlay).toContainText('The station worker. His name tag says "Derek".', { timeout: 15_000 });
  await expect(async () => {
    await overlay.click();
    await expect(overlay).toContainText(BOARD_NUDGE, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await dismissSpeech(page);
  await expect.poll(async () => (await readSave(page)).game.storyProgress.boardNudged).toBe(true);

  await page.reload();
  await derek(page).click();
  await expect(page.locator('.npc .inspect-icon')).toBeVisible();
  await expect(overlay).toHaveCount(0);
});

test('Frank says he should ask Derek about a deduction that gives him something new to say', async ({ page }) => {
  await seedSave(page, {
    ...triedBarrierSave,
    game: { ...triedBarrierSave.game, storyProgress: { arrivedAtStation: true, triedBarrier: true, boardNudged: true } },
    investigation: { discoveredNoteIds: ['newspaper-sacked-tube-worker', 'derek-station-worker'] },
    deduction: { boards: {}, madeDeductionIds: ['derek-knew-sacked-worker'] },
  });
  await page.goto('/great-portland-street-ticket-hall');

  await expect(page.locator('.talk-overlay')).toContainText('I should ask Derek about that.', { timeout: 15_000 });
  await dismissSpeech(page);
  expect((await readSave(page)).game.storyProgress.talkNudged).toBe(true);
});
