import { test, expect, continueGame, dismissSpeech, readSave, seedSave, barrierReleasedSave, arrivedAtStationSave } from './fixtures';

const atTheFlatSave = {
  ...barrierReleasedSave,
  game: {
    ...barrierReleasedSave.game,
    currentScene: 'victims-flat-kitchen',
    storyProgress: { ...barrierReleasedSave.game.storyProgress, leftStation: true },
  },
};

const savedNotes = async (page) => (await readSave(page))?.investigation?.discoveredNoteIds;

const inspectHotspot = async (page, name) => {
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: `Inspect ${name}` }).click();
};

test("inspecting something in the flat notes it once, and the note stays when he leaves the room", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await seedSave(page, atTheFlatSave);
  await page.goto('/victims-flat-kitchen');

  await inspectHotspot(page, 'The sink');
  await expect(page.locator('.talk-overlay')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  const toast = page.getByRole('status');
  await expect(toast).toContainText('Note added');
  await expect(toast).toContainText('Two mugs');
  await expect.poll(() => savedNotes(page)).toEqual(['flat-kitchen-sink']);
  await dismissSpeech(page);

  await page.locator('#to-hallway').click();
  await expect(page).toHaveURL(/\/victims-flat-hallway$/, { timeout: 20_000 });
  await page.locator('#to-kitchen').click();
  await expect(page).toHaveURL(/\/victims-flat-kitchen$/, { timeout: 20_000 });
  await expect(toast).toHaveCount(0, { timeout: 10_000 });

  await inspectHotspot(page, 'The sink');
  await expect(page.locator('.talk-overlay')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Note added')).toHaveCount(0);
  await dismissSpeech(page);
  expect(await savedNotes(page)).toEqual(['flat-kitchen-sink']);

  await page.getByRole('button', { name: 'Notebook' }).click();
  const notebook = page.getByRole('dialog', { name: 'Notebook' });
  await expect(notebook.getByRole('tab', { name: "The victim's flat" })).toHaveAttribute('aria-selected', 'true');
  await expect(notebook.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
  await expect(notebook.locator('.notebook__note')).toHaveCount(1);
  await expect(notebook).toContainText('Two mugs');
});

test('the notes found survive Continue, and the inventory is untouched by them', async ({ page }) => {
  await seedSave(page, {
    ...atTheFlatSave,
    investigation: { discoveredNoteIds: ['flat-kitchen-pedal-bin', 'newspaper-sacked-tube-worker'] },
  });

  for (let i = 0; i < 2; i++) {
    await continueGame(page);
    await expect(page).toHaveURL(/\/victims-flat-kitchen$/);
    await page.getByRole('button', { name: 'Notebook' }).click();
    const notebook = page.getByRole('dialog', { name: 'Notebook' });
    await expect(notebook).toContainText('The pedal bin');
    await notebook.getByRole('tab', { name: 'General' }).click();
    await expect(notebook).toContainText('Sacked Tube worker');
    await notebook.getByRole('button', { name: 'X' }).click();
      await expect(page.getByText('Note added')).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Inventory' }).click();
  await expect(page.locator('.inventory-overlay')).toContainText('Your inventory is empty');
  await expect.poll(() => savedNotes(page)).toEqual(['flat-kitchen-pedal-bin', 'newspaper-sacked-tube-worker']);
  expect((await readSave(page)).inventory.items).toEqual([]);
});

test("the notebook stays the same height whichever tab is open", async ({ page }) => {
  await seedSave(page, {
    ...atTheFlatSave,
    investigation: { discoveredNoteIds: ['flat-hallway-post', 'flat-kitchen-sink', 'flat-bedroom-posters'] },
  });
  await page.goto('/victims-flat-kitchen');

  await page.getByRole('button', { name: 'Notebook' }).click();
  const notebook = page.getByRole('dialog', { name: 'Notebook' });
  const { height } = await notebook.boundingBox();
  await notebook.getByRole('tab', { name: 'General' }).click();
  await expect(notebook).toContainText('Nothing noted down yet');
  expect((await notebook.boundingBox()).height).toBe(height);
});

test('reading the newspaper notes the sacked Tube worker', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  await page.getByAltText('Newspaper').click({ timeout: 20_000 });
  await page.locator('.pickup-item .interaction-btn').first().click();
  await expect(page.locator('.game-modal')).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => savedNotes(page)).toEqual(['newspaper-sacked-tube-worker']);
  expect((await readSave(page)).inventory.items).toEqual([]);
});

test.describe('from a conversation', () => {
  test.use({ npcReply: "It'd be my neck on the line, son.", npcRevealedFacts: ['derek_fears_blame'] });

  test('Derek admitting why he won\'t open the barrier goes in the notebook', async ({ page }) => {
    await seedSave(page, arrivedAtStationSave);
    await page.goto('/great-portland-street-ticket-hall');

    await page.locator('.npc', { has: page.getByAltText('Derek the station worker') }).click();
    await page.locator('.npc .interaction-btn', { has: page.locator('.talk-icon') }).click();
    const dialogue = page.locator('.npc-dialogue');
    await dialogue.getByPlaceholder('Say something...').fill('Why not just open it?', { timeout: 20_000 });
    await dialogue.getByPlaceholder('Say something...').press('Enter');

    await expect.poll(() => savedNotes(page)).toEqual(['derek-fears-blame']);
    await expect(dialogue).not.toContainText('derek-fears-blame');
  });
});
