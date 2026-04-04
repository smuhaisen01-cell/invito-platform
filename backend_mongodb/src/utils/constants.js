module.exports = {
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },
  
  // Validation constants
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    NAME_PATTERN: /^[a-zA-Z\s]+$/
  },
  
  // Error messages
  ERROR_MESSAGES: {
    VALIDATION_FAILED: 'Validation failed',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please provide a valid email address',
    EMAIL_TOO_LONG: 'Email must be less than 255 characters',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
    PASSWORD_TOO_LONG: 'Password must be less than 128 characters',
    PASSWORD_PATTERN: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    NAME_REQUIRED: 'Name is required',
    NAME_TOO_SHORT: 'Name must be between 2 and 100 characters',
    NAME_TOO_LONG: 'Name must be between 2 and 100 characters',
    NAME_PATTERN: 'Name can only contain letters and spaces',
    EMAIL_EXISTS: 'User with this email already exists',
    ACCOUNT_CREATED: 'Account created successfully',
    INTERNAL_ERROR: 'Internal server error'
  }
}; 