const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Added User model import

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Get the user from the database to get the latest role
    try {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Add user info to request with role
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: user.role || 'user' // Include user role
      };
    } catch (dbErr) {
      console.error('Database error in auth middleware:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }

    next();
  });
};

module.exports = { authenticateToken };