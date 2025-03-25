import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    :null,
}

const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        setCredentials : (state, action)=> {
            state.user = action.payload;
            localStorage.setItem("userInfo",JSON.stringify(action.payload))
        },
        logout: (state, action)=> {
            state.user = null;
            localStorage.removeItem("userInfo");
        },
    },
});



export const {
    setCredentials,logout
}= authSlice.actions


export default authSlice.reducer