import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/expense_provider.dart';
import '../widgets/transaction_tile.dart';
import '../theme.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  String _searchQuery = '';
  String _selectedType = 'all'; // 'all', 'income', 'expense'
  String? _selectedCategoryId;

  @override
  Widget build(BuildContext context) {
    final expenseProvider = Provider.of<ExpenseProvider>(context);

    // Apply filtering client-side for smooth performance
    final filteredTxs = expenseProvider.transactions.where((tx) {
      final matchesSearch = tx.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (tx.category?.name.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          tx.notes.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesType = _selectedType == 'all' || tx.type == _selectedType;

      final matchesCategory = _selectedCategoryId == null || tx.category?.id == _selectedCategoryId;

      return matchesSearch && matchesType && matchesCategory;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Transaction Ledger'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter controls bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppTheme.cardColor,
              child: Column(
                children: [
                  // Search bar text field
                  TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppTheme.backgroundColor,
                      hintText: 'Search ledger...',
                      prefixIcon: const Icon(Icons.search, color: AppTheme.textMutedColor),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.primaryColor),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Filter Row for Type & Category
                  Row(
                    children: [
                      // Type Segment Selector
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.backgroundColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedType,
                              dropdownColor: AppTheme.cardColor,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedType = val;
                                  });
                                }
                              },
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Types')),
                                DropdownMenuItem(value: 'income', child: Text('Income')),
                                DropdownMenuItem(value: 'expense', child: Text('Expenses')),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Category Dropdown
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.backgroundColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String?>(
                              value: _selectedCategoryId,
                              hint: const Text('Categories', style: TextStyle(color: AppTheme.textMutedColor, fontSize: 13)),
                              dropdownColor: AppTheme.cardColor,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              onChanged: (val) {
                                setState(() {
                                  _selectedCategoryId = val;
                                });
                              },
                              items: [
                                const DropdownMenuItem(value: null, child: Text('All Categories')),
                                ...expenseProvider.categories.map((cat) {
                                  return DropdownMenuItem(
                                    value: cat.id,
                                    child: Row(
                                      children: [
                                        Icon(cat.iconData, color: cat.color, size: 16),
                                        const SizedBox(width: 8),
                                        Text(cat.name),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // List of Transactions
            Expanded(
              child: expenseProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentColor),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        await expenseProvider.fetchTransactions();
                      },
                      color: AppTheme.accentColor,
                      child: filteredTxs.isEmpty
                          ? const Center(
                              child: Text(
                                'No matching transactions found.',
                                style: TextStyle(color: AppTheme.textMutedColor),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              itemCount: filteredTxs.length,
                              itemBuilder: (ctx, index) {
                                final tx = filteredTxs[index];
                                return TransactionTile(
                                  transaction: tx,
                                  onDelete: () async {
                                    try {
                                      await expenseProvider.removeTransaction(tx.id);
                                    } catch (err) {
                                      if (ctx.mounted) {
                                        ScaffoldMessenger.of(ctx).showSnackBar(
                                          SnackBar(
                                            backgroundColor: AppTheme.expenseColor,
                                            content: Text('Failed to delete: $err'),
                                          ),
                                        );
                                      }
                                    }
                                  },
                                  onTap: () {
                                    Navigator.of(context).pushNamed(
                                      '/add-transaction',
                                      arguments: tx,
                                    ).then((_) {
                                      expenseProvider.fetchTransactions();
                                    });
                                  },
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
