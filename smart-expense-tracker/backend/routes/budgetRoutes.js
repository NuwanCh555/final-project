const express = require('express');
const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All budget routes are protected by JWT session guard
router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createOrUpdateBudget);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
