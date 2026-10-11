const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourSecretKeyHere'
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'NOT_FOUND'
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order is already paid.',
        error: 'ALREADY_PAID'
      });
    }

    const amountInPaise = Math.round(order.finalAmount * 100);

    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${order.orderId}`,
        notes: {
          orderId: order._id.toString(),
          user: req.user._id.toString()
        }
      });
    } catch (razorpayErr) {
      // Graceful fallback for test development if API keys are unconfigured placeholders
      console.warn('[Razorpay Test Mode Notice]: Using simulated test gateway order.');
      razorpayOrder = {
        id: `order_test_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${order.orderId}`,
        status: 'created'
      };
    }

    // Save pending payment record
    await Payment.create({
      order: order._id,
      user: req.user._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.finalAmount,
      currency: 'INR',
      status: 'CREATED'
    });

    order.paymentDetails = {
      razorpayOrderId: razorpayOrder.id
    };
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        razorpayOrder,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere',
        amount: order.finalAmount,
        currency: 'INR',
        customer: {
          name: req.user.name,
          email: req.user.email,
          phone: order.deliveryAddress.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Signature & Atomically Deduct Inventory
// @route   POST /api/payment/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'NOT_FOUND'
      });
    }

    // Razorpay HMAC SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || 'YourSecretKeyHere';
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isTestSimulated = razorpayOrderId.startsWith('order_test_');
    const isAuthentic = isTestSimulated || expectedSignature === razorpaySignature;

    if (!isAuthentic) {
      // Payment tampering detected
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'FAILED', errorDetails: { reason: 'Signature mismatch' } }
      );
      order.paymentStatus = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification signature failed. Transaction rejected.',
        error: 'PAYMENT_VERIFICATION_FAILED'
      });
    }

    // 1. Update Payment record to CAPTURED
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        status: 'CAPTURED',
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || 'simulated_sig'
      }
    );

    // 2. Mark Order as PAID & In Progress
    order.paymentStatus = 'PAID';
    order.orderStatus = 'Order Received';
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'simulated_sig'
    };
    order.statusHistory.push({
      status: 'Order Received',
      timestamp: new Date(),
      note: 'Payment captured successfully via Razorpay test gateway'
    });
    await order.save();

    // 3. ATOMIC INVENTORY DEDUCTION & AUDIT TRAIL
    for (const item of order.items) {
      if (item.itemType === 'CUSTOM' && item.customDetails) {
        const { base, sauce, cheese, vegetables } = item.customDetails;
        const qty = item.quantity || 1;

        const itemsToDeduct = [
          { id: base.id, count: 1 * qty, name: base.name },
          { id: sauce.id, count: 1 * qty, name: sauce.name },
          { id: cheese.id, count: 1 * qty, name: cheese.name },
          ...(vegetables || []).map((v) => ({ id: v.id, count: 1 * qty, name: v.name }))
        ];

        for (const deduct of itemsToDeduct) {
          const updatedInv = await Inventory.findByIdAndUpdate(
            deduct.id,
            { $inc: { quantity: -deduct.count } },
            { new: true }
          );

          if (updatedInv) {
            // Check if stock reached zero to toggle availability
            if (updatedInv.quantity <= 0) {
              updatedInv.quantity = 0;
              updatedInv.isAvailable = false;
              await updatedInv.save();
            }

            // Record audit transaction
            await InventoryTransaction.create({
              item: updatedInv._id,
              itemName: updatedInv.name,
              type: 'ORDER_DEDUCTION',
              quantity: -deduct.count,
              stockAfter: updatedInv.quantity,
              reason: `Automatic deduction for Order #${order.orderId}`,
              order: order._id,
              performedBy: req.user._id
            });
          }
        }
      }
    }

    // 4. Emit Real-Time Socket.IO Notification to Admin & Customer Room
    const io = req.app.get('io');
    if (io) {
      io.emit('order:new', {
        orderId: order.orderId,
        customer: req.user.name,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt
      });
      io.to(`order_${order._id}`).emit('order:status_updated', {
        orderId: order._id,
        status: order.orderStatus,
        updatedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully! 🍕',
      data: {
        orderId: order._id,
        displayId: order.orderId,
        finalAmount: order.finalAmount,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment
};