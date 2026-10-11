const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const User = require('../models/User');
const { runInventoryCheck } = require('../jobs/inventoryWatchdog');

// @desc    Get dashboard KPIs and statistics
// @route   GET /api/admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({
      orderStatus: { $in: ['Order Received', 'In Kitchen', 'Sent to Delivery'] }
    });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['SUCCESS', 'PAID'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const allInventory = await Inventory.find();
    const lowStockCount = allInventory.filter((item) => item.quantity <= (item.threshold || 15)).length;
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          activeOrders,
          deliveredOrders,
          totalRevenue,
          totalInventoryItems: allInventory.length,
          lowStockCount,
          totalCustomers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders with filtering and sorting
// @route   GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.phone': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.street': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${validStatuses.join(', ')}`,
        error: 'INVALID_STATUS'
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    }).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order advanced to ${status} by admin operations.`
    });

    await order.save();

    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: order.orderId,
        id: order._id,
        status: order.orderStatus,
        order
      };
      io.emit('order:status_updated', payload);
      io.emit('order_status_updated', payload);
      io.to('order_' + order.orderId).emit('order:status_updated', payload);
      io.to('order_' + order._id.toString()).emit('order:status_updated', payload);
      io.to('admin_room').emit('order:status_updated', payload);
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inventory items with low stock flags and case-insensitive category filtering
// @route   GET /api/admin/inventory
const getAdminInventory = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category.toUpperCase() !== 'ALL') {
      filter.category = new RegExp('^' + category + '$', 'i');
    }

    const items = await Inventory.find(filter).sort({ category: 1, name: 1 });

    const itemsWithMetrics = items.map((item) => {
      const itemThreshold = item.threshold !== undefined ? item.threshold : 15;
      return {
        ...item.toObject(),
        threshold: itemThreshold,
        isLowStock: item.quantity <= itemThreshold,
        stockStatus:
          item.quantity === 0
            ? 'OUT_OF_STOCK'
            : item.quantity <= itemThreshold
            ? 'LOW_STOCK'
            : 'HEALTHY'
      };
    });

    res.status(200).json({
      success: true,
      count: itemsWithMetrics.length,
      data: { inventory: itemsWithMetrics }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock quantity or threshold (Restock action)
// @route   PATCH /api/admin/inventory/:id
const updateInventoryItem = async (req, res, next) => {
  try {
    const { quantity, threshold, price, isAvailable, restockAmount } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND'
      });
    }

    const previousQuantity = item.quantity;

    if (restockAmount && typeof restockAmount === 'number') {
      item.quantity += restockAmount;
      if (item.quantity > 0) item.isAvailable = true;

      await InventoryTransaction.create({
        item: item._id,
        itemName: item.name,
        type: 'MANUAL_ADD',
        quantity: restockAmount,
        stockAfter: item.quantity,
        reason: `Restocked +${restockAmount} ${item.unit} by admin ${req.user ? req.user.email : 'System'}`,
        performedBy: req.user ? req.user._id : null
      });
    } else if (quantity !== undefined) {
      const diff = Number(quantity) - previousQuantity;
      item.quantity = Number(quantity);
      if (item.quantity > 0) item.isAvailable = true;

      await InventoryTransaction.create({
        item: item._id,
        itemName: item.name,
        type: 'ADJUSTMENT',
        quantity: diff,
        stockAfter: item.quantity,
        reason: `Manual stock adjustment to ${item.quantity} ${item.unit} by admin ${req.user ? req.user.email : 'System'}`,
        performedBy: req.user ? req.user._id : null
      });
    }

    if (threshold !== undefined) item.threshold = Number(threshold);
    if (price !== undefined) item.price = Number(price);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);

    await item.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('inventory:updated', {
        id: item._id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        isLowStock: item.quantity <= (item.threshold || 15)
      });
    }

    res.status(200).json({
      success: true,
      message: `${item.name} inventory successfully updated`,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger immediate inventory check & email alerts
// @route   POST /api/admin/inventory/check-alerts
const triggerInventoryAlert = async (req, res, next) => {
  try {
    const result = await runInventoryCheck();
    res.status(200).json({
      success: true,
      message: result.triggered
        ? `Alert dispatched for ${result.count} low-stock items`
        : 'All stock levels healthy. No alerts needed.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllOrders,
  updateOrderStatus,
  getAdminInventory,
  updateInventoryItem,
  triggerInventoryAlert
};
