import 'package:flutter/material.dart';

class CategoryModel {
  final String id;
  final String name;
  final String type; // 'income' or 'expense'
  final String colorHex;
  final String iconName;
  final String? userId; // Null for default system categories

  CategoryModel({
    required this.id,
    required this.name,
    required this.type,
    required this.colorHex,
    required this.iconName,
    this.userId,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'expense',
      colorHex: json['color'] ?? '#94A3B8',
      iconName: json['icon'] ?? 'Tag',
      userId: json['user'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'type': type,
      'color': colorHex,
      'icon': iconName,
      'user': userId,
    };
  }

  // Get Flutter Color from hex string
  Color get color {
    try {
      String hex = colorHex.replaceAll('#', '');
      if (hex.length == 6) {
        hex = 'FF$hex';
      }
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return Colors.blueGrey;
    }
  }

  // Get Flutter Material Icon from string mapping
  IconData get iconData {
    switch (iconName.toLowerCase()) {
      case 'briefcase':
      case 'salary':
        return Icons.work;
      case 'coins':
      case 'freelance':
        return Icons.monetization_on;
      case 'investment':
        return Icons.show_chart;
      case 'gift':
        return Icons.card_giftcard;
      case 'utensils':
      case 'food':
        return Icons.restaurant;
      case 'home':
      case 'rent':
        return Icons.home;
      case 'filetext':
      case 'bills':
        return Icons.receipt;
      case 'tag':
      case 'shopping':
        return Icons.shopping_bag;
      case 'healthcare':
        return Icons.medical_services;
      case 'education':
        return Icons.school;
      case 'entertainment':
        return Icons.movie;
      case 'transport':
        return Icons.directions_car;
      case 'other':
      default:
        return Icons.more_horiz;
    }
  }
}
