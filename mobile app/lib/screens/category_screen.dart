import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/expense_provider.dart';
import '../models/category_model.dart';
import '../theme.dart';

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  String _activeType = 'expense'; // 'income' or 'expense'

  // Predefined colors for selector wizard
  final List<String> _hexColors = [
    '#0D9488', // Teal
    '#F43F5E', // Rose
    '#10B981', // Emerald
    '#8B5CF6', // Violet
    '#F59E0B', // Amber
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#3B82F6', // Blue
  ];

  // Predefined icons and mapping keys for selector wizard
  final List<Map<String, dynamic>> _iconChoices = [
    {'name': 'briefcase', 'icon': Icons.work},
    {'name': 'coins', 'icon': Icons.monetization_on},
    {'name': 'utensils', 'icon': Icons.restaurant},
    {'name': 'home', 'icon': Icons.home},
    {'name': 'bills', 'icon': Icons.receipt},
    {'name': 'shopping', 'icon': Icons.shopping_bag},
    {'name': 'healthcare', 'icon': Icons.medical_services},
    {'name': 'education', 'icon': Icons.school},
    {'name': 'entertainment', 'icon': Icons.movie},
    {'name': 'transport', 'icon': Icons.directions_car},
  ];

  void _showAddCategoryDialog() {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    String categoryType = _activeType;
    String selectedColorHex = _hexColors.first;
    String selectedIconName = _iconChoices.first['name'];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: AppTheme.cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Add Custom Category', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Name input
                      TextFormField(
                        controller: nameController,
                        decoration: const InputDecoration(
                          labelText: 'Category Name',
                          hintText: 'e.g. Shopping, Rent',
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Name is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Type toggle selector
                      Row(
                        children: [
                          const Text('Type: ', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 12),
                          ChoiceChip(
                            label: const Text('Expense'),
                            selected: categoryType == 'expense',
                            onSelected: (selected) {
                              if (selected) {
                                setModalState(() => categoryType = 'expense');
                              }
                            },
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('Income'),
                            selected: categoryType == 'income',
                            onSelected: (selected) {
                              if (selected) {
                                setModalState(() => categoryType = 'income');
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Color selector grid
                      const Text('Select Color', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 48,
                        width: double.maxFinite,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _hexColors.length,
                          itemBuilder: (ctx, idx) {
                            final hex = _hexColors[idx];
                            final color = Color(int.parse('FF${hex.replaceAll('#', '')}', radix: 16));
                            final isSelected = selectedColorHex == hex;
                            return GestureDetector(
                              onTap: () {
                                setModalState(() => selectedColorHex = hex);
                              },
                              child: Container(
                                width: 36,
                                height: 36,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  color: color,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? Colors.white : Colors.transparent,
                                    width: 2.5,
                                  ),
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                                    : null,
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Icon selector grid
                      const Text('Select Icon', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _iconChoices.map((choice) {
                          final isSelected = selectedIconName == choice['name'];
                          return GestureDetector(
                            onTap: () {
                              setModalState(() => selectedIconName = choice['name']);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppTheme.primaryColor : AppTheme.backgroundColor,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSelected ? Colors.white : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Icon(choice['icon'], color: isSelected ? Colors.white : AppTheme.textMutedColor, size: 24),
                            ),
                          );
                        }).toList(),
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
                ElevatedButton(
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    final expProv = Provider.of<ExpenseProvider>(context, listen: false);
                    try {
                      await expProv.addCategory(
                        nameController.text.trim(),
                        categoryType,
                        selectedColorHex,
                        selectedIconName,
                      );
                      if (ctx.mounted) {
                        Navigator.of(ctx).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(backgroundColor: AppTheme.incomeColor, content: Text('Category created')),
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
                  child: const Text('Add'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmDeleteCategory(CategoryModel category) {
    if (category.userId == null) {
      // Default system category cannot be deleted
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.expenseColor,
          content: Text('Default system categories cannot be deleted.'),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Custom Category', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete the category "${category.name}"?\nNote: Existing transactions using this category might become uncategorized.',
          style: const TextStyle(color: AppTheme.textMutedColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMutedColor)),
          ),
          ElevatedButton(
            onPressed: () async {
              final expProv = Provider.of<ExpenseProvider>(context, listen: false);
              try {
                await expProv.removeCategory(category.id);
                if (ctx.mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(backgroundColor: AppTheme.incomeColor, content: Text('Category deleted successfully')),
                  );
                }
              } catch (err) {
                if (ctx.mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: AppTheme.expenseColor, content: Text('Failed: $err')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.expenseColor),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final displayedCategories = expenseProvider.categories.where((c) => c.type == _activeType).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Manage Categories'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Slide segment selector
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppTheme.cardColor,
              child: Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Expense Categories', style: TextStyle(fontWeight: FontWeight.bold))),
                      selected: _activeType == 'expense',
                      selectedColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(color: _activeType == 'expense' ? Colors.white : AppTheme.textMutedColor),
                      onSelected: (selected) {
                        if (selected) setState(() => _activeType = 'expense');
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Income Categories', style: TextStyle(fontWeight: FontWeight.bold))),
                      selected: _activeType == 'income',
                      selectedColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(color: _activeType == 'income' ? Colors.white : AppTheme.textMutedColor),
                      onSelected: (selected) {
                        if (selected) setState(() => _activeType = 'income');
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Categories Grid
            Expanded(
              child: expenseProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentColor),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        await expenseProvider.fetchCategories();
                      },
                      color: AppTheme.accentColor,
                      child: displayedCategories.isEmpty
                          ? const Center(
                              child: Text(
                                'No categories available.',
                                style: TextStyle(color: AppTheme.textMutedColor),
                              ),
                            )
                          : GridView.builder(
                              padding: const EdgeInsets.all(20),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 1.3,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                              ),
                              itemCount: displayedCategories.length,
                              itemBuilder: (ctx, idx) {
                                final cat = displayedCategories[idx];
                                final isCustom = cat.userId != null;

                                return GestureDetector(
                                  onLongPress: () => _confirmDeleteCategory(cat),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppTheme.cardColor,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: cat.color.withOpacity(0.2),
                                        width: 1.5,
                                      ),
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: cat.color.withOpacity(0.1),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(cat.iconData, color: cat.color, size: 28),
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          cat.name,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        if (isCustom)
                                          const Text(
                                            'Custom (Hold to delete)',
                                            style: TextStyle(
                                              color: AppTheme.textMutedColor,
                                              fontSize: 10,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCategoryDialog,
        backgroundColor: AppTheme.accentColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
