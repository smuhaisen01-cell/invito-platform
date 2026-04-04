const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  seat: {
    type: String, // if seat is like "A1", "B2"
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true // each payment should be unique
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent", // assumes you have a Parent model
    required: true
  }
});

const PaymentHistory = mongoose.model("PaymentHistory", paymentHistorySchema);

module.exports = PaymentHistory;
