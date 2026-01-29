const express = require('express');
const { authenticateToken } = require('../middleware/auth');

// Use global database if available, fallback to mock
const getDb = () => {
  return global.db || {
    query: async (sql, params) => {
      console.warn('⚠️ Database not connected - using in-memory storage');
      return [];
    }
  };
};

const db = getDb();

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    // Check if database is available
    if (!global.db) {
      return res.json({
        success: true,
        message: 'Database not connected - using in-memory storage',
        data: {
          name: req.user?.name || 'User',
          role: 'User',
          location: 'San Francisco, CA',
          bio: 'Product Designer passionate about creating exceptional digital experiences',
          website: `tasq.one/u/${req.user?.userId || 'temp'}`,
          avatar: ''
        }
      });
    }
    
    res.json({
      success: true,
      message: 'User profile endpoint - to be implemented'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;