import { z } from 'zod';
import { DATE_REGEX, MONTH_REGEX } from './dates.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const dateOnly = z.string().regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format');
export const monthKey = z.string().regex(MONTH_REGEX, 'Month must be in YYYY-MM format');

/** Drops empty query-string values (e.g. "?category=") before validation. */
export function cleanQuery(query) {
  return Object.fromEntries(
    Object.entries(query ?? {}).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  );
}

/** Escapes user input so it can be safely used inside a RegExp. */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
