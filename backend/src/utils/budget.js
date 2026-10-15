import { BUDGET_WARNING_THRESHOLD } from './constants.js';

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Builds the budget summary shared by the budget and dashboard endpoints.
 * status: "no_budget" | "within" | "approaching" | "over"
 */
export function buildBudgetSummary(month, budgetAmount, spent) {
  const hasBudget = typeof budgetAmount === 'number';
  if (!hasBudget) {
    return { month, amount: null, spent: round2(spent), remaining: null, percentUsed: null, status: 'no_budget' };
  }

  const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : spent > 0 ? 100 : 0;
  let status = 'within';
  if (spent > budgetAmount) status = 'over';
  else if (percentUsed >= BUDGET_WARNING_THRESHOLD * 100) status = 'approaching';

  return {
    month,
    amount: round2(budgetAmount),
    spent: round2(spent),
    remaining: round2(budgetAmount - spent),
    percentUsed: round2(percentUsed),
    status,
  };
}

export { round2 };
