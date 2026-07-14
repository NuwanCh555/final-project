import 'package:flutter/material.dart' show BottomNavigationBar, BottomNavigationBarItem, BuildContext, CircleBorder, Colors, FloatingActionButton, Icon, Icons, IndexedStack, Navigator, Scaffold, State, StatefulWidget, Widget, WidgetsBinding;
import 'package:provider/provider.dart';
import '../providers/expense_provider.dart';
import '../theme.dart';
import 'dashboard_screen.dart';
import 'transaction_history_screen.dart';
import 'budget_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const DashboardScreen(),
    const TransactionHistoryScreen(),
    const BudgetScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Pre-fetch initial transactional data inside frame lifecycle safe schedule
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final expenseProvider = Provider.of<ExpenseProvider>(context, listen: false);
      expenseProvider.fetchCategories();
      expenseProvider.fetchTransactions();
      final now = DateTime.now();
      expenseProvider.fetchBudgets(now.month, now.year);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Overview',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'Ledger',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pie_chart_outline),
            activeIcon: Icon(Icons.pie_chart),
            label: 'Budgets',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).pushNamed('/add-transaction').then((_) {
            if (!mounted) return;
            // Re-fetch transactions, budgets, etc., in case they changed
            final expenseProvider = Provider.of<ExpenseProvider>(context, listen: false);
            expenseProvider.fetchTransactions();
            final now = DateTime.now();
            expenseProvider.fetchBudgets(now.month, now.year);
          });
        },
        backgroundColor: AppTheme.accentColor,
        foregroundColor: Colors.white,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, size: 28),
      ),
    );
  }
}
