const express = require('express');
const router = express.Router();
const {
  getAllPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza
} = require('../controllers/pizza.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', getAllPizzas);
router.get('/:id', getPizzaById);
router.post('/', protect, requireAdmin, createPizza);
router.patch('/:id', protect, requireAdmin, updatePizza);
router.delete('/:id', protect, requireAdmin, deletePizza);

module.exports = router;
