import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { api } from './api';
import expenseFiltersReducer from './expenseFiltersSlice';
import { writeJSON } from './storage';
import uiReducer, { THEME_STORAGE_KEY, themeModeChanged } from './uiSlice';

const listener = createListenerMiddleware();

// Remember the chosen theme between visits.
listener.startListening({
  actionCreator: themeModeChanged,
  effect: (action) => writeJSON(THEME_STORAGE_KEY, action.payload),
});

// Authentication lives in AuthContext (see src/context/AuthContext.tsx).
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    expenseFilters: expenseFiltersReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
