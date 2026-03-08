import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { SessionState } from "../../types/session";

const API_URL = `${import.meta.env.VITE_API_URL}/sessions/`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((request) => {
    const user = localStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;
    if (parsedUser) {
        request.headers.Authorization = `Bearer ${parsedUser.token}`;
    }
    return request;
});

const initialState: SessionState = {
    sessions: [],
    activeSession: null,
    isError: false,
    message: "",
    isLoading: false,
};

export const getSession = 