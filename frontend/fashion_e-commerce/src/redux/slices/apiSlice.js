import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

const API_URI = "http://localhost:5000/api"

const baseQuery = fetchBaseQuery({baseUrl: API_URI, credentials:'include'
})


export const apiSlice = createApi ({
    baseQuery,
    tagTypes:['Product', 'Category', 'User','Order'],
    endpoints: (builder)=>({}),
});