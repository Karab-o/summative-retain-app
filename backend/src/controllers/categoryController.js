import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { getDefaultCategory } from '../services/categoryService.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/budget.js';
import { objectId } from '../utils/validation.js';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(40, 'Name must be at most 40 characters'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #1e88e5')
    .optional(),
  description: z.string().trim().max(200, 'Description must be at most 200 characters').optional(),
});

const sortCategories = { isDefault: -1, name: 1 };

async function findCategory(id) {
  const category = await Category.findById(objectId.parse(id));
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

/** GET /api/categories - every category (available to all signed-in users). */
export async function listCategories(_req, res) {
  const categories = await Category.find().sort(sortCategories).collation({ locale: 'en' });
  res.json(categories);
}

/** GET /api/categories/stats - categories with platform-wide usage (admin). */
export async function listCategoriesWithStats(_req, res) {
  const [categories, usage] = await Promise.all([
    Category.find().sort(sortCategories).collation({ locale: 'en' }),
    Expense.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
  ]);
  const usageMap = new Map(usage.map((u) => [u._id.toString(), u]));

  res.json(
    categories.map((c) => ({
      ...c.toJSON(),
      expenseCount: usageMap.get(c.id)?.count ?? 0,
      totalAmount: round2(usageMap.get(c.id)?.total ?? 0),
    })),
  );
}

/** POST /api/categories (admin) */
export async function createCategory(req, res) {
  const data = categorySchema.parse(req.body);
  const category = await Category.create(data);
  res.status(201).json(category);
}

/** PUT /api/categories/:id (admin) - the default category may be recoloured but not renamed. */
export async function updateCategory(req, res) {
  const category = await findCategory(req.params.id);
  const data = categorySchema.partial().parse(req.body);

  if (category.isDefault && data.name !== undefined && data.name !== category.name) {
    throw new ApiError(400, `The default "${category.name}" category cannot be renamed`);
  }

  Object.assign(category, data);
  await category.save();
  res.json(category);
}

/**
 * DELETE /api/categories/:id (admin)
 * Expenses using the deleted category are reassigned to the default
 * "Uncategorized" category so no user data is lost.
 */
export async function deleteCategory(req, res) {
  const category = await findCategory(req.params.id);
  if (category.isDefault) {
    throw new ApiError(400, 'The default category cannot be deleted');
  }

  const fallback = await getDefaultCategory();
  const { modifiedCount } = await Expense.updateMany({ category: category._id }, { $set: { category: fallback._id } });
  await category.deleteOne();

  res.json({
    message: `Category "${category.name}" deleted. ${modifiedCount} expense(s) moved to "${fallback.name}".`,
    id: category.id,
    reassignedCount: modifiedCount,
    reassignedTo: fallback,
  });
}
