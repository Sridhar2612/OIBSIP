const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllOrders,
  updateOrderStatus,
  getAdminInventory,
  updateInventoryItem,
  triggerInventoryAlert
} = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

router.use(protect, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/inventory', getAdminInventory);
router.patch('/inventory/:id', updateInventoryItem);
router.post('/inventory/check-alerts', triggerInventoryAlert);

module.exports = router;
