import { test, expect, seedSave, readSave, arrivedAtStationSave } from './fixtures';

const openDerek = async (page) => {
  await page.getByAltText('Station Worker').first().click();
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
