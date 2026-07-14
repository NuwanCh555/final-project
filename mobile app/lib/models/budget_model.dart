import 'category_model.dart';

class BudgetModel {
  final String id;
  final String userId;
  final CategoryModel? category;
  final double limit;
  final double warningThreshold;
  final double criticalThreshold;
  final int month;
  final int year;

  BudgetModel({
    required this.id,
    required this.userId,
    this.category,
    required this.limit,
    required this.warningThreshold,
    required this.criticalThreshold,
    required this.month,
    required this.year,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    CategoryModel? parsedCategory;
    if (json['category'] != null) {
      if (json['category'] is Map<String, dynamic>) {
        parsedCategory = CategoryModel.fromJson(json['category']);
      } else {
        // If just ID string
        parsedCategory = CategoryModel(
          id: json['category'].toString(),
          name: 'Loading...',
          type: 'expense',
          colorHex: '#94A3B8',
          iconName: 'Tag',
        );
      }
    }

    return BudgetModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['user'] ?? '',
      category: parsedCategory,
      limit: (json['limit'] is num) ? (json['limit'] as num).toDouble() : 0.0,
      warningThreshold: (json['warningThreshold'] is num) 
          ? (json['warningThreshold'] as num).toDouble() 
          : 0.8,
      criticalThreshold: (json['criticalThreshold'] is num) 
          ? (json['criticalThreshold'] as num).toDouble() 
          : 1.0,
      month: json['month'] ?? 1,
      year: json['year'] ?? 2026,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'category': category?.id ?? '',
      'limit': limit,
      'warningThreshold': warningThreshold,
      'criticalThreshold': criticalThreshold,
      'month': month,
      'year': year,
    };
  }
}
