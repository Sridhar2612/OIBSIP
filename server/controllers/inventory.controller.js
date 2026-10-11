const Inventory = require('../models/Inventory');

// @desc    Get all inventory items (public / builder endpoint)
// @route   GET /api/inventory
const getAllInventory = async (req, res, next) => {
  try {
    const { category, isAvailable } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const items = await Inventory.find(query).sort({ category: 1, price: 1 });

    // Also group items by category for easy builder consumption
    const grouped = {
      Base: items.filter((i) => i.category === 'Base'),
      Sauce: items.filter((i) => i.category === 'Sauce'),
      Cheese: items.filter((i) => i.category === 'Cheese'),
      Vegetable: items.filter((i) => i.category === 'Vegetable')
    };

    res.status(200).json({
      success: true,
      count: items.length,
      data: {
        items,
        grouped
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory items by category
// @route   GET /api/inventory/category/:category
const getByCategory = async (req, res, next) => {
  try {
    const items = await Inventory.find({ category: req.params.category }).sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInventory,
  getByCategory
};