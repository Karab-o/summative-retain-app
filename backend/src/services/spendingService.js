import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';
import { buildBudgetSummary } from '../utils/budget.js';
import { monthRange } from '../utils/dates.js';

/** Total amount a user spent in the given "YYYY-MM" month. */
export async function getMonthlySpent(userId, month) {
  const { start, end } = monthRange(month);
  const [result] = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result?.total ?? 0;
}

/** Budget summary (amount, spent, remaining, status) for a user and month. */
export async function getBudgetSummary(userId, month) {
  const [budget, spent] = await Promise.all([Budget.findOne({ user: userId, month }), getMonthlySpent(userId, month)]);
  return buildBudgetSummary(month, budget ? budget.amount : null, spent);
}
