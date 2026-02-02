const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { dbOperation, inMemoryOperations, isDbConnected } = require('../utils/dbHelper');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    let user;
    if (isDbConnected()) {
      // Use database
      user = await dbOperation(async () => {
        return await User.findById(req.user.userId)
          .select('id name email avatar_url created_at');
      });
    } else {
      // Use in-memory storage
      user = inMemoryOperations.findUserById(req.user.userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;