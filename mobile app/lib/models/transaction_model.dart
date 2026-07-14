import 'category_model.dart';

class TransactionModel {
  final String id;
  final double amount;
  final String type; // 'income' or 'expense'
  final CategoryModel? category;
  final DateTime date;
  final String description;
  final String paymentMethod;
  final String notes;

  TransactionModel({
    required this.id,
    required this.amount,
    required this.type,
    this.category,
    required this.date,
    required this.description,
    required this.paymentMethod,
    required this.notes,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    CategoryModel? parsedCategory;
    if (json['category'] != null) {
      if (json['category'] is Map<String, dynamic>) {
        parsedCategory = CategoryModel.fromJson(json['category']);
      } else {
        // If it's just a category ID string
        parsedCategory = CategoryModel(
          id: json['category'].toString(),
          name: 'Loading...',
          type: json['type'] ?? 'expense',
          colorHex: '#94A3B8',
          iconName: 'Tag',
        );
      }
    }

    DateTime parsedDate = DateTime.now();
    if (json['date'] != null) {
      try {
        parsedDate = DateTime.parse(json['date']);
      } catch (_) {}
    }

    return TransactionModel(
      id: json['_id'] ?? json['id'] ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      type: json['type'] ?? 'expense',
      category: parsedCategory,
      date: parsedDate,
      description: json['description'] ?? '',
      paymentMethod: json['paymentMethod'] ?? 'Cash',
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'amount': amount,
      'type': type,
      'category': category?.id ?? '',
      'date': date.toIso8601String(),
      'description': description,
      'paymentMethod': paymentMethod,
      'notes': notes,
    };
  }
}
