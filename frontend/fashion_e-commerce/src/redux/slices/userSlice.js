import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allUsers: [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      joinedAt: "2024-05-01",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Customer",
      joinedAt: "2024-05-10",
    },
    { id: 3, name: "Alice Johnson", email: "alice@example.com", role:"Customer", },
  ],
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.allUsers.push({ id: Date.now(), ...action.payload });
    },
    // Add delete/edit actions later
  },
});

export const { addUser } = userSlice.actions;
export default userSlice.reducer;
