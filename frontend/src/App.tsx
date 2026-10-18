import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import { GuestOnly, HomeRedirect, RequireAuth } from './components/layout/RouteGuards';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Signed-in pages are split into separate chunks so the sign-in page loads fast.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const AdminInsightsPage = lazy(() => import('./pages/admin/AdminInsightsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<RequireAuth roles={['user']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
          </Route>

          <Route path="/admin" element={<RequireAuth roles={['admin']} />}>
            <Route index element={<AdminInsightsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
