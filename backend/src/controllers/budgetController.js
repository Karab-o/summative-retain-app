import { z } from 'zod';
import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';
import { getBudgetSummary } from '../services/spendingService.js';
import { ApiError } from '../utils/ApiError.js';
import { buildBudgetSummary } from '../utils/budget.js';
import { monthKey } from '../utils/validation.js';

const budgetSchema = z.object({
  amount: z.coerce
    .number({ error: 'Budget must be a number' })
    .min(0, 'Budget cannot be negative')
    .max(1_000_000_000, 'Budget is too large')
    .transform((n) => Math.round(n * 100) / 100),
});

/**
 * GET /api/budgets
 * All budgets the user has set, newest month first, each with its spending summary.
 */
export async function listBudgets(req, res) {
  const budgets = await Budget.find({ user: req.user._id }).sort({ month: -1 }).limit(24);
  if (budgets.length === 0) return res.json([]);

  const spentByMonth = await Expense.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
  ]);
  const spentMap = new Map(spentByMonth.map((row) => [row._id, row.total]));

  res.json(budgets.map((b) => buildBudgetSummary(b.month, b.amount, spentMap.get(b.month) ?? 0)));
}

/** GET /api/budgets/:month - budget summary for one month (works even if no budget is set). */
export async function getBudget(req, res) {
  const month = monthKey.parse(req.params.month);
  res.json(await getBudgetSummary(req.user._id, month));
}

/** PUT /api/budgets/:month - create or update the budget for a month. */
export async function upsertBudget(req, res) {
  const month = monthKey.parse(req.params.month);
  const { amount } = budgetSchema.parse(req.body);

  await Budget.findOneAndUpdate(
    { user: req.user._id, month },
    { $set: { amount }, $setOnInsert: { user: req.user._id, month } },
    { upsert: true, runValidators: true },
  );

  res.json(await getBudgetSummary(req.user._id, month));
}

/** DELETE /api/budgets/:month - remove the budget for a month. */
export async function deleteBudget(req, res) {
  const month = monthKey.parse(req.params.month);
  const result = await Budget.deleteOne({ user: req.user._id, month });
  if (result.deletedCount === 0) throw new ApiError(404, 'No budget set for this month');
  res.json(await getBudgetSummary(req.user._id, month));
}
