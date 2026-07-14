const express = require('express');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  importTransactions,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All transaction routes are protected by JWT session guard
router.use(protect);

// Import/Export specific sub-routes (declared first so they don't match /:id parameter wildcard)
router.get('/export', exportTransactions);
router.post('/import', importTransactions);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
