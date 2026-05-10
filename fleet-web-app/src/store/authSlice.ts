// ─────────────────────────────────────────────────────────────
//  Auth slice — cookie-based (NO localStorage, NO token in JS)
//
//  Tokens live exclusively in httpOnly cookies managed by the
//  browser and the backend. JavaScript never touches them.
// ─────────────────────────────────────────────────────────────
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once the /user/me bootstrap has resolved (success or failure).
   *  Route guards must wait for this before making redirect decisions. */
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set after a successful login or /user/me verify. */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initialized = true;
      state.loading = false;
      state.error = null;
    },
    /** Full wipe — use after logout or any auth rejection. */
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, resetAuth, setLoading, setError } = authSlice.actions;

// Backward-compat alias so any remaining clearUser() calls still compile.
export const clearUser = resetAuth;

export default authSlice.reducer;
