import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthProvider, User } from '@/features/auth/types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  provider: AuthProvider | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  provider: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.provider = null;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setProvider(state, action: PayloadAction<AuthProvider | null>) {
      state.provider = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setProvider,
  setError,
  clearError,
} = authSlice.actions;
export default authSlice.reducer;