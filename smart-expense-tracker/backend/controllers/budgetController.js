const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure NodeMailer transporter (using environment config in .env)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

// @desc    Get user budgets comparing limit vs. actual spending
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    // Find all budgets for this month
    const budgets = await Budget.find({
      user: req.user._id,
      month: currentMonth,
      year: currentYear,
    }).populate('category', 'name color icon');

    // Calculate actual expenses for each category in this month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const expenseSummary = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    // Format final actual-spent comparison array
    const comparisonData = budgets.map((b) => {
      const actualRecord = expenseSummary.find(
        (e) => e._id.toString() === b.category._id.toString()
      );
      const totalSpent = actualRecord ? actualRecord.totalSpent : 0;
      const percentUsed = b.limit > 0 ? (totalSpent / b.limit) * 100 : 0;

      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        warningThreshold: b.warningThreshold,
        criticalThreshold: b.criticalThreshold,
        month: b.month,
        year: b.year,
        totalSpent,
        percentUsed,
      };
    });

    res.status(200).json({
      success: true,
      count: comparisonData.length,
      data: comparisonData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set or update a budget limit for a category
// @route   POST /api/budgets
// @access  Private
const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { category: categoryId, limit, warningThreshold, criticalThreshold, month, year } = req.body;

    if (!categoryId || !limit) {
      res.status(400);
      throw new Error('Please select a category and specify budget limit');
    }

    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Try finding existing budget to update (enforcing compound unique R-BUD-1 index)
    let budget = await Budget.findOne({
      user: req.user._id,
      category: categoryId,
      month: currentMonth,
      year: currentYear,
    });

    if (budget) {
      // Update existing limit
      budget.limit = limit;
      if (warningThreshold) budget.warningThreshold = warningThreshold;
      if (criticalThreshold) budget.criticalThreshold = criticalThreshold;
      await budget.save();
    } else {
      // Create new budget configuration
      budget = await Budget.create({
        user: req.user._id,
        category: categoryId,
        limit,
        warningThreshold: warningThreshold || 0.8,
        criticalThreshold: criticalThreshold || 1.0,
        month: currentMonth,
        year: currentYear,
      });
    }

    const populatedBudget = await Budget.findById(budget._id).populate('category', 'name color icon');

    res.status(200).json({
      success: true,
      data: populatedBudget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom budget limit
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404);
      throw new Error('Budget configuration not found');
    }

    // Verify ownership
    if (budget.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this budget limit');
    }

    await Budget.deleteOne({ _id: budget._id });

    res.status(200).json({
      success: true,
      message: 'Budget category successfully deleted',
      id: budget._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Helper to check category expenses vs budget and send warning/critical alerts (R-BUD-4, R-BUD-5)
const checkBudgetsAndAlert = async (userId, categoryId, transactionDate, incomingAmount = 0) => {
  try {
    const txDate = new Date(transactionDate);
    const month = txDate.getMonth() + 1;
    const year = txDate.getFullYear();

    // Fetch user and budget limit
    const user = await User.findById(userId);
    const budget = await Budget.findOne({ user: userId, category: categoryId, month, year }).populate(
      'category',
      'name'
    );

    if (!budget) return null; // No budget set for this category/month

    // Calculate all expenses for this month in this category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenseTotal = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          category: categoryId,
          type: 'expense',
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Sum total spent (including the transaction just recorded)
    const baseSpent = expenseTotal.length > 0 ? expenseTotal[0].total : 0;
    const totalSpent = baseSpent + incomingAmount;
    const percentUsed = totalSpent / budget.limit;

    let alertTriggered = false;
    let alertType = null;
    let message = '';

    // Check thresholds: Critical (>=100%) vs Warning (>=80%)
    if (percentUsed >= budget.criticalThreshold) {
      alertTriggered = true;
      alertType = 'critical';
      message = `CRITICAL ALERT: Your spending for '${budget.category.name}' has reached ${totalSpent.toFixed(
        2
      )} (${(percentUsed * 100).toFixed(0)}% of your monthly limit of ${budget.limit.toFixed(2)}).`;

      // Trigger Email Notification for Critical Limit (R-BUD-5)
      await sendCriticalEmail(user, budget.category.name, totalSpent, budget.limit, percentUsed);
    } else if (percentUsed >= budget.warningThreshold) {
      alertTriggered = true;
      alertType = 'warning';
      message = `WARNING ALERT: Your spending for '${budget.category.name}' is approaching its limit. You have spent ${totalSpent.toFixed(
        2
      )} (${(percentUsed * 100).toFixed(0)}% of your monthly limit of ${budget.limit.toFixed(2)}).`;
    }

    return {
      alertTriggered,
      alertType,
      message,
      limit: budget.limit,
      totalSpent,
      percentUsed: percentUsed * 100,
      categoryName: budget.category.name,
    };
  } catch (error) {
    console.error('Budget threshold trigger error:', error.message);
    return null;
  }
};

// Send critical alert email helper via Nodemailer
const sendCriticalEmail = async (user, categoryName, totalSpent, limit, percentUsed) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'alerts@smart-expense-tracker.com',
      to: user.email,
      subject: `[CRITICAL ALERT] Budget Limit Exceeded - ${categoryName}`,
      text: `Hi ${user.name},\n\nThis is an automated alert from your Smart Expense Tracker Web System.\n\nYou have exceeded your monthly budget for '${categoryName}'.\n\n- Monthly Budget Limit: $${limit.toFixed(
        2
      )}\n- Total Spending: $${totalSpent.toFixed(2)}\n- Percentage Used: ${(percentUsed * 100).toFixed(
        0
      )}%\n\nPlease review your recent transactions on the dashboard to maintain financial discipline.\n\nBest regards,\nYour Personal Finance Assistant`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f1f1; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f43f5e; border-bottom: 2px solid #f43f5e; padding-bottom: 10px;">Budget Limit Exceeded!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>This is an automated alert from your <strong>Smart Expense Tracker Web System</strong>.</p>
          <p>You have reached a critical spending threshold for the category: <strong>${categoryName}</strong>.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #f43f5e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #4b5563;">Monthly Budget Limit:</td>
                <td style="text-align: right; font-weight: bold; color: #1f2937;">$${limit.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #4b5563;">Total Monthly Spending:</td>
                <td style="text-align: right; font-weight: bold; color: #f43f5e;">$${totalSpent.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #4b5563;">Percentage Utilized:</td>
                <td style="text-align: right; font-weight: bold; color: #f43f5e;">${(percentUsed * 100).toFixed(0)}%</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Please log into your expense tracker dashboard to inspect your transactions ledger and maintain healthy spending limits.
          </p>
          <p style="border-top: 1px solid #f1f1f1; padding-top: 15px; margin-top: 25px; color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated academic system notification. Do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Critical Email Sent: ${info.messageId}`);
  } catch (error) {
    console.error('Nodemailer SMTP failed:', error.message);
  }
};

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  checkBudgetsAndAlert,
};
