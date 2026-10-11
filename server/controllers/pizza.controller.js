const Pizza = require('../models/Pizza');

// @desc    Get all pizzas with filtering, search & sorting
// @route   GET /api/pizzas
const getAllPizzas = async (req, res, next) => {
  try {
    const { category, search, sortBy, isAvailable } = req.query;

    const query = {};

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Availability Filter
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // Search query across name, description, and ingredients
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price-asc') sortOption = { price: 1 };
    if (sortBy === 'price-desc') sortOption = { price: -1 };
    if (sortBy === 'name-asc') sortOption = { name: 1 };

    const pizzas = await Pizza.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: pizzas.length,
      data: { pizzas }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single pizza details
// @route   GET /api/pizzas/:id
const getPizzaById = async (req, res, next) => {
  try {
    const pizza = await Pizza.findById(req.params.id);

    if (!pizza) {
      return res.status(404).json({
        success: false,
        message: 'Pizza not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { pizza }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create new pizza
// @route   POST /api/pizzas
const createPizza = async (req, res, next) => {
  try {
    const { name, description, image, category, price, ingredients, isAvailable } = req.body;

    const pizza = await Pizza.create({
      name,
      description,
      image,
      category,
      price,
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map((s) => s.trim()),
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    res.status(201).json({
      success: true,
      message: 'Pizza added to catalog successfully!',
      data: { pizza }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update pizza
// @route   PATCH /api/pizzas/:id
const updatePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!pizza) {
      return res.status(404).json({
        success: false,
        message: 'Pizza not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pizza updated successfully',
      data: { pizza }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete pizza
// @route   DELETE /api/pizzas/:id
const deletePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findByIdAndDelete(req.params.id);

    if (!pizza) {
      return res.status(404).json({
        success: false,
        message: 'Pizza not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pizza removed from catalog'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza
};
