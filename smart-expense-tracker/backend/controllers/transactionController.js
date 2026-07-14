const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { checkBudgetsAndAlert } = require('./budgetController'); // Helper to trigger budget check on new transactions

// @desc    Get all transactions with sorting, filtering, and pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, sort, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id, isDeleted: false };

    // Apply Filter: Type (income or expense)
    if (type) query.type = type;

    // Apply Filter: Category
    if (category) query.category = category;

    // Apply Filter: Date Range (ISO String format)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Determine Sorting Options (Default: Date descending)
    let sortBy = { date: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortBy = {};
      sortBy[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    // Pagination Parameters
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('category', 'name color icon')
      .sort(sortBy)
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transaction (income or expense)
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category: categoryId, date, description, paymentMethod, notes } = req.body;

    if (!amount || !type || !categoryId) {
      res.status(400);
      throw new Error('Please enter amount, transaction type, and select a category');
    }

    if (amount <= 0) {
      res.status(400);
      throw new Error('Transaction amount must be a positive number');
    }

    const txDate = date ? new Date(date) : new Date();
    if (txDate > new Date()) {
      res.status(400);
      throw new Error('Transaction date cannot be in the future');
    }

    // Verify Category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404);
      throw new Error('Associated category not found');
    }

    // R-INC-8: Duplicate prevention check within a 5-minute window for identical amount + category
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const potentialDuplicate = await Transaction.findOne({
      user: req.user._id,
      amount,
      category: categoryId,
      type,
      isDeleted: false,
      date: { $gte: fiveMinutesAgo },
    });

    if (potentialDuplicate) {
      res.status(409); // Conflict status
      throw new Error(
        'Duplicate entry warning: An identical transaction with the same amount and category was recorded within the last 5 minutes.'
      );
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type,
      category: categoryId,
      date: txDate,
      description,
      paymentMethod: paymentMethod || 'cash',
      notes,
    });

    // Populate category reference for front-end rendering
    const populatedTransaction = await Transaction.findById(transaction._id).populate(
      'category',
      'name color icon'
    );

    // If Transaction is an expense, check budget thresholds
    let budgetAlert = null;
    if (type === 'expense') {
      const alertDetails = await checkBudgetsAndAlert(req.user._id, categoryId, txDate, amount);
      if (alertDetails && alertDetails.alertTriggered) {
        budgetAlert = alertDetails;
      }
    }

    res.status(201).json({
      success: true,
      data: populatedTransaction,
      alert: budgetAlert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    // Check ownership
    if (transaction.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to modify this transaction');
    }

    const { amount, category: categoryId, date, description, paymentMethod, notes } = req.body;

    if (amount && amount <= 0) {
      res.status(400);
      throw new Error('Transaction amount must be a positive number');
    }

    if (date) {
      const txDate = new Date(date);
      if (txDate > new Date()) {
        res.status(400);
        throw new Error('Transaction date cannot be in the future');
      }
      transaction.date = txDate;
    }

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        res.status(404);
        throw new Error('Associated category not found');
      }
      transaction.category = categoryId;
    }

    if (amount) transaction.amount = amount;
    if (description) transaction.description = description;
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes) transaction.notes = notes;

    const updatedTransaction = await transaction.save();

    const populatedTransaction = await Transaction.findById(updatedTransaction._id).populate(
      'category',
      'name color icon'
    );

    // Recalculate budgets on update if transaction is an expense
    let budgetAlert = null;
    if (transaction.type === 'expense') {
      const alertDetails = await checkBudgetsAndAlert(req.user._id, transaction.category, transaction.date, 0);
      if (alertDetails && alertDetails.alertTriggered) {
        budgetAlert = alertDetails;
      }
    }

    res.status(200).json({
      success: true,
      data: populatedTransaction,
      alert: budgetAlert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    // Verify ownership
    if (transaction.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this transaction');
    }

    // Perform soft delete as per R-SAFE-1 & R-INC-7
    transaction.isDeleted = true;
    transaction.deletedAt = Date.now();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction successfully deleted',
      id: transaction._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions ledger to CSV format
// @route   GET /api/transactions/export
// @access  Private
const exportTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
      isDeleted: false,
    })
      .populate('category', 'name')
      .sort({ date: -1 });

    let csvContent = 'Date,Type,Amount,Category,Payment Method,Description,Notes\n';

    transactions.forEach((tx) => {
      const dateStr = new Date(tx.date).toISOString().split('T')[0];
      const categoryName = tx.category ? tx.category.name : 'Uncategorized';
      // Escape commas in description/notes
      const desc = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : '';
      const notesStr = tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '';

      csvContent += `${dateStr},${tx.type},${tx.amount},${categoryName},${tx.paymentMethod},${desc},${notesStr}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=transactions_${req.user._id}_${Date.now()}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import transactions via parsed CSV data array
// @route   POST /api/transactions/import
// @access  Private
const importTransactions = async (req, res, next) => {
  try {
    const { records } = req.body; // Array of transaction objects parsed from client-side CSV parser

    if (!records || !Array.isArray(records)) {
      res.status(400);
      throw new Error('Invalid bulk records format. Expected JSON array of transactions.');
    }

    const importedRecords = [];
    const errors = [];

    // Pre-fetch all user active categories to speed up matching
    const userCategories = await Category.find({
      $or: [{ user: null }, { user: req.user._id }],
      isActive: true,
    });

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        const amount = parseFloat(rec.amount);
        const type = rec.type ? rec.type.toLowerCase() : '';
        const categoryName = rec.category ? rec.category.trim() : '';

        // Validation checks
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Record ${i + 1}: Amount must be a positive decimal`);
        }

        if (type !== 'income' && type !== 'expense') {
          throw new Error(`Record ${i + 1}: Type must be 'income' or 'expense'`);
        }

        // Match category
        let matchedCategory = userCategories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase() && c.type === type
        );

        // If category is not found, fallback to 'Other' or create default
        if (!matchedCategory) {
          matchedCategory = userCategories.find(
            (c) => c.name.toLowerCase() === 'other' && c.type === type
          );

          if (!matchedCategory) {
            // Create a custom category for other if missing
            matchedCategory = await Category.create({
              name: 'Other',
              type,
              color: type === 'income' ? '#10b981' : '#f43f5e',
              icon: 'HelpCircle',
              user: req.user._id,
            });
            // Update cached categories
            userCategories.push(matchedCategory);
          }
        }

        const dateStr = rec.date ? new Date(rec.date) : new Date();
        if (isNaN(dateStr.getTime())) {
          throw new Error(`Record ${i + 1}: Invalid transaction date`);
        }

        const newTx = await Transaction.create({
          user: req.user._id,
          amount,
          type,
          category: matchedCategory._id,
          date: dateStr,
          description: rec.description || `Imported Record #${i + 1}`,
          paymentMethod: rec.paymentMethod || 'cash',
          notes: rec.notes || '',
        });

        importedRecords.push(newTx);
      } catch (err) {
        errors.push(err.message);
      }
    }

    res.status(200).json({
      success: true,
      importedCount: importedRecords.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  importTransactions,
};
