import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

const API_URI = import.meta.env.VITE_APP_BASE_URL || "https://fashion-e-commerce-huig.onrender.com";

const baseQuery = fetchBaseQuery({baseUrl: API_URI + "/api",  credentials:'include'
})


export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: (builder)=>({}),
});