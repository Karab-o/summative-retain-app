import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer, { AUTH_STORAGE_KEY, credentialsReceived, loggedOut, sessionExpired, userRefreshed } from './authSlice';
import { writeJSON } from './storage';
import uiReducer, { THEME_STORAGE_KEY, themeModeChanged } from './uiSlice';

const listener = createListenerMiddleware();

// Persist the session so a page refresh keeps the user signed in.
listener.startListening({
  matcher: isAnyOf(credentialsReceived, userRefreshed, loggedOut, sessionExpired),
  effect: (_action, { getState }) => {
    const { token, user } = (getState() as RootState).auth;
    writeJSON(AUTH_STORAGE_KEY, token && user ? { token, user } : null);
  },
});

// Drop all cached data on sign-out so the next account never sees the previous one's data.
listener.startListening({
  matcher: isAnyOf(loggedOut, sessionExpired),
  effect: (_action, { dispatch }) => {
    dispatch(api.util.resetApiState());
  },
});

listener.startListening({
  actionCreator: themeModeChanged,
  effect: (action) => writeJSON(THEME_STORAGE_KEY, action.payload),
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
