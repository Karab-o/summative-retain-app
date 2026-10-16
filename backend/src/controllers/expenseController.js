import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { getDefaultCategory } from '../services/categoryService.js';
import { ApiError } from '../utils/ApiError.js';
import { PAYMENT_METHODS } from '../utils/constants.js';
import { addDays, parseDateOnly } from '../utils/dates.js';
import { cleanQuery, dateOnly, escapeRegex, objectId } from '../utils/validation.js';

const CATEGORY_FIELDS = 'name color isDefault';

const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is too large')
  .transform((n) => Math.round(n * 100) / 100);

const notes = z.string().trim().max(500, 'Notes must be at most 500 characters');

const expenseFields = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  amount,
  // null / omitted means "Uncategorized".
  category: objectId.nullable().optional(),
  date: dateOnly,
  paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Select a valid payment method' }),
  notes: notes.optional(),
});

const createSchema = expenseFields.extend({ notes: notes.optional().default('') });
const updateSchema = expenseFields.partial();

const listQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    category: objectId.optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['date', 'amount', 'title', 'createdAt']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((q) => !q.startDate || !q.endDate || q.startDate <= q.endDate, {
    message: 'Start date must be before end date',
    path: ['startDate'],
  })
  .refine((q) => q.minAmount === undefined || q.maxAmount === undefined || q.minAmount <= q.maxAmount, {
    message: 'Minimum amount must be less than maximum amount',
    path: ['minAmount'],
  });

/** Resolves the category to use, falling back to "Uncategorized". */
async function resolveCategory(categoryId) {
  if (!categoryId) return (await getDefaultCategory())._id;
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw new ApiError(400, 'Selected category does not exist');
  return categoryId;
}

/** Loads an expense owned by the current user, or 404s (never leaks other users' data). */
async function findOwnExpense(req) {
  const id = objectId.parse(req.params.id);
  const expense = await Expense.findOne({ _id: id, user: req.user._id }).populate('category', CATEGORY_FIELDS);
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
}

/**
 * GET /api/expenses
 * Paginated list of the current user's expenses with search, filters and sorting.
 */
export async function listExpenses(req, res) {
  const q = listQuerySchema.parse(cleanQuery(req.query));
  const filter = { user: req.user._id };

  if (q.search) {
    const pattern = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ title: pattern }, { notes: pattern }];
  }
  if (q.category) filter.category = q.category;
  if (q.paymentMethod) filter.paymentMethod = q.paymentMethod;
  if (q.startDate || q.endDate) {
    filter.date = {};
    if (q.startDate) filter.date.$gte = parseDateOnly(q.startDate);
    if (q.endDate) filter.date.$lt = addDays(parseDateOnly(q.endDate), 1);
  }
  if (q.minAmount !== undefined || q.maxAmount !== undefined) {
    filter.amount = {};
    if (q.minAmount !== undefined) filter.amount.$gte = q.minAmount;
    if (q.maxAmount !== undefined) filter.amount.$lte = q.maxAmount;
  }

  const direction = q.order === 'asc' ? 1 : -1;
  const sort = { [q.sortBy]: direction, createdAt: direction, _id: direction };

  const [items, total, totals] = await Promise.all([
    Expense.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('category', CATEGORY_FIELDS),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
  ]);

  res.json({
    data: items,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    },
    totalAmount: Math.round((totals[0]?.sum ?? 0) * 100) / 100,
  });
}

/** GET /api/expenses/:id */
export async function getExpense(req, res) {
  res.json(await findOwnExpense(req));
}

/** POST /api/expenses */
export async function createExpense(req, res) {
  const data = createSchema.parse(req.body);
  const expense = await Expense.create({
    ...data,
    date: parseDateOnly(data.date),
    category: await resolveCategory(data.category),
    user: req.user._id,
  });
  await expense.populate('category', CATEGORY_FIELDS);
  res.status(201).json(expense);
}

/** PUT /api/expenses/:id */
export async function updateExpense(req, res) {
  const expense = await findOwnExpense(req);
  const data = updateSchema.parse(req.body);

  if (data.title !== undefined) expense.title = data.title;
  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.paymentMethod !== undefined) expense.paymentMethod = data.paymentMethod;
  if (data.notes !== undefined) expense.notes = data.notes;
  if (data.date !== undefined) expense.date = parseDateOnly(data.date);
  if (data.category !== undefined) expense.category = await resolveCategory(data.category);

  await expense.save();
  await expense.populate('category', CATEGORY_FIELDS);
  res.json(expense);
}

/** DELETE /api/expenses/:id */
export async function deleteExpense(req, res) {
  const expense = await findOwnExpense(req);
  await expense.deleteOne();
  res.json({ message: 'Expense deleted', id: expense.id });
}
