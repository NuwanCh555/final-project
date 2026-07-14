import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/auth_provider.dart';
import '../providers/expense_provider.dart';
import '../widgets/summary_card.dart';
import '../widgets/transaction_tile.dart';
import '../theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final expenseProvider = Provider.of<ExpenseProvider>(context);

    // Group expenses by category for pie chart
    final expenses = expenseProvider.transactions.where((t) => t.type == 'expense').toList();
    final Map<String, double> categoryAmounts = {};
    final Map<String, Color> categoryColors = {};

    for (var tx in expenses) {
      if (tx.category != null) {
        final catName = tx.category!.name;
        categoryAmounts[catName] = (categoryAmounts[catName] ?? 0.0) + tx.amount;
        categoryColors[catName] = tx.category!.color;
      } else {
        const catName = 'Uncategorized';
        categoryAmounts[catName] = (categoryAmounts[catName] ?? 0.0) + tx.amount;
        categoryColors[catName] = AppTheme.textMutedColor;
      }
    }

    final totalExp = expenseProvider.totalExpenses;

    final List<PieChartSectionData> pieSections = categoryAmounts.entries.map((entry) {
      final percentage = totalExp > 0 ? (entry.value / totalExp) * 100 : 0.0;
      return PieChartSectionData(
        color: categoryColors[entry.key],
        value: entry.value,
        title: '${percentage.toStringAsFixed(0)}%',
        radius: 40,
        titleStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: expenseProvider.isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentColor),
                ),
              )
            : RefreshIndicator(
                onRefresh: () async {
                  await expenseProvider.fetchTransactions();
                  await expenseProvider.fetchCategories();
                },
                color: AppTheme.accentColor,
                backgroundColor: AppTheme.cardColor,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Welcome back,',
                                style: TextStyle(
                                  color: AppTheme.textMutedColor,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user?.name ?? 'User',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontSize: 24,
                                    ),
                              ),
                            ],
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: AppTheme.cardColor,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white.withOpacity(0.05),
                              ),
                            ),
                            child: IconButton(
                              icon: const Icon(
                                Icons.category_outlined,
                                color: AppTheme.accentColor,
                              ),
                              onPressed: () {
                                Navigator.of(context).pushNamed('/categories');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Income & Expense Metrics
                      Row(
                        children: [
                          SummaryCard(
                            title: 'Income',
                            amount: expenseProvider.totalIncome,
                            icon: Icons.arrow_upward,
                            accentColor: AppTheme.incomeColor,
                          ),
                          const SizedBox(width: 16),
                          SummaryCard(
                            title: 'Expenses',
                            amount: expenseProvider.totalExpenses,
                            icon: Icons.arrow_downward,
                            accentColor: AppTheme.expenseColor,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Net Balance Card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.primaryColor,
                              AppTheme.accentColor.withOpacity(0.8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryColor.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'NET BALANCE',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '\$${expenseProvider.netBalance.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Pie Chart Section
                      if (expenses.isNotEmpty) ...[
                        const Text(
                          'Expense Distribution',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.cardColor,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 130,
                                height: 130,
                                child: PieChart(
                                  PieChartData(
                                    sectionsSpace: 2,
                                    centerSpaceRadius: 28,
                                    sections: pieSections,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: categoryAmounts.entries.map((entry) {
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 4.0),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 10,
                                            height: 10,
                                            decoration: BoxDecoration(
                                              color: categoryColors[entry.key],
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              entry.key,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Text(
                                            '\$${entry.value.toStringAsFixed(0)}',
                                            style: const TextStyle(
                                              color: AppTheme.textMutedColor,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 28),
                      ],

                      // Recent Transactions
                      const Text(
                        'Recent Transactions',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      expenseProvider.transactions.isEmpty
                          ? Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppTheme.cardColor,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Column(
                                children: [
                                  Icon(
                                    Icons.receipt_long_outlined,
                                    color: AppTheme.textMutedColor,
                                    size: 48,
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    'No transactions recorded yet.',
                                    style: TextStyle(
                                      color: AppTheme.textMutedColor,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : Column(
                              children: expenseProvider.transactions
                                  .take(5)
                                  .map((tx) => TransactionTile(
                                        transaction: tx,
                                        onDelete: () async {
                                          try {
                                            await expenseProvider.removeTransaction(tx.id);
                                          } catch (err) {
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
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
                                      ))
                                  .toList(),
                            ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
