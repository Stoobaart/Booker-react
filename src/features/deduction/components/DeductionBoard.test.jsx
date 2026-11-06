import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DeductionBoard from './DeductionBoard';
import DeductionBoardButton from './DeductionBoardButton';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { inventoryItems } from '../../inventory/data/items';

const CURRENT_BOARD_ID = 'great-portland-street';

const item = (id) => ({ ...inventoryItems[id], quantity: 1 });

const setup = ({ notes = [], items = [], nodes = [], isBoardOpen = true } = {}) =>
  renderWithProviders(<><DeductionBoardButton /><DeductionBoard /></>, {
    preloadedState: {
      investigation: { discoveredNoteIds: notes, isNotebookOpen: false, newNoteId: null },
      inventory: { items: items.map(item), isOpen: false },
      deduction: { isBoardOpen, boards: { [CURRENT_BOARD_ID]: { nodes } } },
    },
  });

const nodesOf = (store) => store.getState().deduction.boards[CURRENT_BOARD_ID].nodes;

describe('DeductionBoard', () => {
  it('is shut until its button opens it, and closes with its X', async () => {
    const { store } = setup({ isBoardOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Deductions' }));
    expect(screen.getByRole('dialog', { name: 'Deductions' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(store.getState().deduction.isBoardOpen).toBe(false);
  });

  it("lists only the notes of the board's investigation", () => {
    setup({ notes: ['flat-kitchen-sink', 'derek-station-worker', 'newspaper-sacked-tube-worker'] });
    const panel = screen.getByRole('tabpanel', { name: 'Notes' });
    expect([...panel.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Great Portland St']);
    expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Sacked Tube worker',
      'Derek, the station worker',
    ]);
  });

  it("has a tab per investigation's board, and switching shows that board and its notes", async () => {
    setup({
      notes: ['flat-kitchen-sink', 'derek-station-worker'],
      nodes: [{ id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 }],
    });
    expect(screen.getAllByRole('tab', { name: /Great Portland St|victim's flat/ }).map((t) => t.textContent))
      .toEqual(['Great Portland St', "The victim's flat"]);
    expect(screen.getByRole('tab', { name: 'Great Portland St' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('tab', { name: "The victim's flat" }));
    expect(screen.getByLabelText("The victim's flat board")).toBeInTheDocument();
    expect(screen.queryByText('Derek, the station worker')).toBeNull();
    const panel = screen.getByRole('tabpanel', { name: 'Notes' });
    expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Two mugs']);
  });

  it('opens on the board for the scene Frank is in', () => {
    renderWithProviders(<DeductionBoard />, {
      preloadedState: {
        investigation: { discoveredNoteIds: ['flat-kitchen-sink', 'derek-station-worker'], isNotebookOpen: false, newNoteId: null },
        game: { currentScene: 'victims-flat-kitchen', storyProgress: {} },
        deduction: { isBoardOpen: true, boards: {} },
      },
    });
    expect(screen.getByRole('tab', { name: "The victim's flat" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText("The victim's flat board")).toBeInTheDocument();
  });

  it('has no board tabs while there is only one board', () => {
    setup({ notes: ['derek-station-worker'] });
    expect(screen.queryByRole('tab', { name: 'Great Portland St' })).toBeNull();
  });

  it("doesn't list notes that can't be pinned", () => {
    setup({ notes: ['derek-station-worker', 'ticket-barrier-rejected', 'derek-opened-barrier'] });
    const panel = screen.getByRole('tabpanel', { name: 'Notes' });
    expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Derek, the station worker']);
  });

  it('lists the evidence on its own tab', async () => {
    setup({ items: ['key', 'lighter'] });
    await userEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
    const panel = screen.getByRole('tabpanel', { name: 'Evidence' });
    expect(within(panel).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Door key', 'Lighter']);
  });

  it("leaves out what's on the board, and shows it pinned there", async () => {
    setup({
      notes: ['newspaper-sacked-tube-worker', 'derek-station-worker'],
      items: ['key', 'lighter'],
      nodes: [
        { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 },
        { id: 'item:key', kind: 'item', refId: 'key', x: 0.2, y: 0.2 },
      ],
    });
    expect(screen.queryByRole('listitem', { name: 'Derek, the station worker' })).toBeNull();
    expect(screen.getByRole('listitem', { name: 'Sacked Tube worker' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
    expect(screen.queryByRole('listitem', { name: 'Door key' })).toBeNull();

    const board = screen.getByLabelText('Great Portland St board');
    expect(within(board).getByText('Derek, the station worker')).toBeInTheDocument();
    expect(within(board).getByText('Door key').closest('.board-node')).toHaveStyle({ left: '20%', top: '20%' });
  });

  it('takes a node off the board with its X, back to the sidebar', async () => {
    const { store } = setup({
      notes: ['derek-station-worker'],
      nodes: [{ id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 }],
    });
    expect(screen.queryByRole('listitem', { name: 'Derek, the station worker' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Take Derek, the station worker off the board' }));
    expect(nodesOf(store)).toEqual([]);
    expect(screen.getByRole('listitem', { name: 'Derek, the station worker' })).toBeInTheDocument();
    expect(store.getState().deduction.isBoardOpen).toBe(true);
  });

  it('says when there is nothing to pin, or all of it is pinned', async () => {
    setup({ items: ['key'], nodes: [{ id: 'item:key', kind: 'item', refId: 'key', x: 0.5, y: 0.5 }] });
    expect(screen.getByText('Nothing noted down yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
    expect(screen.getByText('Everything is on the board')).toBeInTheDocument();
  });

  describe('dragging', () => {
    // The board fills x 400..1400, y 100..600 on screen, at its full size
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
        return this.classList.contains('deduction-board__cork')
          ? { left: 400, top: 100, width: 1000, height: 500 }
          : { left: 0, top: 0, width: 1920, height: 980 };
      });
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function width() {
        return this.classList.contains('deduction-board__cork') ? 1000 : 100;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function height() {
        return this.classList.contains('deduction-board__cork') ? 500 : 50;
      });
      // A board without a border, to keep the sums simple
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function width() {
        return this.classList.contains('deduction-board__cork') ? 1000 : 100;
      });
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function height() {
        return this.classList.contains('deduction-board__cork') ? 500 : 50;
      });
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const dragTo = (el, clientX, clientY) => {
      fireEvent.pointerDown(el, { button: 0, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(window, { clientX, clientY });
      fireEvent.pointerUp(window, { clientX, clientY });
    };

    it('pins a note dropped on the board where it was let go', () => {
      const { store } = setup({ notes: ['derek-station-worker'] });
      dragTo(screen.getByRole('listitem', { name: 'Derek, the station worker' }), 900, 350);
      expect(nodesOf(store)).toEqual([
        { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 },
      ]);
      expect(screen.queryByRole('listitem', { name: 'Derek, the station worker' })).toBeNull();
    });

    it('keeps a node dropped at the edge wholly on the board', async () => {
      const { store } = setup({ items: ['key'] });
      await userEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
      dragTo(screen.getByRole('listitem', { name: 'Door key' }), 1399, 101);
      expect(nodesOf(store)[0]).toMatchObject({ id: 'item:key', x: 0.95, y: 0.05 });
    });

    it("doesn't pin something let go of off the board", () => {
      const { store } = setup({ notes: ['derek-station-worker'] });
      dragTo(screen.getByRole('listitem', { name: 'Derek, the station worker' }), 200, 350);
      expect(nodesOf(store)).toEqual([]);
      expect(screen.getByRole('listitem', { name: 'Derek, the station worker' })).toBeInTheDocument();
    });

    it("doesn't start dragging a node when its X is pressed", () => {
      const { store } = setup({
        notes: ['derek-station-worker'],
        nodes: [{ id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 }],
      });
      const remove = screen.getByRole('button', { name: 'Take Derek, the station worker off the board' });
      fireEvent.pointerDown(remove, { button: 0, clientX: 900, clientY: 350 });
      fireEvent.pointerMove(window, { clientX: 500, clientY: 200 });
      expect(remove.closest('.board-node')).not.toHaveClass('board-node--dragging');
      fireEvent.pointerUp(window, { clientX: 500, clientY: 200 });
      expect(nodesOf(store)[0]).toMatchObject({ x: 0.5, y: 0.5 });
    });

    it('moves a pinned node, keeping where it was grabbed under the pointer', () => {
      const { store } = setup({
        notes: ['derek-station-worker'],
        nodes: [{ id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.5, y: 0.5 }],
      });
      const node = screen.getByText('Derek, the station worker').closest('.board-node');
      // Grabbed 20px right of its centre
      fireEvent.pointerDown(node, { button: 0, clientX: 920, clientY: 350 });
      fireEvent.pointerMove(window, { clientX: 720, clientY: 250 });
      expect(node).toHaveStyle({ left: '30%', top: '30%' });
      fireEvent.pointerUp(window, { clientX: 720, clientY: 250 });
      expect(nodesOf(store)[0]).toMatchObject({ x: 0.3, y: 0.3 });
    });
  });

  describe('strings', () => {
    const pinned = [
      { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.2, y: 0.5 },
      { id: 'note:derek-fears-blame', kind: 'note', refId: 'derek-fears-blame', x: 0.5, y: 0.5 },
      { id: 'item:key', kind: 'item', refId: 'key', x: 0.8, y: 0.5 },
    ];
    const setupPinned = (connections = []) =>
      renderWithProviders(<DeductionBoard />, {
        preloadedState: {
          investigation: { discoveredNoteIds: ['derek-station-worker', 'derek-fears-blame'], isNotebookOpen: false, newNoteId: null },
          inventory: { items: [item('key')], isOpen: false },
          deduction: { isBoardOpen: true, boards: { [CURRENT_BOARD_ID]: { nodes: pinned, connections } } },
        },
      });
    const press = (el) => fireEvent.pointerDown(el, { button: 0 });
    const card = (text) => screen.getByText(text).closest('.board-node');
    const spool = () => screen.getByRole('button', { name: 'Red string' });
    const connectionsOf = (store) => store.getState().deduction.boards[CURRENT_BOARD_ID].connections;
    const derekToKey = { id: 'item:key~note:derek-station-worker', from: 'note:derek-station-worker', to: 'item:key' };

    it('picks up a string from the spool and ties it between two cards', () => {
      const { store } = setupPinned();
      press(spool());
      expect(spool()).toHaveAttribute('aria-pressed', 'true');
      press(card('Derek, the station worker'));
      press(card('Door key'));
      expect(connectionsOf(store)).toEqual([derekToKey]);
      expect(spool()).toHaveAttribute('aria-pressed', 'false');
    });

    it("doesn't drag a card or offer its X while holding a string", () => {
      const { store } = setupPinned();
      press(spool());
      expect(screen.queryByRole('button', { name: /off the board/ })).toBeNull();
      press(card('Derek, the station worker'));
      fireEvent.pointerMove(window, { clientX: 500, clientY: 500 });
      expect(card('Derek, the station worker')).not.toHaveClass('board-node--dragging');
      fireEvent.pointerUp(window, { clientX: 500, clientY: 500 });
      expect(nodesOf(store)[0]).toMatchObject({ x: 0.2, y: 0.5 });
    });

    it('chains another card on with a new string', () => {
      const { store } = setupPinned([derekToKey]);
      press(spool());
      press(card('Door key'));
      press(card('The station worker is afraid to open the barriers manually'));
      expect(connectionsOf(store).map((c) => c.id)).toEqual([derekToKey.id, 'item:key~note:derek-fears-blame']);
    });

    it.each([
      ['the cork', () => screen.getByLabelText('Great Portland St board')],
      ['the sidebar', () => screen.getByRole('tab', { name: 'Notes' })],
      ['the same card', () => card('Derek, the station worker')],
      ['the spool', spool],
    ])('lets go of a string tied to one card when %s is pressed', (_, target) => {
      const { store } = setupPinned();
      press(spool());
      press(card('Derek, the station worker'));
      press(target());
      expect(spool()).toHaveAttribute('aria-pressed', 'false');
      press(card('Door key'));
      expect(connectionsOf(store)).toEqual([]);
    });

    it("puts a string back when pressing anywhere but a card, without closing the board", () => {
      const { container, store } = setupPinned();
      press(spool());
      const overlay = container.querySelector('.deduction-overlay');
      press(overlay);
      fireEvent.click(overlay);
      expect(store.getState().deduction.isBoardOpen).toBe(true);
      expect(spool()).toHaveAttribute('aria-pressed', 'false');
    });

    it('lets go with Escape', () => {
      setupPinned();
      press(spool());
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(spool()).toHaveAttribute('aria-pressed', 'false');
    });

    it('cuts a string picked out by clicking it', async () => {
      const { container, store } = setupPinned([derekToKey]);
      expect(screen.queryByRole('button', { name: /Cut the string/ })).toBeNull();
      press(container.querySelector(`[data-connection-id="${derekToKey.id}"] .board-strings__hit`));
      await userEvent.click(screen.getByRole('button', { name: 'Cut the string between Derek, the station worker and Door key' }));
      expect(connectionsOf(store)).toEqual([]);
      expect(screen.queryByRole('button', { name: /Cut the string/ })).toBeNull();
    });

    it('deselects a string when pressing anywhere else', () => {
      const { container, store } = setupPinned([derekToKey]);
      press(container.querySelector('.board-strings__hit'));
      press(screen.getByLabelText('Great Portland St board'));
      expect(screen.queryByRole('button', { name: /Cut the string/ })).toBeNull();
      expect(connectionsOf(store)).toEqual([derekToKey]);
    });
  });

  describe('deductions', () => {
    const POST_IT_TEXT = 'Did Derek know the sacked Tube worker, Clive?';
    const setupClues = () =>
      renderWithProviders(<DeductionBoard />, {
        preloadedState: {
          investigation: { discoveredNoteIds: ['newspaper-sacked-tube-worker', 'derek-station-worker'], isNotebookOpen: false, newNoteId: null },
          inventory: { items: [], isOpen: false },
          deduction: {
            isBoardOpen: true,
            madeDeductionIds: [],
            boards: {
              [CURRENT_BOARD_ID]: {
                nodes: [
                  { id: 'note:newspaper-sacked-tube-worker', kind: 'note', refId: 'newspaper-sacked-tube-worker', x: 0.2, y: 0.3 },
                  { id: 'note:derek-station-worker', kind: 'note', refId: 'derek-station-worker', x: 0.7, y: 0.3 },
                ],
                connections: [],
              },
            },
          },
        },
      });
    const press = (el) => fireEvent.pointerDown(el, { button: 0 });
    const card = (text) => screen.getByText(text).closest('.board-node');

    it('pins a post-it, tied on with a string that cannot be cut, when the paper and Derek are connected', () => {
      const { container, store } = setupClues();
      expect(screen.queryByText(POST_IT_TEXT)).toBeNull();
      press(screen.getByRole('button', { name: 'Red string' }));
      press(card('Sacked Tube worker'));
      press(card('Derek, the station worker'));

      expect(card(POST_IT_TEXT)).toHaveClass('board-node--deduction');
      expect(screen.queryByRole('button', { name: `Take ${POST_IT_TEXT} off the board` })).toBeNull();
      expect(container.querySelectorAll('.board-strings__rope--fixed')).toHaveLength(1);
      expect(container.querySelectorAll('[data-connection-id]')).toHaveLength(1);
      expect(store.getState().deduction.madeDeductionIds).toEqual(['derek-knew-sacked-worker']);
    });

    it('takes the post-it and its string away when the string between them is cut', async () => {
      const { container } = setupClues();
      press(screen.getByRole('button', { name: 'Red string' }));
      press(card('Sacked Tube worker'));
      press(card('Derek, the station worker'));
      press(container.querySelector('.board-strings__hit'));
      await userEvent.click(screen.getByRole('button', { name: 'Cut the string between Sacked Tube worker and Derek, the station worker' }));

      expect(screen.queryByText(POST_IT_TEXT)).toBeNull();
      expect(container.querySelectorAll('.board-strings__rope--fixed')).toHaveLength(0);
    });
  });
});
