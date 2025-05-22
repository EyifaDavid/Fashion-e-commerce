import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [], // List of all products
  },
  reducers: {
    addProduct: (state, action) => {
      state.items.push(action.payload);
    },
    // Optional: add more reducers like removeProduct, updateProduct later
  },
});

export const { addProduct } = productSlice.actions;
export default productSlice.reducer;
