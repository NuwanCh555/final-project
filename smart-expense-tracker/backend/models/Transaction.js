const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive transaction amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify transaction type (income or expense)'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate a category'],
  },
  date: {
    type: Date,
    required: [true, 'Please add a transaction date'],
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, 'Description cannot be more than 255 characters'],
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital'],
    default: 'cash',
  },
  receiptUrl: {
    type: String,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters'],
  },
  isDeleted: {
    type: Boolean,
    default: false, // Supports soft delete requirements
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for quick sorting and list filters
TransactionSchema.index({ user: 1, isDeleted: 1, date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
