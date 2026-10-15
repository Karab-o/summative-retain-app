/**
 * Date helpers. All dates are handled in UTC: an expense dated "2026-10-12" is
 * stored as 2026-10-12T00:00:00.000Z so it never shifts across time zones.
 */

export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** @returns {string} the current month as "YYYY-MM" (UTC). */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Converts "YYYY-MM-DD" to a UTC midnight Date. */
export function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Adds whole days to a UTC date. */
export function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/** @returns {{ start: Date, end: Date }} half-open [start, end) range for "YYYY-MM". */
export function monthRange(month) {
  const [year, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, m - 1, 1)),
    end: new Date(Date.UTC(year, m, 1)),
  };
}

/** Returns the "YYYY-MM" key that is `offset` months away from `month`. */
export function shiftMonth(month, offset) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}

/** Number of days in the given "YYYY-MM" month. */
export function daysInMonth(month) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}
