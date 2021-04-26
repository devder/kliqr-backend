const express = require('express');
const router = express.Router();
const { getTransactions, getExpenseTrend } = require('../controllers/transactions')

router.route('/').get(getTransactions)

router.route('/:id').get(getExpenseTrend)

module.exports = router