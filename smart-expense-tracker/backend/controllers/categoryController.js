const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// @desc    Get all active categories (global default + user custom)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    // Fetch global system default categories (user: null) AND user custom categories
    const categories = await Category.find({
      $or: [{ user: null }, { user: req.user._id }],
      isActive: true,
    }).sort({ user: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      res.status(400);
      throw new Error('Please enter a category name and select transaction type');
    }

    // Check if a category with the same name already exists for this user (or globally)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type,
      $or: [{ user: null }, { user: req.user._id }],
    });

    if (existingCategory) {
      res.status(400);
      throw new Error('A category with this name already exists');
    }

    const category = await Category.create({
      name: name.trim(),
      type,
      color: color || '#64748b',
      icon: icon || 'Tag',
      user: req.user._id, // Set user owner reference
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update custom category details
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // R-CAT-5: Disallow modification of default system categories
    if (!category.user) {
      res.status(403);
      throw new Error('Default system categories cannot be modified');
    }

    // Verify category ownership
    if (category.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to modify this category');
    }

    const { name, color, icon, isActive } = req.body;

    // Check if new name conflicts with another category
    if (name && name.trim() !== category.name) {
      const nameConflict = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        type: category.type,
        _id: { $ne: category._id },
        $or: [{ user: null }, { user: req.user._id }],
      });

      if (nameConflict) {
        res.status(400);
        throw new Error('A category with this name already exists');
      }
      category.name = name.trim();
    }

    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (typeof isActive !== 'undefined') category.isActive = isActive;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category (if no active transactions reference it)
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // R-CAT-5: Disallow deletion of default system categories
    if (!category.user) {
      res.status(403);
      throw new Error('Default system categories cannot be deleted');
    }

    // Verify ownership
    if (category.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this category');
    }

    // R-CAT-3: Prevent deletion if transactions are associated with this category
    const transactionCount = await Transaction.countDocuments({
      category: category._id,
      user: req.user._id,
      isDeleted: false,
    });

    if (transactionCount > 0) {
      res.status(400);
      throw new Error(
        `This category has ${transactionCount} active transaction(s) associated with it. Please re-categorize them or mark the category as inactive instead.`
      );
    }

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: 'Custom category successfully deleted',
      id: category._id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
