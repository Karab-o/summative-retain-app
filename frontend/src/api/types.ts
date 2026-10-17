/** Types mirroring the Retain API responses. */

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The subset of category fields populated on expenses. */
export type CategoryRef = Pick<Category, 'id' | 'name' | 'color' | 'isDefault'>;

export interface CategoryWithStats extends Category {
  expenseCount: number;
  totalAmount: number;
}

export interface CategoryInput {
  name: string;
  color: string;
  description: string;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'mobile_money' | 'other';

export interface Expense {
  id: string;
  user: string;
  title: string;
  amount: number;
  category: CategoryRef | null;
  /** UTC midnight of the day the expense happened (ISO string). */
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  /** null means "Uncategorized". */
  category: string | null;
  /** YYYY-MM-DD */
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export type ExpenseSortField = 'date' | 'amount' | 'title' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseQuery {
  search?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: ExpenseSortField;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseList {
  data: Expense[];
  pagination: Pagination;
  /** Sum of every expense matching the filters (not just the current page). */
  totalAmount: number;
}

export type BudgetStatus = 'no_budget' | 'within' | 'approaching' | 'over';

export interface BudgetSummary {
  /** YYYY-MM */
  month: string;
  amount: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
}

export interface CategorySpending {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface Dashboard {
  month: string;
  totalSpent: number;
  expenseCount: number;
  averageExpense: number;
  budget: BudgetSummary;
  highestExpense: Expense | null;
  spendingByCategory: CategorySpending[];
  recentExpenses: Expense[];
  dailySpending: { day: number; total: number }[];
  monthlyTrend: { month: string; total: number }[];
}

export interface CategoryUsage {
  categoryId: string;
  name: string;
  color: string;
  isDefault: boolean;
  count: number;
  total: number;
}

export interface AdminExpense extends Omit<Expense, 'user'> {
  user: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface AdminInsights {
  month: string;
  totalUsers: number;
  usersByRole: Partial<Record<Role, number>>;
  totalExpenses: number;
  totalValue: number;
  expensesThisMonth: number;
  spendingPerCategory: CategoryUsage[];
  topCategories: CategoryUsage[];
  bottomCategories: CategoryUsage[];
  recentExpenses: AdminExpense[];
  recentUsers: User[];
}
