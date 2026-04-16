import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import authApi from "../../services/authApi";
import type { AuthState, User } from "../../types/user";

const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const initialState: AuthState = {
    user: user ?? null,
    isError: false,
    message: "",
    isSuccess: false,
    isLoading: false,
    token: user?.token ?? null,
    isProfileLoading: false,
    isAuthenticated: !!user,
};

/**
 * Registers a new user.
 */
export const register = createAsyncThunk<User, User, { rejectValue: string }>(
    "auth/register",
    async (user, thunkAPI) => {
        try {
            const response = await authApi.post<User>(`register`, user);
            if (response.data) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Logins an existing user.
 */
export const login = createAsyncThunk<User, User, { rejectValue: string }>(
    "auth/login",
    async (user, thunkAPI) => {
        try {
            const response = await authApi.post<User>(`login`, user);
            if (response.data) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Authenticates via Google OAuth.
 */
export const googleLogin = createAsyncThunk<User, string, { rejectValue: string }>(
    "auth/googleLogin",
    async (token, thunkAPI) => {
        try {
            const response = await authApi.post<User>(`google`, { token });
            if (response.data) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Logs out the current user and clears local persistence.
 */
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
    "auth/logout",
    async (_, thunkAPI) => {
        try {
            localStorage.removeItem("user");
            try {
                await authApi.post(`logout`);
            } catch {
                // Ignore API error on logout if endpoint doesn't exist
            }
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Updates the user's profile information.
 */
export const updateProfile = createAsyncThunk<User, User, { rejectValue: string; state: { auth: AuthState } }>(
    "auth/update",
    async (user, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user?.token;
            const response = await authApi.put<User>(`profile`, user);
            if (response.data) {
                const updatedUser: User = { ...response.data, token: token || "" };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                return updatedUser;
            }
            return response.data;
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message ?? error.message : String(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
            state.isProfileLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => { state.isLoading = true; })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload ?? "An error occurred";
                state.user = null;
            })
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.isProfileLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isProfileLoading = false;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload ?? "An error occurred";
                state.isProfileLoading = false;
            })
            .addCase(login.pending, (state) => { state.isLoading = true; })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload ?? "An error occurred";
                state.user = null;
            })
            .addCase(googleLogin.pending, (state) => { state.isLoading = true; })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload ?? "An error occurred";
                state.user = null;
            })
            .addCase(logout.pending, (state) => { state.isLoading = true; })
            .addCase(logout.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logout.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload ?? "An error occurred";
            });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;