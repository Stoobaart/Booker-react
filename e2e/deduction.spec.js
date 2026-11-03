import { test, expect, seedSave, arrivedAtStationSave, continueGame, readSave } from './fixtures';

const withCluesSave = {
  ...arrivedAtStationSave,
  inventory: { items: [{ id: 'key', name: 'Door key', quantity: 1 }] },
  investigation: { discoveredNoteIds: ['newspaper-sacked-tube-worker', 'derek-station-worker', 'flat-kitchen-sink'] },
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

// Where a point a fraction of the way across and down the board, inside its frame, is on screen
const boardPoint = (board, fx, fy) =>
  board.evaluate((el, [fx, fy]) => {
    const rect = el.getBoundingClientRect();
    const scale = rect.width / el.offsetWidth;
    return {
      x: rect.left + (el.clientLeft + el.clientWidth * fx) * scale,
      y: rect.top + (el.clientTop + el.clientHeight * fy) * scale,
    };
  }, [fx, fy]);

const expectNear = (point, expected) => {
  expect(point.x).toBeCloseTo(expected.x, 0);
  expect(point.y).toBeCloseTo(expected.y, 0);
};

test.describe('the deductions board', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page, withCluesSave);
    await page.goto('/great-portland-street');
    await page.getByRole('button', { name: 'Deductions' }).click();
  });

  test('pins notes and evidence dragged onto it, and takes them off the list', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    const sidebar = dialog.locator('.board-sidebar');

    await expect(sidebar.getByRole('heading')).toHaveText(['Great Portland St', "The victim's flat"]);
    await drag(page, await centreOf(sidebar.getByRole('listitem', { name: 'Derek' })), await boardPoint(board, 0.3, 0.4));
    await expect(board.locator('.board-node')).toHaveCount(1);
    await expect(board.locator('.board-node')).toContainText('Derek');
    await expect(sidebar.getByRole('listitem', { name: 'Derek' })).toHaveCount(0);
    expectNear(await centreOf(board.locator('.board-node')), await boardPoint(board, 0.3, 0.4));

    await dialog.getByRole('tab', { name: 'Evidence' }).click();
    await drag(page, await centreOf(sidebar.getByRole('listitem', { name: 'Door key' })), await boardPoint(board, 0.7, 0.6));
    await expect(board.locator('.board-node--item')).toContainText('Door key');
    await expect(sidebar).toContainText('Everything is on the board');
  });

  test('draws the node dropped last on top of any it overlaps', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    const topNodeAt = (point) =>
      page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.board-node')?.querySelector('.board-node__title').textContent, point);

    await drag(page, await centreOf(dialog.getByRole('listitem', { name: 'Derek' })), await boardPoint(board, 0.3, 0.5));
    await drag(page, await centreOf(dialog.getByRole('listitem', { name: 'Two mugs' })), await boardPoint(board, 0.6, 0.5));
    const derek = board.locator('.board-node', { hasText: 'Derek' });
    const mugs = board.locator('.board-node', { hasText: 'Two mugs' });

    // Derek's card dropped half over the mugs
    await drag(page, await centreOf(derek), await boardPoint(board, 0.5, 0.5));
    expect(await topNodeAt(await boardPoint(board, 0.55, 0.5))).toBe('Derek');

    await drag(page, await centreOf(mugs), await boardPoint(board, 0.55, 0.5));
    expect(await topNodeAt(await boardPoint(board, 0.5, 0.5))).toBe('Two mugs');
  });

  test('takes a node off the board with its X, and it can go back on', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    const entry = dialog.getByRole('listitem', { name: 'Two mugs' });

    await drag(page, await centreOf(entry), await boardPoint(board, 0.5, 0.5));
    const node = board.locator('.board-node');
    const remove = node.getByRole('button', { name: 'Take Two mugs off the board' });
    await page.mouse.move(5, 5);
    await expect(remove).toHaveCSS('opacity', '0');
    await node.hover();
    await expect(remove).toHaveCSS('opacity', '1');
    await remove.click();

    await expect(node).toHaveCount(0);
    await expect(entry).toBeVisible();
    await expect(dialog).toBeVisible();
    await drag(page, await centreOf(entry), await boardPoint(board, 0.4, 0.4));
    await expect(node).toContainText('Two mugs');
  });

  test("drops nothing let go of off the board, and drags pinned nodes about it", async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    const entry = dialog.getByRole('listitem', { name: 'Two mugs' });

    const start = await centreOf(entry);
    await drag(page, start, { x: start.x, y: start.y + 40 });
    await expect(entry).toBeVisible();
    await expect(board.locator('.board-node')).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await drag(page, await centreOf(entry), await boardPoint(board, 0.5, 0.5));
    const node = board.locator('.board-node');
    await drag(page, await centreOf(node), await boardPoint(board, 0.25, 0.75));
    expectNear(await centreOf(node), await boardPoint(board, 0.25, 0.75));

    // Dragged right off the bottom right corner, it stays on the board
    await drag(page, await centreOf(node), await boardPoint(board, 1.2, 1.2));
    const nodeBox = await node.boundingBox();
    const boardBox = await board.boundingBox();
    expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(boardBox.x + boardBox.width + 1);
    expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(boardBox.y + boardBox.height + 1);
  });

  test.describe('strings', () => {
    const pinNote = async (page, name, fx, fy) => {
      const dialog = page.getByRole('dialog', { name: 'Deductions' });
      const board = dialog.getByLabel('Great Portland St board');
      await drag(page, await centreOf(dialog.getByRole('listitem', { name, exact: true })), await boardPoint(board, fx, fy));
      return board.locator('.board-node--note', { hasText: name });
    };

    // How far each string's ends are from the nearest card's pin, on screen
    const endsOffPins = (page) =>
      page.evaluate(() => {
        const pins = [...document.querySelectorAll('.deduction-board__cork .board-node')].map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top };
        });
        return [...document.querySelectorAll('.board-strings [data-connection-id]')].flatMap((g) =>
          [...g.parentElement.querySelectorAll('.board-strings__pin')].map((pin) => {
            const r = pin.getBoundingClientRect();
            const centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            return Math.min(...pins.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)));
          }));
      });

    test('ties a string between two cards, which stays on their pins as they move', async ({ page }) => {
      const derek = await pinNote(page, 'Derek', 0.25, 0.4);
      const paper = await pinNote(page, 'Sacked Tube worker', 0.7, 0.6);
      const strings = page.locator('.board-strings [data-connection-id]');

      await page.getByRole('button', { name: 'Red string' }).click();
      await derek.click();
      await page.mouse.move(600, 300, { steps: 5 });
      await expect(strings).toHaveCount(0);
      await paper.click();
      await expect(strings).toHaveCount(1);
      await expect.poll(async () => (await endsOffPins(page)).length).toBe(2);
      await expect.poll(async () => Math.max(...(await endsOffPins(page)))).toBeLessThan(4);

      const board = page.getByLabel('Great Portland St board');
      await drag(page, await centreOf(paper), await boardPoint(board, 0.5, 0.2));
      await expect.poll(async () => Math.max(...(await endsOffPins(page)))).toBeLessThan(4);
      await drag(page, await centreOf(derek), await boardPoint(board, 0.8, 0.8));
      await expect.poll(async () => Math.max(...(await endsOffPins(page)))).toBeLessThan(4);
    });

    test('lets go of a string tied to one card when the cork is clicked', async ({ page }) => {
      const derek = await pinNote(page, 'Derek', 0.25, 0.4);
      const paper = await pinNote(page, 'Sacked Tube worker', 0.7, 0.6);
      const spool = page.getByRole('button', { name: 'Red string' });

      await spool.click();
      await derek.click();
      const board = page.getByLabel('Great Portland St board');
      const empty = await boardPoint(board, 0.5, 0.9);
      await page.mouse.click(empty.x, empty.y);
      await expect(spool).toHaveAttribute('aria-pressed', 'false');
      await paper.click();
      await expect(page.locator('.board-strings [data-connection-id]')).toHaveCount(0);
      await expect(page.getByRole('dialog', { name: 'Deductions' })).toBeVisible();
    });

    test('cuts a string clicked on, with its X', async ({ page }) => {
      const derek = await pinNote(page, 'Derek', 0.2, 0.3);
      const paper = await pinNote(page, 'Sacked Tube worker', 0.8, 0.3);
      await page.getByRole('button', { name: 'Red string' }).click();
      await derek.click();
      await paper.click();

      // Its middle, once it's settled
      await page.waitForTimeout(1000);
      const hit = page.locator('.board-strings__hit');
      const middle = await hit.evaluate((path) => {
        const point = path.getPointAtLength(path.getTotalLength() / 2);
        const ctm = path.getScreenCTM();
        return { x: point.x * ctm.a + ctm.e, y: point.y * ctm.d + ctm.f };
      });
      await page.mouse.click(middle.x, middle.y);
      await page.getByRole('button', { name: 'Cut the string between Derek and Sacked Tube worker' }).click();
      await expect(page.locator('.board-strings [data-connection-id]')).toHaveCount(0);
    });
  });

  test('pins a post-it tied to the string between the paper and Derek, until that string is cut', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    const pin = async (name, fx, fy) => {
      await drag(page, await centreOf(dialog.getByRole('listitem', { name, exact: true })), await boardPoint(board, fx, fy));
      return board.locator('.board-node--note', { hasText: name });
    };
    const paper = await pin('Sacked Tube worker', 0.2, 0.3);
    const derek = await pin('Derek', 0.8, 0.3);
    await page.getByRole('button', { name: 'Red string' }).click();
    await paper.click();
    await derek.click();

    const postIt = board.locator('.board-node--deduction');
    await expect(postIt).toHaveText('Did Derek know the sacked Tube worker, Clive?');
    await expect(page.locator('.board-strings__rope--fixed')).toHaveCount(1);
    await expect.poll(async () => (await readSave(page)).deduction?.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);

    // Its string's knot sits on the middle of the string that made it
    await page.waitForTimeout(1000);
    const [knot, middle] = await page.evaluate(() => {
      const box = document.querySelector('.board-strings__knot').getBoundingClientRect();
      const path = document.querySelector('.board-strings__hit');
      const point = path.getPointAtLength(path.getTotalLength() / 2);
      const ctm = path.getScreenCTM();
      return [{ x: box.left + box.width / 2, y: box.top + box.height / 2 }, { x: point.x * ctm.a + ctm.e, y: point.y * ctm.d + ctm.f }];
    });
    expect(Math.hypot(knot.x - middle.x, knot.y - middle.y)).toBeLessThan(20);
    await page.screenshot({ path: 'test-results/deduction-post-it.png' });

    await postIt.hover();
    await expect(postIt.getByRole('button')).toHaveCount(0);
    await page.mouse.click(middle.x, middle.y);
    await page.getByRole('button', { name: 'Cut the string between Sacked Tube worker and Derek' }).click();
    await expect(postIt).toHaveCount(0);
    await expect(page.locator('.board-strings__rope--fixed')).toHaveCount(0);
    await expect(paper).toBeVisible();
    await expect(derek).toBeVisible();
    expect((await readSave(page)).deduction.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
  });

  test('keeps the cards, where they are, and their strings, through a save and Continue', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Deductions' });
    const board = dialog.getByLabel('Great Portland St board');
    await drag(page, await centreOf(dialog.getByRole('listitem', { name: 'Derek' })), await boardPoint(board, 0.3, 0.4));
    await dialog.getByRole('tab', { name: 'Evidence' }).click();
    await drag(page, await centreOf(dialog.getByRole('listitem', { name: 'Door key' })), await boardPoint(board, 0.7, 0.6));
    await page.getByRole('button', { name: 'Red string' }).click();
    await board.locator('.board-node', { hasText: 'Derek' }).click();
    await board.locator('.board-node', { hasText: 'Door key' }).click();

    await expect.poll(async () => (await readSave(page)).deduction?.boards?.['great-portland-street']?.connections).toEqual([
      { id: 'item:key~note:derek-station-worker', from: 'note:derek-station-worker', to: 'item:key' },
    ]);
    const saved = (await readSave(page)).deduction;
    expect(saved).not.toHaveProperty('isBoardOpen');
    expect(saved.boards['great-portland-street'].nodes.map((n) => n.id)).toEqual(['note:derek-station-worker', 'item:key']);

    await continueGame(page);
    await expect(page).toHaveURL(/\/great-portland-street$/);
    await expect(page.getByRole('dialog', { name: 'Deductions' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Deductions' }).click();

    await expect(board.locator('.board-node__title')).toHaveText(['Derek', 'Door key']);
    expectNear(await centreOf(board.locator('.board-node', { hasText: 'Derek' })), await boardPoint(board, 0.3, 0.4));
    expectNear(await centreOf(board.locator('.board-node', { hasText: 'Door key' })), await boardPoint(board, 0.7, 0.6));
    await expect(page.locator('.board-strings [data-connection-id]')).toHaveCount(1);
    await expect(dialog.getByRole('listitem', { name: 'Derek' })).toHaveCount(0);
  });
});
