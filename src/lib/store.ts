import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import type { AuthState } from '@/types/auth';

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
});

export type RootState = {
    auth: AuthState;
};

export type AppDispatch = typeof store.dispatch;