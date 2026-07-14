import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/expense_provider.dart';
import '../models/category_model.dart';
import '../models/budget_model.dart';
import '../theme.dart';

class BudgetScreen extends StatefulWidget {
  const BudgetScreen({super.key});

  @override
  State<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends State<BudgetScreen> {
  DateTime _currentBudgetDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBudgets();
    });
  }

  void _loadBudgets() {
    Provider.of<ExpenseProvider>(context, listen: false)
        .fetchBudgets(_currentBudgetDate.month, _currentBudgetDate.year);
  }

  void _changeMonth(int increment) {
    setState(() {
      _currentBudgetDate = DateTime(
        _currentBudgetDate.year,
        _currentBudgetDate.month + increment,
      );
    });
    _loadBudgets();
  }

  void _showSetBudgetDialog(CategoryModel category, BudgetModel? existingBudget) {
    final formKey = GlobalKey<FormState>();
    final limitController = TextEditingController(
      text: existingBudget != null ? existingBudget.limit.toString() : '',
    );
    final warningController = TextEditingController(
      text: existingBudget != null ? (existingBudget.warningThreshold * 100).toStringAsFixed(0) : '80',
    );
    final criticalController = TextEditingController(
      text: existingBudget != null ? (existingBudget.criticalThreshold * 100).toStringAsFixed(0) : '100',
    );

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppTheme.cardColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            existingBudget != null ? 'Edit Budget Limit' : 'Set Budget Limit',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Category: ${category.name}',
                    style: const TextStyle(color: AppTheme.accentColor, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: limitController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Monthly Limit (\$)',
                      hintText: 'e.g. 500.00',
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Limit is required';
                      if (double.tryParse(val) == null || double.parse(val) <= 0) {
                        return 'Enter a valid positive number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: warningController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Warning Threshold (%)',
                      hintText: 'e.g. 80',
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Required';
                      final numVal = int.tryParse(val);
                      if (numVal == null || numVal <= 0 || numVal > 100) {
                        return 'Enter 1 - 100';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: criticalController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Critical Threshold (%)',
                      hintText: 'e.g. 100',
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Required';
                      final numVal = int.tryParse(val);
                      if (numVal == null || numVal <= 0 || numVal > 200) {
                        return 'Enter 1 - 200';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.textMutedColor)),
            ),
            if (existingBudget != null)
              TextButton(
                onPressed: () async {
                  final expProv = Provider.of<ExpenseProvider>(context, listen: false);
                  try {
                    await expProv.removeBudget(existingBudget.id);
                    if (ctx.mounted) {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(backgroundColor: AppTheme.incomeColor, content: Text('Budget limit deleted')),
                      );
                    }
                  } catch (err) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(backgroundColor: AppTheme.expenseColor, content: Text('Failed: $err')),
                      );
                    }
                  }
                },
                child: const Text('Remove', style: TextStyle(color: AppTheme.expenseColor)),
              ),
            ElevatedButton(
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;

                final limit = double.parse(limitController.text.trim());
                final warningVal = double.parse(warningController.text.trim()) / 100;
                final criticalVal = double.parse(criticalController.text.trim()) / 100;

                final expProv = Provider.of<ExpenseProvider>(context, listen: false);

                try {
                  await expProv.addOrUpdateBudget(
                    categoryId: category.id,
                    limit: limit,
                    warningThreshold: warningVal,
                    criticalThreshold: criticalVal,
                    month: _currentBudgetDate.month,
                    year: _currentBudgetDate.year,
                  );
                  if (ctx.mounted) {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: AppTheme.incomeColor,
                        content: Text('Budget limit updated successfully!'),
                      ),
                    );
                  }
                } catch (err) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: AppTheme.expenseColor,
                        content: Text('Failed to save budget: $err'),
                      ),
                    );
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final monthName = DateFormat('MMMM yyyy').format(_currentBudgetDate);

    // List of expense categories
    final expenseCategories = expenseProvider.categories.where((c) => c.type == 'expense').toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Monthly Budgets'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Month navigator bar
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              color: AppTheme.cardColor,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: Colors.white),
                    onPressed: () => _changeMonth(-1),
                  ),
                  Text(
                    monthName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right, color: Colors.white),
                    onPressed: () => _changeMonth(1),
                  ),
                ],
              ),
            ),

            // Budget list
            Expanded(
              child: expenseProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentColor),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        _loadBudgets();
                      },
                      color: AppTheme.accentColor,
                      child: expenseCategories.isEmpty
                          ? const Center(
                              child: Text(
                                'No expense categories setup yet.',
                                style: TextStyle(color: AppTheme.textMutedColor),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: expenseCategories.length,
                              itemBuilder: (ctx, index) {
                                final category = expenseCategories[index];
                                final spent = expenseProvider.getSpentForCategory(category.id);

                                // Find matching budget limit
                                final budget = expenseProvider.budgets.firstWhere(
                                  (b) => b.category?.id == category.id,
                                  orElse: () => BudgetModel(
                                    id: '',
                                    userId: '',
                                    limit: 0,
                                    warningThreshold: 0.8,
                                    criticalThreshold: 1.0,
                                    month: _currentBudgetDate.month,
                                    year: _currentBudgetDate.year,
                                  ),
                                );

                                final hasBudget = budget.id.isNotEmpty;
                                final limit = budget.limit;
                                final percent = limit > 0 ? spent / limit : 0.0;

                                Color progressColor = AppTheme.incomeColor;
                                if (hasBudget) {
                                  if (percent >= budget.criticalThreshold) {
                                    progressColor = AppTheme.expenseColor;
                                  } else if (percent >= budget.warningThreshold) {
                                    progressColor = Colors.orange;
                                  }
                                }

                                return Container(
                                  margin: const EdgeInsets.symmetric(vertical: 8),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppTheme.cardColor,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(category.iconData, color: category.color, size: 24),
                                              const SizedBox(width: 12),
                                              Text(
                                                category.name,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                            ],
                                          ),
                                          IconButton(
                                            icon: Icon(
                                              hasBudget ? Icons.edit : Icons.add_circle_outline,
                                              color: AppTheme.accentColor,
                                              size: 22,
                                            ),
                                            onPressed: () => _showSetBudgetDialog(category, hasBudget ? budget : null),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Spent: \$${spent.toStringAsFixed(2)}',
                                            style: const TextStyle(
                                              color: AppTheme.textMutedColor,
                                              fontSize: 13,
                                            ),
                                          ),
                                          Text(
                                            hasBudget ? 'Limit: \$${limit.toStringAsFixed(0)}' : 'No Limit Set',
                                            style: const TextStyle(
                                              color: Colors.white70,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      // Progress Bar
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: LinearProgressIndicator(
                                          value: hasBudget ? (percent.clamp(0.0, 1.0)) : 0.0,
                                          backgroundColor: Colors.white.withOpacity(0.05),
                                          valueColor: AlwaysStoppedAnimation<Color>(
                                            hasBudget ? progressColor : Colors.grey,
                                          ),
                                          minHeight: 8,
                                        ),
                                      ),
                                      if (hasBudget && percent >= budget.warningThreshold) ...[
                                        const SizedBox(height: 8),
                                        Text(
                                          percent >= budget.criticalThreshold
                                              ? '🚨 Critical limit exceeded!'
                                              : '⚠️ Approaching spending limit!',
                                          style: TextStyle(
                                            color: progressColor,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          textAlign: TextAlign.right,
                                        ),
                                      ],
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
