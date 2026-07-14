const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const Category = require('./models/Category');
const path = require('path');

// Load environment configuration variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware Settings
app.use(cors({ origin: '*' })); // Allow open access (useful for cross-domain academic testing)
app.use(express.json());

// Serve static profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Seeding standard default categories (R-INC-2, R-EXP-2) on database connect
const seedDefaultCategories = async () => {
  try {
    const defaultIncome = ['Salary', 'Bonus', 'Freelance', 'Investment', 'Gift', 'Other'];
    const defaultExpenses = [
      'Food',
      'Transport',
      'Bills',
      'Entertainment',
      'Healthcare',
      'Education',
      'Shopping',
      'Rent',
      'Other',
    ];

    const currentCount = await Category.countDocuments({ user: null });
    if (currentCount === 0) {
      console.log('Seeding default categories in MongoDB...');
      
      const incomeCategories = defaultIncome.map((name) => ({
        name,
        type: 'income',
        color: name === 'Salary' ? '#10b981' : name === 'Freelance' ? '#34d399' : '#a7f3d0',
        icon: name === 'Salary' ? 'Briefcase' : 'Coins',
        user: null,
      }));

      const expenseCategories = defaultExpenses.map((name) => ({
        name,
        type: 'expense',
        color:
          name === 'Food'
            ? '#f43f5e'
            : name === 'Rent'
            ? '#e11d48'
            : name === 'Bills'
            ? '#fb923c'
            : '#fda4af',
        icon:
          name === 'Food'
            ? 'Utensils'
            : name === 'Rent'
            ? 'Home'
            : name === 'Bills'
            ? 'FileText'
            : 'Tag',
        user: null,
      }));

      await Category.insertMany([...incomeCategories, ...expenseCategories]);
      console.log('Successfully seeded default income and expense categories!');
    }
  } catch (error) {
    console.error('Error seeding default categories:', error.message);
  }
};

// Seed categories after connections stabilize
setTimeout(seedDefaultCategories, 3000);

// Basic API Heath Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Expense Tracker Web API is active and functional',
    timestamp: new Date(),
  });
});

// Import API Routing files
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

// Mount API Endpoint router layers
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

// General route error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
