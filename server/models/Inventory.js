const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Base', 'Sauce', 'Cheese', 'Vegetable']
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      default: 'portion'
    },
    threshold: {
      type: Number,
      required: [true, 'Low-stock threshold is required'],
      min: [0, 'Threshold cannot be negative'],
      default: 15
    },
    price: {
      type: Number,
      required: [true, 'Item unit price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    lastAlertSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inventorySchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
