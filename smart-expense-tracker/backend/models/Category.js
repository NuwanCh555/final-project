const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters'],
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify category type (income or expense)'],
  },
  color: {
    type: String,
    default: '#64748b', // Default neutral slate color
  },
  icon: {
    type: String,
    default: 'Tag', // Default standard icon name
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null indicates system-wide default category
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Enforce unique category names per type per user (or global)
CategorySchema.index({ name: 1, type: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
