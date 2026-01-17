import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isOpen: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem: (state, action) => {
      const itemIndex = state.items.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        if (state.items[itemIndex].quantity > 1) {
          state.items[itemIndex].quantity -= 1;
        } else {
          state.items.splice(itemIndex, 1);
        }
      }
    },
    toggleInventory: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeInventory: (state) => {
      state.isOpen = false;
    },
    openInventory: (state) => {
      state.isOpen = true;
    },
  },
});

export const { addItem, removeItem, toggleInventory, closeInventory, openInventory } = inventorySlice.actions;
export default inventorySlice.reducer;
