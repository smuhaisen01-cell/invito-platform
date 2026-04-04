const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: { type: String, enum: ["Bronze", "Silver", "Gold"], required: true },
  price: { type: Number, required: true },
  durationInDays: { type: Number, default: 30 },
  maxEmails: Number,
  maxWhatsAppMessages: Number,
  features: [String],
});

module.exports = mongoose.model("Plan", planSchema);
