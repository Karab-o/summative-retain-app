import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ExpenseQuery, ExpenseSortField, PaymentMethod, SortOrder } from '../api/types';
import type { RootState } from './index';

export const PAGE_SIZES = [10, 25, 50];

/** Search, filter, sort and pagination state for the expenses list. */
export interface ExpenseFiltersState {
  search: string;
  /** Category id, or '' for all categories. */
  category: string;
  paymentMethod: PaymentMethod | '';
  /** YYYY-MM-DD, or '' for no bound. */
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxAmount: number | null;
  sortBy: ExpenseSortField;
  order: SortOrder;
  page: number;
  limit: number;
}

const initialState: ExpenseFiltersState = {
  search: '',
  category: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  minAmount: null,
  maxAmount: null,
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: PAGE_SIZES[0],
};

const expenseFiltersSlice = createSlice({
  name: 'expenseFilters',
  initialState,
  // Every change to what is shown jumps back to the first page.
  reducers: {
    searchChanged(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    categoryChanged(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 1;
    },
    paymentMethodChanged(state, action: PayloadAction<PaymentMethod | ''>) {
      state.paymentMethod = action.payload;
      state.page = 1;
    },
    dateRangeChanged(state, action: PayloadAction<Partial<Pick<ExpenseFiltersState, 'startDate' | 'endDate'>>>) {
      Object.assign(state, action.payload);
      state.page = 1;
    },
    amountRangeChanged(state, action: PayloadAction<Partial<Pick<ExpenseFiltersState, 'minAmount' | 'maxAmount'>>>) {
      Object.assign(state, action.payload);
      state.page = 1;
    },
    /** Sorts by a column; choosing the active column again flips the direction. */
    sortChanged(state, action: PayloadAction<ExpenseSortField>) {
      state.order = state.sortBy === action.payload && state.order === 'desc' ? 'asc' : 'desc';
      state.sortBy = action.payload;
      state.page = 1;
    },
    pageChanged(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    pageSizeChanged(state, action: PayloadAction<number>) {
      state.limit = PAGE_SIZES.includes(action.payload) ? action.payload : PAGE_SIZES[0];
      state.page = 1;
    },
    /** Clears search and filters but keeps the chosen sort order and page size. */
    filtersCleared(state) {
      return { ...initialState, sortBy: state.sortBy, order: state.order, limit: state.limit };
    },
    /** Back to defaults, e.g. when another account signs in. */
    expenseFiltersReset() {
      return initialState;
    },
  },
});

export const {
  searchChanged,
  categoryChanged,
  paymentMethodChanged,
  dateRangeChanged,
  amountRangeChanged,
  sortChanged,
  pageChanged,
  pageSizeChanged,
  filtersCleared,
  expenseFiltersReset,
} = expenseFiltersSlice.actions;

export default expenseFiltersSlice.reducer;

export const selectExpenseFilters = (state: RootState) => state.expenseFilters;

/** The filters as API query parameters, with empty values left out. */
export const selectExpenseQuery = createSelector(
  selectExpenseFilters,
  (f): ExpenseQuery => ({
    search: f.search || undefined,
    category: f.category || undefined,
    paymentMethod: f.paymentMethod || undefined,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
    minAmount: f.minAmount ?? undefined,
    maxAmount: f.maxAmount ?? undefined,
    sortBy: f.sortBy,
    order: f.order,
    page: f.page,
    limit: f.limit,
  }),
);

/** How many of the date/amount filters (shown in the collapsible panel) are set. */
export const selectAdvancedFilterCount = createSelector(selectExpenseFilters, (f) =>
  [f.startDate, f.endDate, f.minAmount, f.maxAmount].filter((v) => v !== '' && v !== null).length,
);

export const selectHasActiveFilters = createSelector(
  selectExpenseFilters,
  selectAdvancedFilterCount,
  (f, advanced) => Boolean(f.search || f.category || f.paymentMethod) || advanced > 0,
);
