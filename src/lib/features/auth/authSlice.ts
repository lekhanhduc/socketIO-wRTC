import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, TokenVerificationResponse, SignInRequest, SignInResponse } from '@/types/auth';
import { authApi } from '@/lib/api';

const initialState: AuthState = {
    isAuthenticated: false,
    userId: null,
    authorities: [],
    isLoading: false,
    error: null,
};

// Async thunk for login
export const loginAsync = createAsyncThunk(
    'auth/login',
    async (credentials: SignInRequest, { rejectWithValue }) => {
        try {
            // Bước 1: Đăng nhập để lấy access token
            const loginResponse = await authApi.login(credentials);

            // Lưu tokens vào localStorage
            localStorage.setItem('accessToken', loginResponse.accessToken);
            if (loginResponse.refreshToken) {
                localStorage.setItem('refreshToken', loginResponse.refreshToken);
            }

            // Bước 2: Verify token để lấy userId và authorities
            const verificationResult = await authApi.verifyToken(loginResponse.accessToken);

            return {
                accessToken: loginResponse.accessToken,
                refreshToken: loginResponse.refreshToken,
                userId: verificationResult.userId,
                authorities: verificationResult.authorities || [],
                userType: loginResponse.userType,
                tokenType: loginResponse.tokenType
            };
        } catch (error) {
            // Xóa token nếu có lỗi
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
        }
    }
);

// Async thunk for token verification
export const verifyToken = createAsyncThunk(
    'auth/verifyToken',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No token found');
            }

            const result = await authApi.verifyToken(token);
            return result as TokenVerificationResponse;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ userId: string; authorities: string[] }>) => {
            state.isAuthenticated = true;
            state.userId = action.payload.userId;
            state.authorities = action.payload.authorities;
            state.error = null;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.userId = null;
            state.authorities = [];
            state.error = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login async thunk
            .addCase(loginAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.userId = action.payload.userId || null;
                state.authorities = action.payload.authorities || [];
                state.error = null;

            })
            .addCase(loginAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.userId = null;
                state.authorities = [];
                state.error = action.payload as string;
            })
            // Verify token async thunk
            .addCase(verifyToken.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyToken.fulfilled, (state, action: PayloadAction<any>) => {
                state.isLoading = false;

                if (action.payload.valid) {
                    state.isAuthenticated = true;
                    state.userId = action.payload.userId || null;
                    state.authorities = action.payload.authorities || [];
                } else {
                    state.isAuthenticated = false;
                    state.userId = null;
                    state.authorities = [];
                }
            })
            .addCase(verifyToken.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.userId = null;
                state.authorities = [];
                state.error = action.payload as string;
            });
    },
});

export const { login, logout, clearError } = authSlice.actions;
export { loginAsync, verifyToken };
export default authSlice.reducer;