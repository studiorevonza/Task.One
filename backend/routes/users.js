const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'User profile endpoint - to be implemented'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;