export const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

export const PAYMENT_METHODS = Object.freeze([
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'mobile_money',
  'other',
]);

export const DEFAULT_CATEGORY_NAME = 'Uncategorized';

/** Spending at or above this share of the budget is reported as "approaching". */
export const BUDGET_WARNING_THRESHOLD = 0.8;

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#ef6c00', description: 'Groceries, restaurants and takeaway' },
  { name: 'Transport', color: '#1e88e5', description: 'Fuel, public transport, ride-hailing' },
  { name: 'Housing', color: '#6d4c41', description: 'Rent, mortgage and repairs' },
  { name: 'Utilities', color: '#00897b', description: 'Electricity, water, internet, phone' },
  { name: 'Entertainment', color: '#8e24aa', description: 'Movies, events, subscriptions' },
  { name: 'Shopping', color: '#d81b60', description: 'Clothing, electronics and general shopping' },
  { name: 'Health', color: '#43a047', description: 'Medical, pharmacy, fitness' },
  { name: 'Education', color: '#3949ab', description: 'Courses, books and school fees' },
  { name: 'Travel', color: '#00acc1', description: 'Flights, hotels and holidays' },
];
