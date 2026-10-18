import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/client';
import type {
  AdminInsights,
  AuthResponse,
  BudgetSummary,
  Category,
  CategoryInput,
  CategoryWithStats,
  Dashboard,
  Expense,
  ExpenseInput,
  ExpenseList,
  ExpenseQuery,
  LoginInput,
  RegisterInput,
  User,
} from '../api/types';

/** Anything derived from expenses must refresh when expenses change. */
const SPENDING_TAGS = ['Expense', 'Dashboard', 'Budget', 'CategoryStats', 'AdminInsights'] as const;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Expense', 'Dashboard', 'Budget', 'Category', 'CategoryStats', 'AdminInsights'],
  // Re-fetch when a screen is revisited after 30s so shared data (e.g. admin stats) stays fresh.
  refetchOnMountOrArgChange: 30,
  endpoints: (build) => ({
    // Auth
    login: build.mutation<AuthResponse, LoginInput>({
      query: (data) => ({ url: '/auth/login', method: 'POST', data }),
    }),
    register: build.mutation<AuthResponse, RegisterInput>({
      query: (data) => ({ url: '/auth/register', method: 'POST', data }),
    }),
    me: build.query<User, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: (response: { user: User }) => response.user,
    }),

    // Dashboard
    getDashboard: build.query<Dashboard, string>({
      query: (month) => ({ url: '/dashboard', params: { month } }),
      providesTags: ['Dashboard'],
    }),

    // Expenses
    getExpenses: build.query<ExpenseList, ExpenseQuery>({
      query: (params) => ({ url: '/expenses', params }),
      providesTags: ['Expense'],
    }),
    createExpense: build.mutation<Expense, ExpenseInput>({
      query: (data) => ({ url: '/expenses', method: 'POST', data }),
      invalidatesTags: [...SPENDING_TAGS],
    }),
    updateExpense: build.mutation<Expense, { id: string; data: Partial<ExpenseInput> }>({
      query: ({ id, data }) => ({ url: `/expenses/${id}`, method: 'PUT', data }),
      invalidatesTags: [...SPENDING_TAGS],
    }),
    deleteExpense: build.mutation<{ message: string; id: string }, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: [...SPENDING_TAGS],
    }),

    // Budgets
    getBudgets: build.query<BudgetSummary[], void>({
      query: () => ({ url: '/budgets' }),
      providesTags: ['Budget'],
    }),
    getBudget: build.query<BudgetSummary, string>({
      query: (month) => ({ url: `/budgets/${month}` }),
      providesTags: ['Budget'],
    }),
    saveBudget: build.mutation<BudgetSummary, { month: string; amount: number }>({
      query: ({ month, amount }) => ({ url: `/budgets/${month}`, method: 'PUT', data: { amount } }),
      invalidatesTags: ['Budget', 'Dashboard'],
    }),
    deleteBudget: build.mutation<BudgetSummary, string>({
      query: (month) => ({ url: `/budgets/${month}`, method: 'DELETE' }),
      invalidatesTags: ['Budget', 'Dashboard'],
    }),

    // Categories
    getCategories: build.query<Category[], void>({
      query: () => ({ url: '/categories' }),
      providesTags: ['Category'],
    }),
    getCategoryStats: build.query<CategoryWithStats[], void>({
      query: () => ({ url: '/categories/stats' }),
      providesTags: ['CategoryStats'],
    }),
    createCategory: build.mutation<Category, CategoryInput>({
      query: (data) => ({ url: '/categories', method: 'POST', data }),
      invalidatesTags: ['Category', 'CategoryStats', 'AdminInsights'],
    }),
    updateCategory: build.mutation<Category, { id: string; data: Partial<CategoryInput> }>({
      query: ({ id, data }) => ({ url: `/categories/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Category', 'CategoryStats', 'AdminInsights', 'Expense', 'Dashboard'],
    }),
    deleteCategory: build.mutation<{ message: string; reassignedCount: number }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'CategoryStats', 'AdminInsights', 'Expense', 'Dashboard'],
    }),

    // Admin
    getAdminInsights: build.query<AdminInsights, void>({
      query: () => ({ url: '/admin/insights' }),
      providesTags: ['AdminInsights'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useGetDashboardQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetBudgetsQuery,
  useGetBudgetQuery,
  useSaveBudgetMutation,
  useDeleteBudgetMutation,
  useGetCategoriesQuery,
  useGetCategoryStatsQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminInsightsQuery,
} = api;
