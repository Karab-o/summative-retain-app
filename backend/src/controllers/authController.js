import { z } from 'zod';
import { signToken } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** POST /api/auth/register - create a regular user account. */
export async function register(req, res) {
  const data = registerSchema.parse(req.body);

  if (await User.exists({ email: data.email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Public sign-up always creates a regular user; admins are provisioned separately.
  const user = await User.create({ ...data, role: ROLES.USER });
  res.status(201).json({ token: signToken(user), user });
}

/** POST /api/auth/login - exchange credentials for a JWT. */
export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user });
}

/** GET /api/auth/me - the currently authenticated user. */
export async function me(req, res) {
  res.json({ user: req.user });
}
