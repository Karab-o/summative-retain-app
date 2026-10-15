import mongoose from 'mongoose';
import { toJSONOptions } from '../utils/toJSON.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    color: { type: String, default: '#607d8b', match: /^#[0-9a-fA-F]{6}$/ },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    // The fallback category ("Uncategorized") that expenses are moved to when
    // their category is deleted. It cannot be renamed or deleted.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// Case-insensitive unique names ("Food" and "food" are the same category).
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Category = mongoose.model('Category', categorySchema);
