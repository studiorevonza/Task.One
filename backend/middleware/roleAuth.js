const User = require('../models/User');

const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      // Check if user exists in request (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Find user in database to get latest role
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user's role is in allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires role(s): ${roles.join(', ')}`
        });
      }

      // Add user info to request for use in route handlers
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization'
      });
    }
  };
};

module.exports = { authorizeRoles };