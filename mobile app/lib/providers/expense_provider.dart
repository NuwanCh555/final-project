import 'package:flutter/material.dart';
import '../models/category_model.dart';
import '../models/transaction_model.dart';
import '../models/budget_model.dart';
import '../services/api_service.dart';

class ExpenseProvider with ChangeNotifier {
  List<CategoryModel> _categories = [];
  List<TransactionModel> _transactions = [];
  List<BudgetModel> _budgets = [];

  bool _isLoading = false;
  String? _error;

  // Selected date context for budgets
  int _budgetMonth = DateTime.now().month;
  int _budgetYear = DateTime.now().year;

  List<CategoryModel> get categories => _categories;
  List<TransactionModel> get transactions => _transactions;
  List<BudgetModel> get budgets => _budgets;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get budgetMonth => _budgetMonth;
  int get budgetYear => _budgetYear;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void setBudgetDate(int month, int year) {
    _budgetMonth = month;
    _budgetYear = year;
    notifyListeners();
  }

  // ==========================================
  // CALCULATED GETTERS
  // ==========================================

  double get totalIncome => _transactions
      .where((t) => t.type == 'income')
      .fold(0.0, (sum, t) => sum + t.amount);

  double get totalExpenses => _transactions
      .where((t) => t.type == 'expense')
      .fold(0.0, (sum, t) => sum + t.amount);

  double get netBalance => totalIncome - totalExpenses;

  // Helper to compute actual spent in the current budget month/year for a given category ID
  double getSpentForCategory(String categoryId) {
    return _transactions.where((t) {
      return t.type == 'expense' &&
          t.category?.id == categoryId &&
          t.date.month == _budgetMonth &&
          t.date.year == _budgetYear;
    }).fold(0.0, (sum, t) => sum + t.amount);
  }

  // ==========================================
  // CATEGORY METHODS
  // ==========================================

  Future<void> fetchCategories() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _categories = await ApiService.getCategories();
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCategory(String name, String type, String color, String icon) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newCategory = await ApiService.createCategory(name, type, color, icon);
      _categories.add(newCategory);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> removeCategory(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.deleteCategory(id);
      _categories.removeWhere((cat) => cat.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ==========================================
  // TRANSACTION METHODS
  // ==========================================

  Future<void> fetchTransactions([Map<String, String>? filters]) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _transactions = await ApiService.getTransactions(filters);
      // Sort: Newest first
      _transactions.sort((a, b) => b.date.compareTo(a.date));
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTransaction({
    required double amount,
    required String type,
    required String categoryId,
    required DateTime date,
    String? description,
    String? paymentMethod,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newTx = await ApiService.createTransaction(
        amount: amount,
        type: type,
        categoryId: categoryId,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
        notes: notes,
      );
      _transactions.insert(0, newTx);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateTransaction(String id, Map<String, dynamic> updateData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedTx = await ApiService.updateTransaction(id, updateData);
      final index = _transactions.indexWhere((t) => t.id == id);
      if (index != -1) {
        _transactions[index] = updatedTx;
        _transactions.sort((a, b) => b.date.compareTo(a.date));
      }
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> removeTransaction(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.deleteTransaction(id);
      _transactions.removeWhere((t) => t.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ==========================================
  // BUDGET METHODS
  // ==========================================

  Future<void> fetchBudgets(int month, int year) async {
    _isLoading = true;
    _error = null;
    _budgetMonth = month;
    _budgetYear = year;
    notifyListeners();

    try {
      _budgets = await ApiService.getBudgets(month, year);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addOrUpdateBudget({
    required String categoryId,
    required double limit,
    required double warningThreshold,
    required double criticalThreshold,
    required int month,
    required int year,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newBudget = await ApiService.createOrUpdateBudget(
        categoryId: categoryId,
        limit: limit,
        warningThreshold: warningThreshold,
        criticalThreshold: criticalThreshold,
        month: month,
        year: year,
      );

      final index = _budgets.indexWhere((b) => b.id == newBudget.id);
      if (index != -1) {
        _budgets[index] = newBudget;
      } else {
        final checkIndex = _budgets.indexWhere((b) => 
            b.category?.id == categoryId && 
            b.month == month && 
            b.year == year);
        if (checkIndex != -1) {
          _budgets[checkIndex] = newBudget;
        } else {
          _budgets.add(newBudget);
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> removeBudget(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.deleteBudget(id);
      _budgets.removeWhere((b) => b.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
}
