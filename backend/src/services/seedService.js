import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { PAYMENT_METHODS, ROLES } from '../utils/constants.js';
import { currentMonth, daysInMonth, shiftMonth } from '../utils/dates.js';
import { ensureCategories } from './categoryService.js';

export const DEMO_ACCOUNTS = {
  admin: { name: 'Retain Admin', email: 'admin@retain.app', password: 'Admin@123' },
  user: { name: 'Demo User', email: 'demo@retain.app', password: 'Demo@123' },
};

const EXTRA_USERS = [
  { name: 'Amina Uwase', email: 'amina@example.com', password: 'Password@123' },
  { name: 'Jean Mugisha', email: 'jean@example.com', password: 'Password@123' },
];

const TEMPLATES = {
  'Food & Dining': [['Weekly groceries', 45, 120], ['Lunch with colleagues', 12, 30], ['Coffee', 3, 7], ['Pizza night', 18, 35], ['Farmers market', 15, 40]],
  Transport: [['Fuel top-up', 30, 70], ['Bus card recharge', 10, 25], ['Taxi ride', 8, 25]],
  Housing: [['Monthly rent', 650, 650], ['Plumbing repair', 40, 120]],
  Utilities: [['Electricity bill', 40, 90], ['Internet subscription', 35, 35], ['Water bill', 15, 30], ['Phone airtime', 10, 20]],
  Entertainment: [['Cinema tickets', 12, 30], ['Streaming subscription', 10, 16], ['Concert', 40, 90]],
  Shopping: [['New sneakers', 50, 120], ['Household supplies', 15, 45], ['Headphones', 60, 150]],
  Health: [['Pharmacy', 8, 40], ['Gym membership', 30, 30], ['Doctor visit', 40, 80]],
  Education: [['Online course', 15, 60], ['Books', 12, 40]],
  Travel: [['Weekend getaway hotel', 120, 260], ['Bus ticket upcountry', 15, 40]],
};

/** Small deterministic PRNG so seeded data is the same on every run. */
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

async function upsertUser({ name, email, password }, role) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, password, role });
}

/** Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD if it does not exist yet. */
export async function ensureEnvAdmin() {
  if (!env.adminEmail || !env.adminPassword) return;
  const user = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (!user) {
    await User.create({ name: env.adminName, email: env.adminEmail, password: env.adminPassword, role: ROLES.ADMIN });
    console.log(`[bootstrap] Created admin account ${env.adminEmail}`);
  } else if (user.role !== ROLES.ADMIN) {
    user.role = ROLES.ADMIN;
    await user.save();
    console.log(`[bootstrap] Promoted ${env.adminEmail} to admin`);
  }
}

function buildExpenses(userId, categories, random, months, perMonth) {
  const byName = new Map(categories.map((c) => [c.name, c]));
  const names = Object.keys(TEMPLATES).filter((n) => byName.has(n));
  const today = new Date().toISOString().slice(0, 10);
  const expenses = [];

  for (const month of months) {
    const lastDay = daysInMonth(month);
    // Rent is paid every month.
    if (byName.has('Housing')) {
      expenses.push({ user: userId, title: 'Monthly rent', amount: 650, category: byName.get('Housing')._id, date: new Date(`${month}-01T00:00:00Z`), paymentMethod: 'bank_transfer', notes: 'Paid by standing order' });
    }
    for (let i = 0; i < perMonth; i += 1) {
      const categoryName = names[Math.floor(random() * names.length)];
      const options = TEMPLATES[categoryName].filter(([title]) => title !== 'Monthly rent');
      const [title, min, max] = options[Math.floor(random() * options.length)];
      const day = String(1 + Math.floor(random() * lastDay)).padStart(2, '0');
      const date = `${month}-${day}`;
      if (date > today) continue; // never seed future expenses
      expenses.push({
        user: userId,
        title,
        amount: Math.round((min + random() * (max - min)) * 100) / 100,
        category: byName.get(categoryName)._id,
        date: new Date(`${date}T00:00:00Z`),
        paymentMethod: PAYMENT_METHODS[Math.floor(random() * (PAYMENT_METHODS.length - 1))],
        notes: random() > 0.7 ? 'Seeded sample expense' : '',
      });
    }
  }
  return expenses;
}

/**
 * Seeds demo accounts, categories, budgets and sample expenses.
 * @param {{ reset?: boolean }} options reset=true wipes all existing data first.
 */
export async function seedDemoData({ reset = false } = {}) {
  if (reset) {
    await Promise.all([User.deleteMany({}), Expense.deleteMany({}), Budget.deleteMany({}), Category.deleteMany({})]);
    console.log('[seed] Cleared existing data');
  }

  await ensureCategories();
  const categories = await Category.find({ isDefault: false });
  const random = createRandom(42);
  const thisMonth = currentMonth();
  const months = [3, 2, 1, 0].map((offset) => shiftMonth(thisMonth, -offset));

  await upsertUser(DEMO_ACCOUNTS.admin, ROLES.ADMIN);
  const demo = await upsertUser(DEMO_ACCOUNTS.user, ROLES.USER);
  const extras = [];
  for (const u of EXTRA_USERS) extras.push(await upsertUser(u, ROLES.USER));

  if ((await Expense.countDocuments({ user: demo._id })) === 0) {
    await Expense.insertMany(buildExpenses(demo._id, categories, random, months, 14));
    for (const [i, month] of months.entries()) {
      await Budget.updateOne({ user: demo._id, month }, { $set: { amount: [1200, 1100, 1300, 1250][i] } }, { upsert: true });
    }
  }
  for (const user of extras) {
    if ((await Expense.countDocuments({ user: user._id })) === 0) {
      await Expense.insertMany(buildExpenses(user._id, categories.slice(0, 5), random, months.slice(-2), 5));
    }
  }

  console.log(`[seed] Demo data ready (admin: ${DEMO_ACCOUNTS.admin.email}, user: ${DEMO_ACCOUNTS.user.email})`);
}
