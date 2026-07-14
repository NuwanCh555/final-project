const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category for the budget'],
  },
  limit: {
    type: Number,
    required: [true, 'Please add a monthly budget limit'],
    min: [0.01, 'Limit must be greater than 0'],
  },
  warningThreshold: {
    type: Number,
    default: 0.8, // 80% warning alert
    min: [0.1, 'Threshold must be at least 10%'],
    max: [1.0, 'Threshold cannot exceed 100%'],
  },
  criticalThreshold: {
    type: Number,
    default: 1.0, // 100% critical alert
    min: [0.1, 'Threshold must be at least 10%'],
    max: [2.0, 'Threshold cannot exceed 200%'],
  },
  month: {
    type: Number,
    required: true,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12'],
  },
  year: {
    type: Number,
    required: true,
    min: [2000, 'Year must be valid'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Enforce unique budget per user, category, month, and year
BudgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
