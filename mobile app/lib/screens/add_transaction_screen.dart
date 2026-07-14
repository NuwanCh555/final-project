import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/transaction_model.dart';
import '../providers/expense_provider.dart';
import '../theme.dart';

class AddTransactionScreen extends StatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _notesController = TextEditingController();

  String _transactionType = 'expense'; // 'income' or 'expense'
  String? _selectedCategoryId;
  DateTime _selectedDate = DateTime.now();
  String _selectedPaymentMethod = 'Cash';

  bool _isEditing = false;
  String? _editingTransactionId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final txArg = ModalRoute.of(context)!.settings.arguments as TransactionModel?;
    if (txArg != null && _editingTransactionId == null) {
      _isEditing = true;
      _editingTransactionId = txArg.id;
      _amountController.text = txArg.amount.toString();
      _descriptionController.text = txArg.description;
      _notesController.text = txArg.notes;
      _transactionType = txArg.type;
      _selectedCategoryId = txArg.category?.id;
      _selectedDate = txArg.date;
      _selectedPaymentMethod = txArg.paymentMethod;
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _presentDatePicker() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              surface: AppTheme.cardColor,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null) {
      setState(() {
        _selectedDate = pickedDate;
      });
    }
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.expenseColor,
          content: Text('Please enter a valid amount greater than 0'),
        ),
      );
      return;
    }

    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.expenseColor,
          content: Text('Please select a category'),
        ),
      );
      return;
    }

    final expProv = Provider.of<ExpenseProvider>(context, listen: false);

    try {
      if (_isEditing) {
        await expProv.updateTransaction(
          _editingTransactionId!,
          {
            'amount': amount,
            'type': _transactionType,
            'category': _selectedCategoryId,
            'date': _selectedDate.toIso8601String(),
            'description': _descriptionController.text.trim(),
            'paymentMethod': _selectedPaymentMethod,
            'notes': _notesController.text.trim(),
          },
        );
      } else {
        await expProv.addTransaction(
          amount: amount,
          type: _transactionType,
          categoryId: _selectedCategoryId!,
          date: _selectedDate,
          description: _descriptionController.text.trim(),
          paymentMethod: _selectedPaymentMethod,
          notes: _notesController.text.trim(),
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.incomeColor,
            content: Text(
              _isEditing ? 'Transaction updated successfully!' : 'Transaction added successfully!',
            ),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.expenseColor,
            content: Text(expProv.error ?? 'Failed to save transaction'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final categories = expenseProvider.categories.where((c) => c.type == _transactionType).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Transaction' : 'New Transaction'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Transaction Type Slide Selector (Income vs Expense)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppTheme.cardColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _transactionType = 'expense';
                              _selectedCategoryId = null; // reset category on switch
                            });
                          },
                          child: Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: _transactionType == 'expense' ? AppTheme.expenseColor : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Expense',
                              style: TextStyle(
                                color: _transactionType == 'expense' ? Colors.white : AppTheme.textMutedColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _transactionType = 'income';
                              _selectedCategoryId = null; // reset category on switch
                            });
                          },
                          child: Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: _transactionType == 'income' ? AppTheme.incomeColor : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Income',
                              style: TextStyle(
                                color: _transactionType == 'income' ? Colors.white : AppTheme.textMutedColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Amount Text Field (Large Typography)
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.monetization_on, size: 28, color: AppTheme.accentColor),
                    hintText: '0.00',
                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                    fillColor: AppTheme.cardColor,
                    filled: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Amount is required';
                    }
                    if (double.tryParse(value) == null) {
                      return 'Enter a valid number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Category Selection
                DropdownButtonFormField<String>(
                  value: _selectedCategoryId,
                  dropdownColor: AppTheme.cardColor,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    prefixIcon: Icon(Icons.category_outlined, color: AppTheme.textMutedColor),
                  ),
                  hint: const Text('Select category', style: TextStyle(color: AppTheme.textMutedColor)),
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  onChanged: (val) {
                    setState(() {
                      _selectedCategoryId = val;
                    });
                  },
                  items: categories.map((cat) {
                    return DropdownMenuItem<String>(
                      value: cat.id,
                      child: Row(
                        children: [
                          Icon(cat.iconData, color: cat.color, size: 20),
                          const SizedBox(width: 12),
                          Text(cat.name),
                        ],
                      ),
                    );
                  }).toList(),
                  validator: (value) {
                    if (value == null) {
                      return 'Category is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Payment Method Selection
                DropdownButtonFormField<String>(
                  value: _selectedPaymentMethod,
                  dropdownColor: AppTheme.cardColor,
                  decoration: const InputDecoration(
                    labelText: 'Payment Method',
                    prefixIcon: Icon(Icons.payment_outlined, color: AppTheme.textMutedColor),
                  ),
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _selectedPaymentMethod = val;
                      });
                    }
                  },
                  items: const [
                    DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                    DropdownMenuItem(value: 'Card', child: Text('Credit/Debit Card')),
                    DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Transfer')),
                    DropdownMenuItem(value: 'Mobile Pay', child: Text('Mobile Pay / Wallet')),
                  ],
                ),
                const SizedBox(height: 16),

                // Date Picker trigger
                InkWell(
                  onTap: _presentDatePicker,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.cardColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.calendar_today_outlined, color: AppTheme.textMutedColor),
                            const SizedBox(width: 12),
                            Text('Date', style: TextStyle(color: AppTheme.textColor, fontSize: 16)),
                          ],
                        ),
                        Text(
                          DateFormat('yyyy-MM-dd').format(_selectedDate),
                          style: const TextStyle(
                            color: AppTheme.accentColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Description
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    prefixIcon: Icon(Icons.description_outlined, color: AppTheme.textMutedColor),
                    hintText: 'What was this transaction for?',
                  ),
                ),
                const SizedBox(height: 16),

                // Notes
                TextFormField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    prefixIcon: Icon(Icons.notes_outlined, color: AppTheme.textMutedColor),
                    hintText: 'Additional details or reminders...',
                  ),
                ),
                const SizedBox(height: 32),

                // Save Button
                expenseProvider.isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentColor),
                        ),
                      )
                    : ElevatedButton(
                        onPressed: _submit,
                        child: Text(_isEditing ? 'UPDATE TRANSACTION' : 'ADD TRANSACTION'),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
