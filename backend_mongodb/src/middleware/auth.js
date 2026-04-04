const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = {
  // Verify JWT token
  verify: (type = 'private') => {
    return async (req, res, next) => {
      try {
        let token;
        
        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        }
        
        // For public routes, continue without token
        if (type === 'public' && !token) {
          return next();
        }
        
        // For private routes, token is required
         if (!token && req.query.token) {
      token = req.query.token;
    }
        if (!token) {
          return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
          
        }
        
        try {
          // Verify token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);

          // Get user from token
          const user = await User.findOne({ _id: decoded.id });

          if (!user) {
            return res.status(401).json({ success: false, message: 'Token is not valid. User not found.' });
          }
          
          if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated.' });
          }
          
          req.user = user;
          next();
        } catch (error) {
          if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired.' });
          } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
          } else {
            return res.status(401).json({ success: false, message: 'Token verification failed.' });
          }
        }
      } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
      }
    };
  },
  
  // Check if user has required role
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Access denied. Authentication required.' });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    };
  },
  
  // Check if email is verified
  requireEmailVerification: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Access denied. Authentication required.' });
    }
    
    if (!req.user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Email verification required.' });
    }
    
    next();
  },
  
  // Optional authentication
  optional: async (req, res, next) => {
    try {
      let token;
      
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user && user.isActive) {
            req.user = user;
          }
        } catch (error) {
          // Ignore token errors for optional auth
        }
      }
      
      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next(); // Continue without user
    }
  }
};

module.exports = authMiddleware;