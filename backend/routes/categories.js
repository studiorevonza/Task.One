const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Categories endpoints - to be implemented
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Categories endpoint - to be implemented'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;