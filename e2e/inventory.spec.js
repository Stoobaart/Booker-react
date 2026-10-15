import { test, expect, startNewGame, continueGame, readSave, seedSave, arrivedAtStationSave } from './fixtures';

// Only the save puts the item in the inventory, so a duplicate would come from Continue
test('an item in the save survives Continue without duplicating', async ({ page }) => {
  const travelcard = { id: 'travelcard-1', name: 'Travelcard', description: 'A zone 1 travelcard', sprite: 'travelcard.png', quantity: 1 };
  await seedSave(page, { ...arrivedAtStationSave, inventory: { items: [travelcard] } });

  for (let i = 0; i < 2; i++) {
    await continueGame(page);
    await expect(page).toHaveURL(/\/great-portland-street$/);
    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.locator('.inventory-item')).toHaveCount(1);
    await expect(page.locator('.inventory-item', { hasText: 'Travelcard' })).toContainText('x1');
    await page.locator('.inventory-overlay .close-btn').click();
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
});
