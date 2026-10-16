import { Category } from '../models/Category.js';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_NAME } from '../utils/constants.js';

/** Returns the fallback "Uncategorized" category, creating it if needed. */
export async function getDefaultCategory() {
  return Category.findOneAndUpdate(
    { isDefault: true },
    { $setOnInsert: { name: DEFAULT_CATEGORY_NAME, color: '#9e9e9e', description: 'Expenses without a category', isDefault: true } },
    { upsert: true, returnDocument: 'after' },
  );
}

/** Ensures the default category exists and seeds a starter set on a fresh database. */
export async function ensureCategories() {
  await getDefaultCategory();
  const count = await Category.countDocuments({ isDefault: false });
  if (count === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log(`[bootstrap] Seeded ${DEFAULT_CATEGORIES.length} starter categories`);
  }
}
