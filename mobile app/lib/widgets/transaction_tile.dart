import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/transaction_model.dart';
import '../theme.dart';

class TransactionTile extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const TransactionTile({
    super.key,
    required this.transaction,
    this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    final dateFormatter = DateFormat('MMM dd, yyyy');

    final isIncome = transaction.type == 'income';
    final category = transaction.category;
    final categoryColor = category?.color ?? AppTheme.textMutedColor;
    final categoryIcon = category?.iconData ?? Icons.more_horiz;
    final categoryName = category?.name ?? 'Uncategorized';

    final widgetCard = Container(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: categoryColor.withOpacity(0.15),
            shape: BoxShape.circle,
            border: Border.all(
              color: categoryColor.withOpacity(0.3),
              width: 1.5,
            ),
          ),
          child: Icon(
            categoryIcon,
            color: categoryColor,
            size: 24,
          ),
        ),
        title: Text(
          transaction.description.isNotEmpty
              ? transaction.description
              : categoryName,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  transaction.paymentMethod,
                  style: const TextStyle(
                    color: AppTheme.textMutedColor,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                dateFormatter.format(transaction.date),
                style: const TextStyle(
                  color: AppTheme.textMutedColor,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        trailing: Text(
          '${isIncome ? '+' : '-'}${currencyFormatter.format(transaction.amount)}',
          style: TextStyle(
            color: isIncome ? AppTheme.incomeColor : AppTheme.expenseColor,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        onTap: onTap,
      ),
    );

    if (onDelete != null) {
      return Dismissible(
        key: Key(transaction.id),
        direction: DismissDirection.endToStart,
        background: Container(
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 24),
          decoration: BoxDecoration(
            color: AppTheme.expenseColor.withOpacity(0.9),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.delete_outline,
            color: Colors.white,
            size: 28,
          ),
        ),
        confirmDismiss: (direction) async {
          return await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              backgroundColor: AppTheme.cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'Delete Transaction',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Are you sure you want to permanently delete this transaction?',
                style: TextStyle(color: AppTheme.textMutedColor),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: AppTheme.textMutedColor),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.expenseColor,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Delete'),
                ),
              ],
            ),
          );
        },
        onDismissed: (_) {
          onDelete!();
        },
        child: widgetCard,
      );
    }

    return widgetCard;
  }
}
