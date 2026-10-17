import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as admin from '../controllers/adminController.js';
import * as auth from '../controllers/authController.js';
import * as budgets from '../controllers/budgetController.js';
import * as categories from '../controllers/categoryController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as expenses from '../controllers/expenseController.js';
import { authorize, protect } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const adminOnly = [protect, authorize(ROLES.ADMIN)];

// Slow down brute-force attempts on the auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes' },
});

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);

// Expenses (owned by the signed-in user)
router.get('/expenses', protect, expenses.listExpenses);
router.post('/expenses', protect, expenses.createExpense);
router.get('/expenses/:id', protect, expenses.getExpense);
router.put('/expenses/:id', protect, expenses.updateExpense);
router.delete('/expenses/:id', protect, expenses.deleteExpense);

// Monthly budgets (owned by the signed-in user)
router.get('/budgets', protect, budgets.listBudgets);
router.get('/budgets/:month', protect, budgets.getBudget);
router.put('/budgets/:month', protect, budgets.upsertBudget);
router.delete('/budgets/:month', protect, budgets.deleteBudget);

// User dashboard
router.get('/dashboard', protect, dashboard.getDashboard);

// Categories: everyone can read, only admins can manage
router.get('/categories', protect, categories.listCategories);
router.get('/categories/stats', ...adminOnly, categories.listCategoriesWithStats);
router.post('/categories', ...adminOnly, categories.createCategory);
router.put('/categories/:id', ...adminOnly, categories.updateCategory);
router.delete('/categories/:id', ...adminOnly, categories.deleteCategory);

// Admin insights
router.get('/admin/insights', ...adminOnly, admin.getInsights);

export default router;
