import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory, { INVENTORY_ANIMATION_MS, ITEMS_PER_ROW, ROW_SWAP_MS } from './Inventory';
import InventoryButton from './InventoryButton';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { closeInventory, openInventory } from '../slices/inventorySlice';

const travelcard = { id: 'travelcard-1', name: 'Travelcard', description: 'A zone 1 travelcard', quantity: 1 };
const banana = { id: 'banana-1', name: 'Banana', description: 'Going brown', sprite: 'banana.png', quantity: 2 };

const withItems = (items, isOpen = true) => ({ preloadedState: { inventory: { items, isOpen } } });

describe('Inventory', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is shut until the Inventory button opens the evidence box', async () => {
    renderWithProviders(<><InventoryButton /><Inventory /></>, withItems([], false));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Inventory' }));
    expect(screen.getByRole('dialog', { name: 'Inventory' })).toBeInTheDocument();
  });

  it('says when the box is empty', () => {
    renderWithProviders(<Inventory />, withItems([]));
    expect(screen.getByText('Your inventory is empty')).toBeInTheDocument();
  });

  it("puts each item in the box, with the first one's tag showing", () => {
    renderWithProviders(<Inventory />, withItems([travelcard, banana]));
    expect(screen.getByRole('button', { name: 'Travelcard' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Banana' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('A zone 1 travelcard')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
  });

  it('shows the tag of whichever item is picked out', async () => {
    renderWithProviders(<Inventory />, withItems([travelcard, banana]));
    await userEvent.click(screen.getByRole('button', { name: 'Banana' }));
    expect(screen.getByRole('button', { name: 'Banana' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Going brown')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('stays up while it closes, then goes', () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<Inventory />, withItems([travelcard]));
    fireEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(store.getState().inventory.isOpen).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Inventory' }).parentElement).toHaveClass('inventory-overlay--closing');

    act(() => {
      vi.advanceTimersByTime(INVENTORY_ANIMATION_MS - 1);
    });
    expect(screen.getByRole('dialog', { name: 'Inventory' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opened again while closing, it finishes going and then opens', () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<Inventory />, withItems([travelcard]));
    act(() => {
      store.dispatch(closeInventory());
    });
    act(() => {
      store.dispatch(openInventory());
    });
    expect(screen.getByRole('dialog', { name: 'Inventory' }).parentElement).toHaveClass('inventory-overlay--closing');

    act(() => {
      vi.advanceTimersByTime(INVENTORY_ANIMATION_MS);
    });
    expect(screen.getByRole('dialog', { name: 'Inventory' }).parentElement).not.toHaveClass('inventory-overlay--closing');
  });

  it('closes when clicked outside the box, but not when clicked on it', async () => {
    const { store } = renderWithProviders(<Inventory />, withItems([travelcard]));
    await userEvent.click(screen.getByRole('dialog', { name: 'Inventory' }));
    expect(store.getState().inventory.isOpen).toBe(true);
    await userEvent.click(screen.getByRole('dialog', { name: 'Inventory' }).parentElement);
    expect(store.getState().inventory.isOpen).toBe(false);
  });

  describe('with more than a row of items', () => {
    const many = Array.from({ length: ITEMS_PER_ROW + 2 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}`, quantity: 1 }));
    const shownItems = () => [...document.querySelectorAll('.inventory-item')].map((b) => b.getAttribute('aria-label'));
    // A hidden arrow has no accessible name to find it by
    const arrow = (way) => document.querySelector(`.evidence-box__arrow--${way}`);

    it('shows a row at a time, with an arrow to the next', () => {
      renderWithProviders(<Inventory />, withItems(many));
      expect(shownItems()).toEqual(['Item 0', 'Item 1', 'Item 2', 'Item 3']);
      expect(screen.getByRole('button', { name: 'Next items' })).toBeVisible();
      expect(arrow('back')).not.toBeVisible();
    });

    it('sinks the row, then raises the next with its first item picked out', () => {
      vi.useFakeTimers();
      renderWithProviders(<Inventory />, withItems(many));
      fireEvent.click(screen.getByRole('button', { name: 'Next items' }));
      expect(document.querySelector('.evidence-box__items')).toHaveClass('evidence-box__items--sinking');
      expect(shownItems()).toEqual(['Item 0', 'Item 1', 'Item 2', 'Item 3']);

      act(() => {
        vi.advanceTimersByTime(ROW_SWAP_MS);
      });
      expect(document.querySelector('.evidence-box__items')).toHaveClass('evidence-box__items--rising');
      expect(shownItems()).toEqual(['Item 4', 'Item 5']);
      expect(screen.getByRole('button', { name: 'Item 4' })).toHaveAttribute('aria-pressed', 'true');

      act(() => {
        vi.advanceTimersByTime(ROW_SWAP_MS);
      });
      expect(document.querySelector('.evidence-box__items')).not.toHaveClass('evidence-box__items--rising');
      expect(screen.getByRole('button', { name: 'Previous items' })).toBeVisible();
      expect(arrow('next')).not.toBeVisible();
    });

    it('ignores the arrows while a row is swapping', () => {
      vi.useFakeTimers();
      renderWithProviders(<Inventory />, withItems([...many, ...many.map((item) => ({ ...item, id: `${item.id}-b`, name: `${item.name}b` }))]));
      fireEvent.click(screen.getByRole('button', { name: 'Next items' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next items' }));
      act(() => {
        vi.advanceTimersByTime(ROW_SWAP_MS * 2);
      });
      expect(shownItems()[0]).toBe('Item 4');
    });
  });

  it('has no arrows when everything fits in one row', () => {
    renderWithProviders(<Inventory />, withItems([travelcard, banana]));
    expect(document.querySelector('.evidence-box__arrow')).toBeNull();
  });
});
