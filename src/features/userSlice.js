import {createSlice, createAsyncThunk}  from '@reduxjs/toolkit'
import { act } from 'react';


export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    const data =  response.json();

    return data;
}) 

const userSlice = createSlice({
    name : 'users',

    initialState : {
        users : [],
        apiUsers : [],
        loading : false,
        error : null
    },

    reducers : {
        addUser : (state, action) => {
            state.users.push(action.payload);
        }
    },

    extraReducers : (builder) => {
        builder.addCase(fetchUsers.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchUsers.fulfilled, (state, action) => {
            state.loading = false;
            // state.apiUsers.push(action.payload)
            state.apiUsers = action.payload;
        })
        .addCase(fetchUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const { addUser } = userSlice.actions;

export default userSlice.reducer;