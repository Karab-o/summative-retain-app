import { z } from 'zod';
import { Expense } from '../models/Expense.js';
import { getBudgetSummary } from '../services/spendingService.js';
import { round2 } from '../utils/budget.js';
import { currentMonth, daysInMonth, monthRange, shiftMonth } from '../utils/dates.js';
import { cleanQuery, monthKey } from '../utils/validation.js';

const querySchema = z.object({ month: monthKey.optional() });
const TREND_MONTHS = 6;

/**
 * GET /api/dashboard?month=YYYY-MM
 * Everything the user dashboard needs for the selected month in one request.
 */
export async function getDashboard(req, res) {
  const month = querySchema.parse(cleanQuery(req.query)).month ?? currentMonth();
  const userId = req.user._id;
  const { start, end } = monthRange(month);
  const inMonth = { user: userId, date: { $gte: start, $lt: end } };
  const trendStart = monthRange(shiftMonth(month, -(TREND_MONTHS - 1))).start;

  const [budget, stats, highestExpense, byCategory, recentExpenses, daily, trend] = await Promise.all([
    getBudgetSummary(userId, month),
    Expense.aggregate([
      { $match: inMonth },
      { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$amount' } } },
    ]),
    Expense.findOne(inMonth).sort({ amount: -1, date: -1 }).populate('category', 'name color isDefault'),
    Expense.aggregate([
      { $match: inMonth },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
    ]),
    Expense.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(5).populate('category', 'name color isDefault'),
    Expense.aggregate([
      { $match: inMonth },
      { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: trendStart, $lt: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const dailyMap = new Map(daily.map((d) => [d._id, d.total]));
  const trendMap = new Map(trend.map((t) => [t._id, t.total]));

  res.json({
    month,
    totalSpent: budget.spent,
    expenseCount: stats[0]?.count ?? 0,
    averageExpense: round2(stats[0]?.average ?? 0),
    budget,
    highestExpense,
    spendingByCategory: byCategory.map((row) => ({
      categoryId: row._id?.toString() ?? null,
      name: row.category?.name ?? 'Deleted category',
      color: row.category?.color ?? '#9e9e9e',
      total: round2(row.total),
      count: row.count,
      percentage: budget.spent > 0 ? round2((row.total / budget.spent) * 100) : 0,
    })),
    recentExpenses,
    dailySpending: Array.from({ length: daysInMonth(month) }, (_, i) => ({
      day: i + 1,
      total: round2(dailyMap.get(i + 1) ?? 0),
    })),
    monthlyTrend: Array.from({ length: TREND_MONTHS }, (_, i) => {
      const key = shiftMonth(month, i - (TREND_MONTHS - 1));
      return { month: key, total: round2(trendMap.get(key) ?? 0) };
    }),
  });
}
