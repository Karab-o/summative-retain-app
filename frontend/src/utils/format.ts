import type { BudgetStatus, PaymentMethod } from '../api/types';

export const CURRENCY = import.meta.env.VITE_CURRENCY || 'USD';

const moneyFormat = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY });
const compactMoneyFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
});
// Expense dates are stored as UTC midnight, so they must be displayed in UTC to avoid shifting a day.
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortMonthFormat = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });

export const formatMoney = (value: number) => moneyFormat.format(value);
export const formatCompactMoney = (value: number) => compactMoneyFormat.format(value);
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
export const formatPercent = (value: number) => `${Math.round(value)}%`;

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the user's time zone as YYYY-MM-DD. */
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The current month in the user's time zone as YYYY-MM. */
export function currentMonthKey(): string {
  return todayKey().slice(0, 7);
}

/** Moves a YYYY-MM key by a number of months. */
export function shiftMonthKey(month: string, offset: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

const monthToDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

/** "2026-10" -> "October 2026" */
export const formatMonth = (month: string) => monthFormat.format(monthToDate(month));
/** "2026-10" -> "Oct" */
export const formatShortMonth = (month: string) => shortMonthFormat.format(monthToDate(month));

/** ISO date from the API -> YYYY-MM-DD for <input type="date">. */
export const toDateInput = (iso: string) => iso.slice(0, 10);

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'other', label: 'Other' },
];

const paymentLabels = new Map(PAYMENT_METHODS.map((p) => [p.value, p.label]));
export const paymentLabel = (method: PaymentMethod) => paymentLabels.get(method) ?? method;

export const BUDGET_STATUS: Record<BudgetStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  within: { label: 'On track', color: 'success' },
  approaching: { label: 'Approaching limit', color: 'warning' },
  over: { label: 'Over budget', color: 'error' },
  no_budget: { label: 'No budget set', color: 'default' },
};
