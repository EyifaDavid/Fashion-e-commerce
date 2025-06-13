import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
console.log("Loaded BASE_URL:", BASE_URL); // ✅ should show in the browser console

"http://localhost:5000/api"
"https://fashion-e-commerce-huig.onrender.com"

const baseQuery = fetchBaseQuery({baseUrl: BASE_URL +"/api", credentials:'include'
})



export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: (builder)=>({}),
});