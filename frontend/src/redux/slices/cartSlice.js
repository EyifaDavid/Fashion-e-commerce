import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../config';

const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    // If the token is invalid or expired
    if (response.status === 401) {
      toast.error('Session expired. Please login again.');

      // Optional: clear stored auth info
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      await fetch(`${API_BASE_URL}/users/logout`, { method: 'POST', credentials: 'include' });

      // Redirect after a delay
      setTimeout(() => {
        window.location.href = '/log-in';
      }, 2000);

      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong');
    }

    return await response.json();
  } catch (err) {
    toast.error(err.message || 'An error occurred');
    throw err;
  }
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const data = await fetchWithAuth('/api/cart');
    return data.items || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, thunkAPI) => {
    try {
      const response = await fetchWithAuth('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });


      if (!response.items) {
        throw new Error('Invalid response: Missing items');
      }

      return response.items; // <-- Return only the items array
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);



export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`/api/cart/${productId}`, {
        method: 'DELETE',
      });
      return response.items; // assuming backend sends updated items array
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const incrementQuantity = createAsyncThunk('cart/incrementQuantity', async (productId, { rejectWithValue }) => {
  try {
    const data = await fetchWithAuth('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    return data.items;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const decrementQuantity = createAsyncThunk('cart/decrementQuantity', async (productId, { rejectWithValue }) => {
  try {
    const data = await fetchWithAuth('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: -1 }),
    });
    return data.items;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cartItems: [], status: 'idle', error: null },
  reducers: {
    incrementQuantityLocally: (state, action) => {
      const productId = action.payload;
      const item = state.cartItems.find(i => i.product._id === productId);
      if (item) item.quantity += 1;
    },
    decrementQuantityLocally: (state, action) => {
      const productId = action.payload;
      const item = state.cartItems.find(i => i.product._id === productId);
      if (item && item.quantity > 1) item.quantity -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cartItems = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cartItems = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cartItems = action.payload;
      })
      .addCase(incrementQuantity.fulfilled, (state, action) => {
        state.cartItems = action.payload;
      })
      .addCase(decrementQuantity.fulfilled, (state, action) => {
        state.cartItems = action.payload;
      });
  },
});

export const {
  incrementQuantityLocally,
  decrementQuantityLocally,

} = cartSlice.actions;
export default cartSlice.reducer;
