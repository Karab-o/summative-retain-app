import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../utils/constants.js';
import { toJSONOptions } from '../utils/toJSON.js';

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    // Stored as UTC midnight of the calendar day the expense happened.
    date: { type: Date, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ createdAt: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
