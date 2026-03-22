import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import type { SessionState, Session, SocketUpdatePayload } from "../../types/session";

const API_URL = `${import.meta.env.VITE_API_URL}/sessions`;

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

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
)

const initialState: SessionState = {
    sessions: [],
    activeSession: null,
    isGenerating: false,
    isError: false,
    message: "",
    isLoading: false,
};

export const getSession = createAsyncThunk<Session[], void, { rejectValue: string }>(
    "session/getAll",
    async (_, thunkAPI) => {
        try {
            const response = await api.get<Session[]>(`/`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const createSession = createAsyncThunk<Session, Record<string, unknown>, { rejectValue: string }>(
    "session/create",
    async (sessionData: Record<string, unknown>, thunkAPI) => {
        try {
            const response = await api.post<Session>(`/`, sessionData);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const getSessionById = createAsyncThunk<Session, string, { rejectValue: string }>(
    "session/getOne",
    async (sessionId: string, thunkAPI) => {
        try {
            const response = await api.get<Session>(`/${sessionId}`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const deleteSession = createAsyncThunk<Session, string, { rejectValue: string }>(
    "session/delete",
    async (sessionId: string, thunkAPI) => {
        try {
            const response = await api.delete<Session>(`/${sessionId}`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const submitAnswer = createAsyncThunk<Session, { sessionId: string; formData: FormData }, { rejectValue: string }>(
    "session/submitAnswer",
    async ({ sessionId, formData }, thunkAPI) => {
        try {
            const response = await api.post<Session>(`/${sessionId}/submit-answer`, formData);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const endSession = createAsyncThunk<Session, string, { rejectValue: string }>(
    "session/endSession",
    async (sessionId: string, thunkAPI) => {
        try {
            const response = await api.post<Session>(`/${sessionId}/end`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || axiosError.message || String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
)

export const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        reset: () => initialState,
        socketUpdateSession: (state, action: PayloadAction<SocketUpdatePayload>) => {
            const { sessionId, status, message, session } = action.payload;
            state.message = message;
            
            if (!Array.isArray(state.sessions)) {
                state.sessions = [];
            }
            
            if (!session && state.activeSession && state.activeSession?._id === sessionId) {
                const qMatch = message.match(/Q\d+/);
                if (qMatch) {
                    const qIndex = parseInt(qMatch[1]) - 1;
                    if (status.includes('AI_')) {
                        state.activeSession.questions[qIndex].isSubmitted = true;
                    }
                }
            }

            // Handle generation status updates
            const upperStatus = (status || "").toUpperCase();
            const isFinished = upperStatus.includes("READY") || upperStatus.includes("FAILED") || upperStatus.includes("ERROR") || upperStatus.includes("COMPLETED");
            const hasError = upperStatus.includes("FAILED") || upperStatus.includes("ERROR");

            if (isFinished) {
                state.isGenerating = false;
                if (hasError) {
                    state.isError = true;
                    state.message = message || "Operation failed";
                }
            }

            if (session) {
                if (state.activeSession && state.activeSession._id === sessionId) {
                    state.activeSession = session;
                }
                const index = state.sessions.findIndex((s) => s._id === sessionId);
                if (index !== -1) {
                    state.sessions[index] = session;
                } else if (upperStatus.includes("READY") || upperStatus.includes("COMPLETED")) {
                    state.sessions.unshift(session);
                }
            }
        },
        setActiveSession: (state, action: PayloadAction<Session>) => {
            state.activeSession = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSession.fulfilled, (state, action) => {
                state.isLoading = false;
                const payload = action.payload as unknown;
                // Handle both { session: [] } and direct []
                if (payload && typeof payload === 'object' && 'session' in payload && Array.isArray(payload.session)) {
                    state.sessions = payload.session as Session[];
                } else {
                    state.sessions = Array.isArray(action.payload) ? action.payload : [];
                }
            })
            .addCase(getSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to get sessions";
            })
            .addCase(createSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isGenerating = true;
                if (!Array.isArray(state.sessions)) {
                    state.sessions = [];
                }
                const payload = action.payload as unknown;
                // Only push if it looks like a full session object
                if (payload && typeof payload === 'object' && ('_id' in payload || 'role' in payload)) {
                    state.sessions.unshift(payload as Session);
                }
            })
            .addCase(createSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to create session";
            })
            .addCase(getSessionById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSessionById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activeSession = action.payload;
            })
            .addCase(getSessionById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to get session";
            })
            .addCase(deleteSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSession.fulfilled, (state, action) => {
                state.isLoading = false;
                const sessions = Array.isArray(state.sessions) ? state.sessions : [];
                state.sessions = sessions.filter((session) => session._id !== action.payload._id);
            })
            .addCase(deleteSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to delete session";
            })
            .addCase(submitAnswer.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(submitAnswer.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activeSession = action.payload;
            })
            .addCase(submitAnswer.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to submit answer";
            })
            .addCase(endSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(endSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activeSession = action.payload;
            })
            .addCase(endSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to end session";
            })
    }
})

export const { reset, socketUpdateSession, setActiveSession } = sessionSlice.actions;
export default sessionSlice.reducer;