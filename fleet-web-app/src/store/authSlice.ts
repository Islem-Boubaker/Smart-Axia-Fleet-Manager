// ─────────────────────────────────────────────────────────────
//  Auth slice — cookie-based (NO localStorage, NO token in JS)
//
//  This slice only tracks the user profile and UI state.
//  Tokens live exclusively in httpOnly cookies managed by the
//  browser and the backend — JavaScript never touches them.
// ─────────────────────────────────────────────────────────────
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called after successful login or /user/me fetch */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    /** Called after logout or failed refresh */
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
