import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { readJSON } from './storage';

export type ThemeMode = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'retain.theme';

function initialThemeMode(): ThemeMode {
  const stored = readJSON<ThemeMode>(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { themeMode: initialThemeMode() },
  reducers: {
    themeModeChanged(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
  },
});

export const { themeModeChanged } = uiSlice.actions;
export default uiSlice.reducer;
