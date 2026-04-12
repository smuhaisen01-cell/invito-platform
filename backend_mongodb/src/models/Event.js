const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  footerText: { type: String },
  scheduleTime: { type: String, required: true },
  eventDateTime: { type: String, required: true },
  location: { type: String },
  emailSent: { type: Boolean, default: false },
  whatsappSent: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  attendance: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'running', 'completed'], default: 'scheduled' },
  retryAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
  lastAttemptedAt: { type: Date },
  whatsapp: {
    templateName: { type: String },
    templateId: { type: String },
    languageCode: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
    mediaId: { type: String },
    imageUrl: { type: String },
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
