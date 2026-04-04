const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset', 'refresh_token'],
    required: true
  },
  expires: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired tokens
tokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// Index for efficient queries
tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Token', tokenSchema);