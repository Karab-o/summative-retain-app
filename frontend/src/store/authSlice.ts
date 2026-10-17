import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResponse, User } from '../api/types';
import { readJSON } from './storage';

export const AUTH_STORAGE_KEY = 'retain.auth';

export interface AuthState {
  token: string | null;
  user: User | null;
  /** Set when the API rejected the stored token, so the sign-in page can explain why. */
  sessionExpired: boolean;
}

const stored = readJSON<AuthResponse>(AUTH_STORAGE_KEY);

const initialState: AuthState = {
  token: stored?.token ?? null,
  user: stored?.user ?? null,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(state, action: PayloadAction<AuthResponse>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.sessionExpired = false;
    },
    userRefreshed(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
      state.sessionExpired = false;
    },
    sessionExpired(state) {
      state.token = null;
      state.user = null;
      state.sessionExpired = true;
    },
  },
});

export const { credentialsReceived, userRefreshed, loggedOut, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
