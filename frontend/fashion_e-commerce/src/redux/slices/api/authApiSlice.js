import { apiSlice } from "../apiSlice"

const AUTH_URL ="/users"


export const authApiSlice= apiSlice.injectEndpoints({
    endpoints: (builder)=> ({
        login: builder.mutation({
            query: (data)=> ({
                url:`${AUTH_URL}/login`,
                method:"POST",
                body: data,
            }),
        }),
        verify: builder.mutation({
            query: (data) => ({
                url: `${AUTH_URL}/verify`,
                method: "POST",
                body: data,
                credentials: "include",  // Good!
            }),
            }),
        register: builder.mutation({
            query: (data)=> ({
                url:`${AUTH_URL}/register`,
                method:"POST",
                body: data,
            }),
        }),
        logout: builder.mutation({
            query: (data)=> ({
                url:`${AUTH_URL}/logout`,
                method:"POST",
            }),
        }),
    }),
});


export const {useLoginMutation,useRegisterMutation,useLogoutMutation,useVerifyMutation}=authApiSlice
