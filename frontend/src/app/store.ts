import { configureStore, combineReducers, type UnknownAction } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import sessionReducer from "../features/session/sessionSlice";
import analyticsReducer from "../features/analytics/analyticsSlice";
import gamificationReducer from "../features/gamification/gamificationSlice";

const appReducer = combineReducers({
    auth: authReducer,
    session: sessionReducer,
    analytics: analyticsReducer,
    gamification: gamificationReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) => {
    if (action.type === "auth/logout/fulfilled" || action.type === "auth/logout/rejected") {
        // Reset all other slices to initial state upon logout, keeping only auth state
        state = {
            auth: state?.auth,
        } as unknown as ReturnType<typeof appReducer>;
    }
    return appReducer(state, action);
};

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;

export const store = configureStore({
    reducer: rootReducer,
    devTools: import.meta.env.MODE !== "production",
});