const express = require('express');
const router = express.Router();
const { getAllInventory, getByCategory } = require('../controllers/inventory.controller');

router.get('/', getAllInventory);
router.get('/category/:category', getByCategory);

module.exports = router;