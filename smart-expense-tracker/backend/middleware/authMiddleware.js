const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if Bearer token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_token_for_smart_expense_tracker_12345');

      // Get user from database (excluding password hash) and bind to request
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User account not found' });
      }

      // Check if user account is locked
      if (req.user.isLocked()) {
        return res.status(403).json({
          success: false,
          error: `Account is temporarily locked. Try again after ${req.user.lockoutUntil.toLocaleTimeString()}`,
        });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
  }
};

module.exports = { protect };
