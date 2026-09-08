import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

"http://localhost:5000/api"
"https://fashion-e-commerce-huig.onrender.com"

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL + "/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    // Bearer token fallback for clients where the httpOnly cookie isn't sent
    // (mobile/ITP). The cookie remains the primary mechanism when present.
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
})



export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: (builder)=>({}),
});