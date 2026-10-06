import reducer, { addItem, removeItem, restoreInventory, toggleInventory, closeInventory, openInventory } from './inventorySlice';

const banana = { id: 'banana-1', name: 'Banana', description: 'A banana', sprite: 'banana.png' };
const beer = { id: 'beer-1', name: 'Beer', description: 'A beer', sprite: 'beer.png' };

describe('inventorySlice', () => {
  it('starts empty and closed', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ items: [], isOpen: false });
  });

  it('adds a new item with quantity 1', () => {
    const state = reducer(undefined, addItem(banana));
    expect(state.items).toEqual([{ ...banana, quantity: 1 }]);
  });

  it('increments quantity when adding an item already held', () => {
    let state = reducer(undefined, addItem(banana));
    state = reducer(state, addItem(banana));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('decrements quantity, then removes the item at zero', () => {
    let state = reducer(undefined, addItem(banana));
    state = reducer(state, addItem(banana));
    state = reducer(state, removeItem('banana-1'));
    expect(state.items[0].quantity).toBe(1);
    state = reducer(state, removeItem('banana-1'));
    expect(state.items).toEqual([]);
  });

  it('ignores removing an item that is not held', () => {
    const state = reducer(undefined, addItem(banana));
    expect(reducer(state, removeItem('nope'))).toEqual(state);
  });

  it('restoreInventory replaces items exactly, keeping saved quantities', () => {
    let state = reducer(undefined, addItem(beer));
    state = reducer(state, restoreInventory([{ ...banana, quantity: 3 }]));
    expect(state.items).toEqual([{ ...banana, quantity: 3 }]);
  });

  it('restoreInventory is idempotent', () => {
    const saved = [{ ...banana, quantity: 1 }];
    let state = reducer(undefined, restoreInventory(saved));
    state = reducer(state, restoreInventory(saved));
    expect(state.items).toEqual(saved);
  });

  it('opens, closes and toggles', () => {
    let state = reducer(undefined, openInventory());
    expect(state.isOpen).toBe(true);
    state = reducer(state, closeInventory());
    expect(state.isOpen).toBe(false);
    state = reducer(state, toggleInventory());
    expect(state.isOpen).toBe(true);
  });
});
