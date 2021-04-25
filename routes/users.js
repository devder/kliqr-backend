const express = require('express');
const router = express.Router();
const { getAllUsers, getUser } = require('../controllers/users')

router.route('/').get(getAllUsers)

router.route('/:id').get(getUser)

module.exports = router