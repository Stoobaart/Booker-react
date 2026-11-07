import { test, expect, seedSave, readSave, dismissSpeech, arrivedAtStationSave } from './fixtures';

// Off the train, so the tutorial starts straight away
const freshStationSave = { ...arrivedAtStationSave, tutorial: { doneStepId: null, skipped: false } };

const tip = (page) => page.getByRole('dialog', { name: 'Tutorial' });

const tipSays = (page, text) => expect(tip(page)).toContainText(text, { timeout: 15_000 });

// Waits for the tip to finish typing, so Next moves on rather than finishing the line
const next = async (page, text) => {
  await tipSays(page, text);
  await expect(page.locator('.tutorial-tip__untyped')).toHaveText('', { timeout: 15_000 });
  await tip(page).getByRole('button', { name: 'Next ▸' }).click();
  await expect(tip(page).filter({ hasText: text })).toHaveCount(0);
};

// Clicks through a chat's lines until its options, or the scene, are back
const skipLines = async (page) => {
  const speech = page.locator('.npc-dialogue-portraits__speech');
  await expect(speech).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 20 && (await speech.count()) > 0; i++) {
    await page.locator('.npc-dialogue-overlay').click({ timeout: 2_000 }).catch(() => {});
  }
  await expect(speech).toHaveCount(0);
};

const derek = (page) => page.locator('[data-id="station-worker"]');

const talkToDerek = async (page) => {
  await derek(page).click();
  await page.locator('[data-id="station-worker"] .talk-icon').click();
  await expect(page.locator('.npc-dialogue')).toBeVisible({ timeout: 15_000 });
};

const say = async (page, optionId) => {
  await page.locator(`[data-option-id="${optionId}"]`).click();
  await skipLines(page);
};

const centreOf = async (locator) => {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const drag = async (page, from, to) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 5 });
  await page.mouse.up();
};

const boardPoint = (board, fx, fy) =>
  board.evaluate((el, [fx, fy]) => {
    const rect = el.getBoundingClientRect();
    const scale = rect.width / el.offsetWidth;
    return {
      x: rect.left + (el.clientLeft + el.clientWidth * fx) * scale,
      y: rect.top + (el.clientTop + el.clientHeight * fy) * scale,
    };
  }, [fx, fy]);

test('the tutorial walks a new player through the platform and Derek until the gate opens', async ({ page }) => {
  test.setTimeout(180_000);
  await seedSave(page, freshStationSave);
  await page.goto('/great-portland-street');

  // Platform: walking, inspecting, the note toast and the notebook
  await next(page, "London, 1996. You're Frank.");
  await tipSays(page, 'Click anywhere on the floor');
  const floor = await page.locator('#walk-area').boundingBox();
  await page.mouse.click(floor.x + floor.width * 0.3, floor.y + floor.height * 0.6);

  await tipSays(page, 'Click the newspaper');
  // Under the veil, the stairs can't be clicked
  const stairs = await page.locator('#to-ticket-hall').boundingBox();
  await page.mouse.click(stairs.x + stairs.width / 2, stairs.y + stairs.height / 2);
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/great-portland-street$/);
  await page.getByAltText('Newspaper').click();
  await tipSays(page, 'magnifying glass');
  await page.locator('[data-id="newspaper-1"] .inspect-icon').click();

  const paper = page.locator('.game-modal');
  await expect(paper).toBeVisible({ timeout: 15_000 });
  await expect(tip(page)).toHaveCount(0);
  await paper.getByRole('button', { name: '✕' }).click();

  await tipSays(page, 'a note pops up here');
  // Held up for as long as the tip points at it
  await page.waitForTimeout(5_000);
  await page.locator('.note-toast').click();
  await expect(page.getByRole('dialog', { name: 'Notebook' })).toBeVisible();
  await next(page, 'Your notebook keeps everything');
  await next(page, 'Each case gets its own tab');
  await tipSays(page, 'Close it for now');
  await page.locator('.notebook__close').click();
  await next(page, 'Open it again any time');

  await tipSays(page, 'Head up the stairs');
  await page.locator('#to-ticket-hall').click();
  await expect(page).toHaveURL(/ticket-hall$/, { timeout: 15_000 });

  // Ticket hall: the barrier, inspecting and talking to Derek
  await tipSays(page, 'Try the ticket barriers');
  await page.locator('#to-street').click();
  await dismissSpeech(page);
  await tipSays(page, 'Click him');
  await derek(page).click();
  await tipSays(page, 'inspect people too');
  await page.locator('[data-id="station-worker"] .inspect-icon').click();
  await dismissSpeech(page);

  await tipSays(page, 'Click Derek, then the mouth');
  await derek(page).click();
  await tipSays(page, 'click the mouth');
  await page.locator('[data-id="station-worker"] .talk-icon').click();
  await tipSays(page, 'Ask about the barriers');
  await expect(page.locator('.npc-dialogue__name')).toHaveText('Derek the station worker');
  await say(page, 'barriers');
  await next(page, 'noted down too');
  await tipSays(page, 'Say goodbye');
  await say(page, 'goodbye');

  // The board: pinning, a string, and the post-it it makes
  await tipSays(page, 'Open your deductions board');
  await page.getByRole('button', { name: 'Deductions' }).click();
  const dialog = page.getByRole('dialog', { name: 'Deductions' });
  const board = dialog.getByLabel('Great Portland St board');
  const pin = async (name, fx, fy) => {
    await drag(page, await centreOf(dialog.getByRole('listitem', { name, exact: true })), await boardPoint(board, fx, fy));
    const node = board.locator('.board-node--note', { hasText: name });
    await expect(node).toBeVisible();
    return node;
  };
  await next(page, 'Your notes wait here');
  await tipSays(page, 'Drag the sacked Tube worker');
  const newspaperNote = await pin('Sacked Tube worker', 0.25, 0.3);
  await tipSays(page, 'Now pin Derek');
  const derekNote = await pin('Derek, the station worker', 0.75, 0.3);
  await tipSays(page, 'Click the spool');
  await page.getByRole('button', { name: 'Red string' }).click();
  await newspaperNote.click();
  await derekNote.click();
  await expect(board.locator('.board-node--deduction')).toHaveCount(1);
  await next(page, 'Clues that connect make a deduction');
  await tipSays(page, 'Close the board');
  await dialog.getByRole('button', { name: 'X', exact: true }).click();

  // What the deduction opens up, then a deduction built on it
  await tipSays(page, 'Ask Derek about Clive');
  await talkToDerek(page);
  await say(page, 'ask-about-clive');
  await tipSays(page, 'Say goodbye, then think it over');
  await say(page, 'goodbye');
  await tipSays(page, 'Open your board');
  await page.getByRole('button', { name: 'Deductions' }).click();
  await tipSays(page, "Pin the note about Derek's fear");
  const fear = await pin('The station worker is afraid to open the barriers manually', 0.3, 0.75);
  await tipSays(page, 'string his fear to your post-it');
  await page.getByRole('button', { name: 'Red string' }).click();
  await board.locator('[data-node-id="deduction:derek-knew-sacked-worker"]').click();
  await fear.click();
  await expect(board.locator('.board-node--deduction')).toHaveCount(2);

  await tipSays(page, 'Close the board for now');
  await dialog.getByRole('button', { name: 'X', exact: true }).click();
  await tipSays(page, 'Now persuade him');
  await talkToDerek(page);
  await say(page, 'what-would-clive-do');
  // The gate swings open, then Derek has a last word
  await skipLines(page);

  await next(page, 'You know the ropes now');
  await expect(tip(page)).toHaveCount(0);
  await expect(page.locator('.tutorial-overlay')).toHaveCount(0);
  expect((await readSave(page)).tutorial).toEqual({ doneStepId: 'finish', skipped: false });

  await page.locator('#to-street').click();
  await expect(page).toHaveURL(/great-portland-street-exterior$/, { timeout: 15_000 });
});

test('skipping the tutorial asks first, and stays skipped after a reload', async ({ page }) => {
  await seedSave(page, freshStationSave);
  await page.goto('/great-portland-street');
  await tipSays(page, "London, 1996. You're Frank.");

  await tip(page).getByRole('button', { name: 'Skip tutorial' }).click();
  await tip(page).getByRole('button', { name: 'No' }).click();
  await expect(tip(page)).toBeVisible();
  await tip(page).getByRole('button', { name: 'Skip tutorial' }).click();
  await tip(page).getByRole('button', { name: 'Yes' }).click();
  await expect(page.locator('.tutorial-overlay')).toHaveCount(0);
  await expect.poll(async () => (await readSave(page))?.tutorial?.skipped).toBe(true);

  await page.reload();
  await expect(page.getByAltText('Newspaper')).toBeVisible();
  await page.waitForTimeout(1_000);
  await expect(page.locator('.tutorial-overlay')).toHaveCount(0);
});

test('a new game waits for the arrival train before the tutorial starts', async ({ page }) => {
  await seedSave(page, { ...freshStationSave, game: { ...freshStationSave.game, storyProgress: {} } });
  await page.goto('/great-portland-street');
  await expect(page.locator('.underground-train')).toBeVisible();
  await page.waitForTimeout(2_000);
  await expect(tip(page)).toHaveCount(0);
  await tipSays(page, "London, 1996. You're Frank.");
});
