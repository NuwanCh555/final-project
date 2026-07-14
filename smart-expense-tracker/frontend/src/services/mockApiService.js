// Client-side high-fidelity MERN database simulator running on localStorage
// Allows offline, zero-config dynamic application operations.

const getStored = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setStored = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Seed default categories if localStorage is empty
const seedMockCategories = () => {
  const categories = getStored('mock_categories', []);
  if (categories.length === 0) {
    const defaultIncome = ['Salary', 'Bonus', 'Freelance', 'Investment', 'Gift', 'Other'];
    const defaultExpenses = ['Food', 'Transport', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Rent', 'Other'];

    const seeded = [];
    defaultIncome.forEach((name, idx) => {
      seeded.push({
        _id: `cat_inc_${idx}`,
        name,
        type: 'income',
        color: name === 'Salary' ? '#10b981' : name === 'Freelance' ? '#34d399' : '#a7f3d0',
        icon: name === 'Salary' ? 'Briefcase' : 'Coins',
        user: null,
        isActive: true,
      });
    });

    defaultExpenses.forEach((name, idx) => {
      seeded.push({
        _id: `cat_exp_${idx}`,
        name,
        type: 'expense',
        color: name === 'Food' ? '#f43f5e' : name === 'Rent' ? '#e11d48' : name === 'Bills' ? '#fb923c' : '#fda4af',
        icon: name === 'Food' ? 'Utensils' : name === 'Rent' ? 'Home' : name === 'Bills' ? 'FileText' : 'Tag',
        user: null,
        isActive: true,
      });
    });

    setStored('mock_categories', seeded);
  }
};

seedMockCategories();

// Global simulated network delay wrapper
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiService = {
  // --- AUTH SERVICES ---
  register: async (name, email, password) => {
    await delay(300);
    const users = getStored('mock_users', []);
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User account already registered with this email address');
    }

    const newUser = {
      _id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password, // In simulated storage, we mock hash matches
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setStored('mock_users', users);

    // Save active mock session token
    setStored('mock_token', `mock_jwt_token_${newUser._id}`);
    setStored('mock_currentUser', newUser);

    return {
      success: true,
      token: `mock_jwt_token_${newUser._id}`,
      user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    };
  },

  login: async (email, password) => {
    await delay(400);
    const users = getStored('mock_users', []);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('Invalid email or password credentials');
    }

    const user = users[userIndex];

    // Check Lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingMs = new Date(user.lockoutUntil) - Date.now();
      const remainingMin = Math.ceil(remainingMs / 1000 / 60);
      throw new Error(`Account temporarily locked. Try again in ${remainingMin} minute(s).`);
    }

    if (user.password === password) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      users[userIndex] = user;
      setStored('mock_users', users);

      setStored('mock_token', `mock_jwt_token_${user._id}`);
      setStored('mock_currentUser', user);

      return {
        success: true,
        token: `mock_jwt_token_${user._id}`,
        user: { _id: user._id, name: user.name, email: user.email },
      };
    } else {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        user.failedLoginAttempts = 0;
        users[userIndex] = user;
        setStored('mock_users', users);
        throw new Error('Maximum failed attempts reached. Your account has been temporarily locked for 15 minutes.');
      } else {
        users[userIndex] = user;
        setStored('mock_users', users);
        throw new Error(`Invalid credentials. You have ${5 - user.failedLoginAttempts} attempts remaining.`);
      }
    }
  },

  getProfile: async () => {
    await delay(100);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized, session missing');
    return { success: true, user: currentUser };
  },

  updateProfile: async (name, email, password) => {
    await delay(300);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized, session missing');

    const users = getStored('mock_users', []);
    const userIndex = users.findIndex(u => u._id === currentUser._id);

    if (userIndex !== -1) {
      const user = users[userIndex];
      user.name = name || user.name;
      user.email = email ? email.toLowerCase() : user.email;
      if (password) user.password = password;

      users[userIndex] = user;
      setStored('mock_users', users);
      setStored('mock_currentUser', user);

      return {
        success: true,
        user: { _id: user._id, name: user.name, email: user.email },
      };
    }
    throw new Error('User not found');
  },

  // --- CATEGORIES ---
  getCategories: async () => {
    await delay(100);
    const currentUser = getStored('mock_currentUser', null);
    const categories = getStored('mock_categories', []);

    // Filter: null (system defaults) or user specific custom categories
    const filtered = categories.filter(
      (c) => c.user === null || (currentUser && c.user === currentUser._id)
    ).filter(c => c.isActive !== false);

    return { success: true, count: filtered.length, data: filtered };
  },

  createCategory: async (name, type, color, icon) => {
    await delay(200);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const categories = getStored('mock_categories', []);

    // Check duplicate
    const conflict = categories.find(
      (c) =>
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.type === type &&
        (c.user === null || c.user === currentUser._id)
    );

    if (conflict) throw new Error('A category with this name already exists');

    const newCat = {
      _id: `cat_cust_${Date.now()}`,
      name: name.trim(),
      type,
      color: color || '#64748b',
      icon: icon || 'Tag',
      user: currentUser._id,
      isActive: true,
    };

    categories.push(newCat);
    setStored('mock_categories', categories);

    return { success: true, data: newCat };
  },

  deleteCategory: async (id) => {
    await delay(150);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const categories = getStored('mock_categories', []);
    const catIndex = categories.findIndex((c) => c._id === id);

    if (catIndex === -1) throw new Error('Category not found');
    if (!categories[catIndex].user) throw new Error('Default system categories cannot be deleted');

    // Check active transactions
    const transactions = getStored('mock_transactions', []);
    const refCount = transactions.filter(
      (t) => t.category === id && t.user === currentUser._id && !t.isDeleted
    ).length;

    if (refCount > 0) {
      throw new Error(`This category has ${refCount} active transactions. Re-categorize them first.`);
    }

    categories.splice(catIndex, 1);
    setStored('mock_categories', categories);

    return { success: true, message: 'Custom category successfully deleted', id };
  },

  // --- TRANSACTIONS ---
  getTransactions: async (filters = {}) => {
    await delay(150);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    let list = getStored('mock_transactions', []).filter(
      (t) => t.user === currentUser._id && !t.isDeleted
    );

    // Apply Filter: Type
    if (filters.type) {
      list = list.filter((t) => t.type === filters.type);
    }

    // Apply Filter: Category
    if (filters.category) {
      list = list.filter((t) => t.category === filters.category);
    }

    // Apply Filter: Date Range
    if (filters.startDate) {
      list = list.filter((t) => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      list = list.filter((t) => new Date(t.date) <= new Date(filters.endDate));
    }

    // Sort: Default descending date
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Populate Category
    const categories = getStored('mock_categories', []);
    const populated = list.map((t) => {
      const cat = categories.find((c) => c._id === t.category) || {
        name: 'Uncategorized',
        color: '#64748b',
        icon: 'Tag',
      };
      return { ...t, category: cat };
    });

    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 10);
    const skip = (page - 1) * limit;
    const paginated = populated.slice(skip, skip + limit);

    return {
      success: true,
      count: paginated.length,
      pagination: {
        page,
        limit,
        total: populated.length,
        pages: Math.ceil(populated.length / limit),
      },
      data: paginated,
    };
  },

  createTransaction: async (amount, type, categoryId, date, description, paymentMethod, notes) => {
    await delay(200);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const txDate = date ? new Date(date) : new Date();

    // R-INC-8: Duplicate check (5 minutes, identical category and amount)
    const txs = getStored('mock_transactions', []);
    const fiveMinutes = 5 * 60 * 1000;
    const isDuplicate = txs.find(
      (t) =>
        t.user === currentUser._id &&
        t.amount === parseFloat(amount) &&
        t.category === categoryId &&
        t.type === type &&
        !t.isDeleted &&
        Math.abs(new Date(t.date) - txDate) < fiveMinutes
    );

    if (isDuplicate) {
      throw new Error('Duplicate entry warning: Identical transaction was added within the last 5 minutes.');
    }

    const newTx = {
      _id: `tx_${Date.now()}`,
      user: currentUser._id,
      amount: parseFloat(amount),
      type,
      category: categoryId,
      date: txDate.toISOString(),
      description: description || '',
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    txs.push(newTx);
    setStored('mock_transactions', txs);

    const categories = getStored('mock_categories', []);
    const catDetails = categories.find((c) => c._id === categoryId) || { name: 'Expense', color: '#64748b' };
    const populated = { ...newTx, category: catDetails };

    // Check Budget limits for expenses
    let alertDetails = null;
    if (type === 'expense') {
      alertDetails = await mockApiService.checkBudgetAlerts(currentUser._id, categoryId, txDate.toISOString(), parseFloat(amount));
    }

    return { success: true, data: populated, alert: alertDetails };
  },

  updateTransaction: async (id, data) => {
    await delay(200);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const txs = getStored('mock_transactions', []);
    const idx = txs.findIndex((t) => t._id === id);

    if (idx === -1) throw new Error('Transaction not found');
    if (txs[idx].user !== currentUser._id) throw new Error('Unauthorized');

    const tx = txs[idx];
    if (data.amount) tx.amount = parseFloat(data.amount);
    if (data.category) tx.category = data.category;
    if (data.date) tx.date = new Date(data.date).toISOString();
    if (data.description) tx.description = data.description;
    if (data.paymentMethod) tx.paymentMethod = data.paymentMethod;
    if (data.notes) tx.notes = data.notes;

    txs[idx] = tx;
    setStored('mock_transactions', txs);

    const categories = getStored('mock_categories', []);
    const catDetails = categories.find((c) => c._id === tx.category) || { name: 'Expense', color: '#64748b' };
    const populated = { ...tx, category: catDetails };

    let alertDetails = null;
    if (tx.type === 'expense') {
      alertDetails = await mockApiService.checkBudgetAlerts(currentUser._id, tx.category, tx.date, 0);
    }

    return { success: true, data: populated, alert: alertDetails };
  },

  deleteTransaction: async (id) => {
    await delay(100);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const txs = getStored('mock_transactions', []);
    const idx = txs.findIndex((t) => t._id === id);

    if (idx === -1) throw new Error('Transaction not found');
    if (txs[idx].user !== currentUser._id) throw new Error('Unauthorized');

    txs[idx].isDeleted = true;
    txs[idx].deletedAt = new Date().toISOString();
    setStored('mock_transactions', txs);

    return { success: true, message: 'Transaction soft-deleted', id };
  },

  // --- BUDGET SERVICES ---
  getBudgets: async (month, year) => {
    await delay(150);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    const budgets = getStored('mock_budgets', []).filter(
      (b) => b.user === currentUser._id && b.month === m && b.year === y
    );

    // Calculate actual spent per category
    const txs = getStored('mock_transactions', []).filter(
      (t) =>
        t.user === currentUser._id &&
        t.type === 'expense' &&
        !t.isDeleted &&
        new Date(t.date).getMonth() + 1 === m &&
        new Date(t.date).getFullYear() === y
    );

    const categories = getStored('mock_categories', []);

    const data = budgets.map((b) => {
      const cat = categories.find((c) => c._id === b.category) || { name: 'Expense', color: '#64748b' };
      const catTransactions = txs.filter((t) => t.category === b.category);
      const totalSpent = catTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentUsed = b.limit > 0 ? (totalSpent / b.limit) * 100 : 0;

      return {
        _id: b._id,
        category: cat,
        limit: b.limit,
        warningThreshold: b.warningThreshold || 0.8,
        criticalThreshold: b.criticalThreshold || 1.0,
        month: b.month,
        year: b.year,
        totalSpent,
        percentUsed,
      };
    });

    return { success: true, count: data.length, data };
  },

  createOrUpdateBudget: async (categoryId, limit, warningThreshold, criticalThreshold, month, year) => {
    await delay(200);
    const currentUser = getStored('mock_currentUser', null);
    if (!currentUser) throw new Error('Not authorized');

    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    const budgets = getStored('mock_budgets', []);
    const idx = budgets.findIndex(
      (b) => b.user === currentUser._id && b.category === categoryId && b.month === m && b.year === y
    );

    const limVal = parseFloat(limit);

    let budget;
    if (idx !== -1) {
      budget = budgets[idx];
      budget.limit = limVal;
      if (warningThreshold) budget.warningThreshold = parseFloat(warningThreshold);
      if (criticalThreshold) budget.criticalThreshold = parseFloat(criticalThreshold);
      budgets[idx] = budget;
    } else {
      budget = {
        _id: `bdg_${Date.now()}`,
        user: currentUser._id,
        category: categoryId,
        limit: limVal,
        warningThreshold: warningThreshold ? parseFloat(warningThreshold) : 0.8,
        criticalThreshold: criticalThreshold ? parseFloat(criticalThreshold) : 1.0,
        month: m,
        year: y,
      };
      budgets.push(budget);
    }

    setStored('mock_budgets', budgets);

    const categories = getStored('mock_categories', []);
    const catDetails = categories.find((c) => c._id === categoryId) || { name: 'Expense' };

    return {
      success: true,
      data: {
        ...budget,
        category: catDetails,
      },
    };
  },

  deleteBudget: async (id) => {
    await delay(100);
    const budgets = getStored('mock_budgets', []);
    const filtered = budgets.filter((b) => b._id !== id);
    setStored('mock_budgets', filtered);
    return { success: true, message: 'Budget limit removed', id };
  },

  // --- INTERNAL BUDGET ALERTS SIMULATOR ---
  checkBudgetAlerts: async (userId, categoryId, dateStr, incomingAmount = 0) => {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const budgets = getStored('mock_budgets', []);
    const budget = budgets.find(
      (b) => b.user === userId && b.category === categoryId && b.month === m && b.year === y
    );

    if (!budget) return null;

    // Calculate spent
    const txs = getStored('mock_transactions', []).filter(
      (t) =>
        t.user === userId &&
        t.category === categoryId &&
        t.type === 'expense' &&
        !t.isDeleted &&
        new Date(t.date).getMonth() + 1 === m &&
        new Date(t.date).getFullYear() === y
    );

    const baseSpent = txs.reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = baseSpent + incomingAmount;
    const percentUsed = totalSpent / budget.limit;

    const categories = getStored('mock_categories', []);
    const cat = categories.find((c) => c._id === categoryId) || { name: 'Expense' };

    let alertTriggered = false;
    let alertType = null;
    let message = '';

    if (percentUsed >= budget.criticalThreshold) {
      alertTriggered = true;
      alertType = 'critical';
      message = `CRITICAL ALERT: Your spending for '${cat.name}' has reached $${totalSpent.toFixed(2)} (${(percentUsed * 100).toFixed(0)}% of your monthly limit of $${budget.limit.toFixed(2)}).`;
    } else if (percentUsed >= budget.warningThreshold) {
      alertTriggered = true;
      alertType = 'warning';
      message = `WARNING ALERT: Your spending for '${cat.name}' is approaching its limit. You have spent $${totalSpent.toFixed(2)} (${(percentUsed * 100).toFixed(0)}% of your monthly limit of $${budget.limit.toFixed(2)}).`;
    }

    if (alertTriggered) {
      return {
        alertTriggered,
        alertType,
        message,
        limit: budget.limit,
        totalSpent,
        percentUsed: percentUsed * 100,
        categoryName: cat.name,
      };
    }
    return null;
  },
};
