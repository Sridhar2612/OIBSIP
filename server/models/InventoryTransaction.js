const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['ORDER_DEDUCTION', 'MANUAL_ADD', 'MANUAL_REMOVE', 'ADJUSTMENT']
    },
    quantity: {
      type: Number,
      required: true
    },
    stockAfter: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

inventoryTransactionSchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
