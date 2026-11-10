import { test, expect, readSave } from './fixtures';

test('a start point begins the game in the flat hallway as if Frank has just arrived', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 980 });
  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await page.locator('.logo_overlay').click();
  await page.getByRole('button', { name: 'Flat hallway, first arrival' }).click();

  await expect(page).toHaveURL(/\/victims-flat-hallway$/);
  await expect(page.locator('#player-sprite')).toHaveClass(/up/);
  await expect(page.getByRole('status')).toContainText('New case notes', { timeout: 10_000 });
  await expect.poll(async () => (await readSave(page))?.investigation.openedInvestigationIds)
    .toEqual(['great-portland-street', 'victims-flat']);

  await page.getByRole('button', { name: 'Notebook' }).click();
  const notebook = page.getByRole('dialog', { name: 'Notebook' });
  await expect(notebook.getByRole('tab', { name: "The victim's flat" })).toBeVisible();
  await notebook.getByRole('tab', { name: 'Great Portland St' }).click();
  await expect(notebook).toContainText('Sacked Tube worker');
});
