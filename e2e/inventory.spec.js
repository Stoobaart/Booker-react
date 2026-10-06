import { test, expect, startNewGame, continueGame, readSave } from './fixtures';

test('new game → pick up banana → it survives Continue without duplicating', async ({ page }) => {
  await startNewGame(page);

  const banana = page.getByAltText('Banana');
  // The arrival train covers the platform for the first few seconds; click waits until it's gone
  await banana.click({ timeout: 20_000 });
  await page.locator('.pickup-item .interaction-btn').nth(1).click();

  // Frank walks over, plays the pickup animation, then the banana leaves the scene
  await expect(banana).toBeHidden({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Inventory' }).click();
  const item = page.locator('.inventory-item', { hasText: 'Banana' });
  await expect(item).toContainText('x1');
  await page.locator('.inventory-overlay .close-btn').click();

  await expect.poll(async () => (await readSave(page))?.inventory.items).toEqual([
    expect.objectContaining({ id: 'banana-1', quantity: 1 }),
  ]);

  await continueGame(page);
  await expect(page).toHaveURL(/\/great-portland-street$/);
  await expect(page.locator('.underground-train')).toHaveCount(0);
  await expect(page.getByAltText('Banana')).toHaveCount(0);

  await page.getByRole('button', { name: 'Inventory' }).click();
  await expect(page.locator('.inventory-item')).toHaveCount(1);
  await expect(page.locator('.inventory-item', { hasText: 'Banana' })).toContainText('x1');
});

test('inspecting the newspaper opens the newspaper modal', async ({ page }) => {
  await startNewGame(page);

  await page.getByAltText('Newspaper').click({ timeout: 20_000 });
  await page.locator('.pickup-item .interaction-btn').first().click();

  const modal = page.locator('.game-modal');
  await expect(modal).toBeVisible({ timeout: 15_000 });
  await modal.getByRole('button', { name: '✕' }).click();
  await expect(modal).toBeHidden();
});
