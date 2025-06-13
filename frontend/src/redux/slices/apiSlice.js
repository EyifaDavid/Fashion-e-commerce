import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

const API_URI = import.meta.env.VITE_APP_BASE_URL

"http://localhost:5000/api"
"https://fashion-e-commerce-huig.onrender.com"

const baseQuery = fetchBaseQuery({baseUrl: API_URI, credentials:'include'
})


export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: (builder)=>({}),
});