const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Pizza = require('../models/Pizza');

// @desc    Create a new order & calculate server-side validated price
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
        error: 'EMPTY_ORDER'
      });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.phone) {
      return res.status(400).json({
        success: false,
        message: 'Complete delivery address and phone number are required.',
        error: 'MISSING_ADDRESS'
      });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Process and validate every item from database prices & stock
    for (const rawItem of items) {
      if (rawItem.itemType === 'CUSTOM') {
        const { base, sauce, cheese, vegetables, quantity = 1 } = rawItem;

        if (!base || !sauce || !cheese) {
          return res.status(400).json({
            success: false,
            message: 'Custom pizza is missing required Base, Sauce, or Cheese component.',
            error: 'INVALID_CUSTOM_PIZZA'
          });
        }

        // Fetch authoritative item records from Inventory
        const baseDoc = await Inventory.findById(base.id || base._id);
        const sauceDoc = await Inventory.findById(sauce.id || sauce._id);
        const cheeseDoc = await Inventory.findById(cheese.id || cheese._id);

        if (!baseDoc || !sauceDoc || !cheeseDoc) {
          return res.status(404).json({
            success: false,
            message: 'One or more custom pizza ingredients were not found in inventory.',
            error: 'INGREDIENT_NOT_FOUND'
          });
        }

        // Stock sufficiency checks
        if (baseDoc.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for crust: ${baseDoc.name} (${baseDoc.quantity} left)`,
            error: 'INSUFFICIENT_STOCK'
          });
        }
        if (sauceDoc.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for sauce: ${sauceDoc.name} (${sauceDoc.quantity} left)`,
            error: 'INSUFFICIENT_STOCK'
          });
        }
        if (cheeseDoc.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for cheese: ${cheeseDoc.name} (${cheeseDoc.quantity} left)`,
            error: 'INSUFFICIENT_STOCK'
          });
        }

        let itemUnitCost = baseDoc.price + sauceDoc.price + cheeseDoc.price;
        const validatedVeggies = [];

        if (vegetables && vegetables.length > 0) {
          for (const v of vegetables) {
            const vegDoc = await Inventory.findById(v.id || v._id);
            if (!vegDoc) continue;
            if (vegDoc.quantity < quantity) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for vegetable: ${vegDoc.name} (${vegDoc.quantity} left)`,
                error: 'INSUFFICIENT_STOCK'
              });
            }
            itemUnitCost += vegDoc.price;
            validatedVeggies.push({
              id: vegDoc._id,
              name: vegDoc.name,
              price: vegDoc.price
            });
          }
        }

        const totalItemCost = itemUnitCost * quantity;
        subtotal += totalItemCost;

        validatedItems.push({
          itemType: 'CUSTOM',
          name: `Custom Pie (${baseDoc.name.split(' ')[0]})`,
          quantity,
          unitPrice: itemUnitCost,
          totalItemPrice: totalItemCost,
          customDetails: {
            base: { id: baseDoc._id, name: baseDoc.name, price: baseDoc.price },
            sauce: { id: sauceDoc._id, name: sauceDoc.name, price: sauceDoc.price },
            cheese: { id: cheeseDoc._id, name: cheeseDoc.name, price: cheeseDoc.price },
            vegetables: validatedVeggies
          }
        });
      } else {
        // Preset Pizza from Catalog
        const pizzaDoc = await Pizza.findById(rawItem.pizza || rawItem.id);
        if (!pizzaDoc) {
          return res.status(404).json({
            success: false,
            message: 'Selected pizza was not found in catalog.',
            error: 'PIZZA_NOT_FOUND'
          });
        }

        const quantity = rawItem.quantity || 1;
        const totalItemCost = pizzaDoc.price * quantity;
        subtotal += totalItemCost;

        validatedItems.push({
          itemType: 'PRESET',
          pizza: pizzaDoc._id,
          name: pizzaDoc.name,
          quantity,
          unitPrice: pizzaDoc.price,
          totalItemPrice: totalItemCost
        });
      }
    }

    // Taxes (5% GST) & Delivery Fee
    const taxes = Math.round(subtotal * 0.05);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const finalAmount = subtotal + taxes + deliveryFee;

    const uniqueOrderId = 'SC-' + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      orderId: uniqueOrderId,
      user: req.user._id,
      items: validatedItems,
      subtotal,
      taxes,
      deliveryFee,
      finalAmount,
      deliveryAddress,
      paymentStatus: 'PENDING',
      orderStatus: 'Order Received',
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: new Date(),
          note: 'Order created, awaiting payment authorization'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user order history
// @route   GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    }).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'NOT_FOUND'
      });
    }

    // Authorization check: User can only view their own order unless admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this order record.',
        error: 'FORBIDDEN'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById
};
