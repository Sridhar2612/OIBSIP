const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['PRESET', 'CUSTOM'],
    required: true
  },
  pizza: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pizza',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalItemPrice: {
    type: Number,
    required: true,
    min: 0
  },
  customDetails: {
    base: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      name: String,
      price: Number
    },
    sauce: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      name: String,
      price: Number
    },
    cheese: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      name: String,
      price: Number
    },
    vegetables: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        name: String,
        price: Number
      }
    ]
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      phone: { type: String, required: true }
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String
    },
    orderStatus: {
      type: String,
      enum: ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'],
      default: 'Order Received'
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ]
  },
  {
    timestamps: true
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
