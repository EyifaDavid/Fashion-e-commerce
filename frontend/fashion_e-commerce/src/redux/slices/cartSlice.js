import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [], // each item will have id, name, price, image, quantity, and countInStock
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.cartItems.find((x) => x.id === item.id);

      if (existingItem) {
        if (existingItem.quantity < item.countInStock) {
          existingItem.quantity += 1;
        }
      } else {
        state.cartItems.push({ ...item, quantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x.id !== action.payload);
    },
    incrementQuantity: (state, action) => {
      const item = state.cartItems.find((x) => x.id === action.payload);
      if (item && item.quantity < item.countInStock) {
        item.quantity += 1;
      }
    },
    decrementQuantity: (state, action) => {
      const item = state.cartItems.find((x) => x.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
