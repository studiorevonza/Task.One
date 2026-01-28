const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Tags endpoints - to be implemented
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Tags endpoint - to be implemented'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;