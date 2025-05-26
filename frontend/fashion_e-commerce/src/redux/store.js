import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"
import {apiSlice} from "./slices/apiSlice"
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice'
import userReducer from './slices/userSlice'


const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
        cart: cartReducer,
        products: productReducer,
        users: userReducer,
    },
    middleware: (getDefaultMiddleware)=> getDefaultMiddleware().concat(apiSlice.middleware),
    devTools:true,
})


export default store