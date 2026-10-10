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
  await page.goto('/great-portland-street');

  const dialogue = await openDerek(page);
  // Frank walked in leftwards from the tunnel end, then turned to face Derek on his right
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
  await page.goto('/great-portland-street');

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

test('Derek stands on the platform showing one animated sprite frame', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

  const frame = derek(page).locator('.npc__sprite-frame');
  await expect(frame).toBeVisible();
  const box = await frame.boundingBox();
  expect(box.width).toBeCloseTo(200, 0);
  expect(box.height).toBeCloseTo(362, 0);
  // Feet sit at his position
  expect(box.x + box.width / 2).toBeCloseTo(1170, 0);
  expect(box.y + box.height).toBeCloseTo(773, 0);

  const sprite = page.getByAltText('Derek the station worker');
  await expect(sprite).toHaveCSS('animation-name', 'npc-sheet');
  await expect(sprite).toHaveCSS('animation-timing-function', 'steps(8)');
  // The sheet is 16 frames wide and 3 rows tall
  const sheet = await sprite.evaluate((el) => [el.offsetWidth, el.offsetHeight]);
  expect(sheet).toEqual([3200, 1086]);
});

test('only Derek himself is clickable, not the empty space around him', async ({ page }) => {
  await seedSave(page, arrivedAtStationSave);
  await page.goto('/great-portland-street');

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
