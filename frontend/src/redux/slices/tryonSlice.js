import { createSlice } from "@reduxjs/toolkit";

// Session-scoped "model photo" for virtual try-on: the customer's photo is kept
// for the current visit only (an object URL string — nothing written to storage,
// nothing sent beyond the try-on request). Cleared when the tab closes.
// [NO PERSIST] Opting into durable storage later lives on the backend (see
// VTON_TRYON_PLAN.md §7) — this is purely client-side session memory.
const initialState = {
  modelPhotoUrl: null, // object URL of the person photo, reused across products
};

const tryonSlice = createSlice({
  name: "tryon",
  initialState,
  reducers: {
    saveModelPhoto: (state, action) => {
      state.modelPhotoUrl = action.payload;
    },
    clearModelPhoto: (state) => {
      state.modelPhotoUrl = null;
    },
  },
});

export const { saveModelPhoto, clearModelPhoto } = tryonSlice.actions;
export default tryonSlice.reducer;