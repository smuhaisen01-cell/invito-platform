const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  number: { type: String },
  email: { type: String },
  date: { type: Date },
  isEmailApproved: {
    type: Boolean,
    default: false
  },
  isEmailApprovedAt: {
    type: Date,
    default: null
  },


  isWhatsappApproved: {
    type: Boolean,
    default: false
  },
  isWhatsappApprovedAt: {
    type: Date,
    default: null
  },

  EmailUnsubscribe: {
    type: Boolean,
    default: false
  },
  EmailUnsubscribeAt: {
    type: Date,
    default: null
  },

  isWhatsappUnscribed: {
    type: Boolean,
    default: false
  },
  isWhatsappUnscribedAt: {
    type: Date,
    default: null
  },



  markWhatScanned: {
    type: Boolean,
    default: false
  },
  markWhatsappScannedAt: {
    type: Date,
    default: null
  },



  markEmailScanned: {
    type: Boolean,
    default: false
  },
  markEmailScannedAt: {
    type: Date,
    default: null
  },
  messageid : {
    type: String,
    default: null
  },
  messageStatus : {
    type: String,
    default: null
  },
  messageError : {
    type: String,
    default: null
  },
  

}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema); 