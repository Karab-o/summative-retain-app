import mongoose from 'mongoose';
import { MONTH_REGEX } from '../utils/dates.js';
import { toJSONOptions } from '../utils/toJSON.js';

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Calendar month the budget applies to, e.g. "2026-10".
    month: { type: String, required: true, match: MONTH_REGEX },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// One budget per user per month.
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
