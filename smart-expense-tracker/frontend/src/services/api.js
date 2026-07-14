import axios from 'axios';
import { mockApiService } from './mockApiService';

// Configure standard Axios instance
const axiosInstance = axios.create({
  baseURL:'https://expense-tracker-0fu3.onrender.com/api',
  timeout: 5000,
});

// Bind Authorization Bearer tokens automatically to headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Configure Mock Mode Toggle Option
// Defaults to true if Node is unavailable (like on your local terminal check)
const USE_MOCK = false; 

export const api = {
  // Auth routes
  register: async (name, email, password) => {
    if (USE_MOCK) return mockApiService.register(name, email, password);
    try {
      const response = await axiosInstance.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  login: async (email, password) => {
    if (USE_MOCK) return mockApiService.login(email, password);
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axiosInstance.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await axiosInstance.post('/auth/verifyotp', { email, otp });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  resetPassword: async (email, otp, password) => {
    try {
      const response = await axiosInstance.post('/auth/resetpassword', { email, otp, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  getProfile: async () => {
    if (USE_MOCK) return mockApiService.getProfile();
    try {
      const response = await axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  updateProfile: async (name, email, password) => {
    if (USE_MOCK) return mockApiService.updateProfile(name, email, password);
    try {
      const response = await axiosInstance.put('/auth/profile', { name, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  uploadProfilePicture: async (file) => {
    if (USE_MOCK) throw new Error('Mock mode not supported for profile picture upload');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axiosInstance.post('/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  // Categories routes
  getCategories: async () => {
    if (USE_MOCK) return mockApiService.getCategories();
    try {
      const response = await axiosInstance.get('/categories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  createCategory: async (name, type, color, icon) => {
    if (USE_MOCK) return mockApiService.createCategory(name, type, color, icon);
    try {
      const response = await axiosInstance.post('/categories', { name, type, color, icon });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  deleteCategory: async (id) => {
    if (USE_MOCK) return mockApiService.deleteCategory(id);
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  // Transactions routes
  getTransactions: async (filters = {}) => {
    if (USE_MOCK) return mockApiService.getTransactions(filters);
    try {
      const response = await axiosInstance.get('/transactions', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  createTransaction: async (amount, type, category, date, description, paymentMethod, notes) => {
    if (USE_MOCK) {
      return mockApiService.createTransaction(
        amount,
        type,
        category,
        date,
        description,
        paymentMethod,
        notes
      );
    }
    try {
      const response = await axiosInstance.post('/transactions', {
        amount,
        type,
        category,
        date,
        description,
        paymentMethod,
        notes,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  updateTransaction: async (id, data) => {
    if (USE_MOCK) return mockApiService.updateTransaction(id, data);
    try {
      const response = await axiosInstance.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  deleteTransaction: async (id) => {
    if (USE_MOCK) return mockApiService.deleteTransaction(id);
    try {
      const response = await axiosInstance.delete(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  exportTransactions: async () => {
    if (USE_MOCK) {
      // Mock CSV generation and trigger browser download directly!
      const res = await mockApiService.getTransactions({ limit: 1000 });
      let csvContent = 'Date,Type,Amount,Category,Payment Method,Description,Notes\n';
      res.data.forEach((tx) => {
        const dateStr = tx.date.split('T')[0];
        const catName = tx.category ? tx.category.name : 'Other';
        const desc = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : '';
        const notesStr = tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '';
        csvContent += `${dateStr},${tx.type},${tx.amount},${catName},${tx.paymentMethod},${desc},${notesStr}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    window.open('/api/transactions/export', '_blank');
  },

  importTransactions: async (records) => {
    if (USE_MOCK) return mockApiService.importTransactions(records);
    try {
      const response = await axiosInstance.post('/transactions/import', { records });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  // Budgets routes
  getBudgets: async (month, year) => {
    if (USE_MOCK) return mockApiService.getBudgets(month, year);
    try {
      const response = await axiosInstance.get('/budgets', { params: { month, year } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  createOrUpdateBudget: async (categoryId, limit, warningThreshold, criticalThreshold, month, year) => {
    if (USE_MOCK) {
      return mockApiService.createOrUpdateBudget(
        categoryId,
        limit,
        warningThreshold,
        criticalThreshold,
        month,
        year
      );
    }
    try {
      const response = await axiosInstance.post('/budgets', {
        category: categoryId,
        limit,
        warningThreshold,
        criticalThreshold,
        month,
        year,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  deleteBudget: async (id) => {
    if (USE_MOCK) return mockApiService.deleteBudget(id);
    try {
      const response = await axiosInstance.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },
};
