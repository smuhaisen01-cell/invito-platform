const { body, validationResult } = require('express-validator');
const { VALIDATION, ERROR_MESSAGES } = require('../utils/constants');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation rules for account creation
const validateAccountCreation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail()
    .withMessage(ERROR_MESSAGES.EMAIL_INVALID)
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    })
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(ERROR_MESSAGES.EMAIL_TOO_LONG),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.PASSWORD_REQUIRED)
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(ERROR_MESSAGES.PASSWORD_TOO_SHORT)
    .matches(VALIDATION.PASSWORD_PATTERN)
    .withMessage(ERROR_MESSAGES.PASSWORD_PATTERN)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(ERROR_MESSAGES.PASSWORD_TOO_LONG),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.NAME_REQUIRED)
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(ERROR_MESSAGES.NAME_TOO_SHORT)
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage(ERROR_MESSAGES.NAME_PATTERN),
  
  handleValidationErrors
];

// Generic validation middleware
const validate = (req, res, next) => {
  // Add generic validation logic here if needed
  next();
};

module.exports = {
  validate,
  validateAccountCreation,
  handleValidationErrors
};
