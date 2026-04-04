const rateLimit = require('express-rate-limit');

// Create rate limiter factory
const createLimiter = (options) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Rate limiting configurations
const throttle = {
  // Signup rate limiting - 5 attempts per 15 minutes
  signup: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many signup attempts, please try again later.'
  },
  
  // Signin rate limiting - 10 attempts per 15 minutes
  signin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many login attempts, please try again later.'
  },
  
  // Password reset rate limiting - 3 attempts per hour
  password_reset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts, please try again later.'
  },
  
  // Email verification rate limiting - 5 attempts per hour
  email_verification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many email verification attempts, please try again later.'
  },
  
  // General API rate limiting - 100 requests per 15 minutes
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many API requests, please try again later.'
  }
};

// Create limiter function
const limiter = (config) => {
  return createLimiter(config);
};

// Export configured limiters
module.exports = {
  limiter,
  throttle,
  // Pre-configured limiters
  signupLimiter: createLimiter(throttle.signup),
  signinLimiter: createLimiter(throttle.signin),
  passwordResetLimiter: createLimiter(throttle.password_reset),
  emailVerificationLimiter: createLimiter(throttle.email_verification),
  apiLimiter: createLimiter(throttle.api)
};