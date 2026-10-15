import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler. Every error response has the shape
 * `{ message: string, details?: { field: string, message: string }[] }`.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode ?? err.status ?? 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    message = details[0] ? `${details[0].field ? `${details[0].field}: ` : ''}${details[0].message}` : message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message ?? 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    message = `A record with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProduction) message = 'Internal server error';
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
}
