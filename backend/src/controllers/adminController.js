import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { User } from '../models/User.js';
import { round2 } from '../utils/budget.js';
import { currentMonth, monthRange } from '../utils/dates.js';

const RANK_SIZE = 5;
const RECENT_SIZE = 8;

/**
 * GET /api/admin/insights
 * Platform-wide statistics for the admin dashboard.
 */
export async function getInsights(_req, res) {
  const month = currentMonth();
  const { start, end } = monthRange(month);

  const [totalUsers, totals, expensesThisMonth, categories, usage, recentExpenses, recentUsers, usersByRole] =
    await Promise.all([
      User.countDocuments(),
      Expense.aggregate([{ $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } }]),
      // "Recorded during the current month" = created this month.
      Expense.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Category.find().collation({ locale: 'en' }).sort({ name: 1 }),
      Expense.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
      Expense.find()
        .sort({ createdAt: -1 })
        .limit(RECENT_SIZE)
        .populate('category', 'name color isDefault')
        .populate('user', 'name email'),
      User.find().sort({ createdAt: -1 }).limit(RECENT_SIZE),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

  const usageMap = new Map(usage.map((u) => [u._id.toString(), u]));

  // Includes categories that have never been used so "least used" is meaningful.
  const categoryStats = categories.map((c) => ({
    categoryId: c.id,
    name: c.name,
    color: c.color,
    isDefault: c.isDefault,
    count: usageMap.get(c.id)?.count ?? 0,
    total: round2(usageMap.get(c.id)?.total ?? 0),
  }));

  const byUsageDesc = [...categoryStats].sort((a, b) => b.count - a.count || b.total - a.total);
  const byUsageAsc = [...categoryStats].sort((a, b) => a.count - b.count || a.total - b.total);

  res.json({
    month,
    totalUsers,
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
    totalExpenses: totals[0]?.count ?? 0,
    totalValue: round2(totals[0]?.value ?? 0),
    expensesThisMonth,
    spendingPerCategory: [...categoryStats].sort((a, b) => b.total - a.total),
    topCategories: byUsageDesc.slice(0, RANK_SIZE),
    bottomCategories: byUsageAsc.slice(0, RANK_SIZE),
    recentExpenses,
    recentUsers,
  });
}
