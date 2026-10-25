import { test, expect, startNewGame, continueGame, readSave, seedSave, arrivedAtStationSave } from './fixtures';

// Only the save puts the item in the inventory, so a duplicate would come from Continue
test('an item in the save survives Continue without duplicating', async ({ page }) => {
  const travelcard = { id: 'travelcard-1', name: 'Travelcard', description: 'A zone 1 travelcard', sprite: 'travelcard.png', quantity: 1 };
  await seedSave(page, { ...arrivedAtStationSave, inventory: { items: [travelcard] } });

  for (let i = 0; i < 2; i++) {
    await continueGame(page);
    await expect(page).toHaveURL(/\/great-portland-street$/);
    await page.getByRole('button', { name: 'Inventory' }).click();
    const box = page.getByRole('dialog', { name: 'Inventory' });
    await expect(box.locator('.inventory-item')).toHaveCount(1);
    await expect(box.getByRole('button', { name: 'Travelcard' })).toBeVisible();
    await expect(box.locator('.evidence-box__tag')).toContainText('Travelcard x1');
    await box.getByRole('button', { name: 'X' }).click();
    await expect(box).toHaveCount(0);
  }

  await expect.poll(async () => (await readSave(page))?.inventory.items).toEqual([travelcard]);
});

test('inspecting the newspaper opens the newspaper modal', async ({ page }) => {
  await startNewGame(page);

  await page.getByAltText('Newspaper').click({ timeout: 20_000 });
  await page.locator('.pickup-item .interaction-btn').first().click();

  const modal = page.locator('.game-modal');
  await expect(modal).toBeVisible({ timeout: 15_000 });
  await expect(modal).toContainText('TUBE WORKER SACKED OVER FREE RIDES');
  await expect(modal).toContainText('Clive Hargreaves');
  await modal.getByRole('button', { name: '✕' }).click();
  await expect(modal).toBeHidden();

  // on the paving, not the bench
  const feetY = await page.locator('#player-container').evaluate((el) => el.offsetTop + el.offsetHeight);
  expect(feetY).toBeGreaterThan(770);
});
