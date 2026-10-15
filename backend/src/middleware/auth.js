import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/** Issues a signed JWT for the given user. */
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/**
 * Requires a valid "Authorization: Bearer <token>" header and attaches the
 * authenticated user to `req.user`. The user is re-loaded from the database so
 * role changes and deleted accounts take effect immediately.
 */
export async function protect(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'The account for this session no longer exists');

  req.user = user;
  next();
}

/** Restricts a route to users holding one of the given roles. Use after `protect`. */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}
