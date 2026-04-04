const PaymentHistory = require("../models/PaymentHistory");
const User = require("../models/User");

exports.addPayment = async (req, res) => {
  try {
    // const userId = req.user._id;

    const { userId,amount, paymentId,seat } = req.body;
    // Ensure user exists
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // const seat  = 3;
    // Validate required fields
    if (!amount || !seat || !paymentId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const payment = new PaymentHistory({
      date: new Date(),  // default to current time
      amount,
      seat,
      paymentId,
      parentId: userId,
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Payment history added successfully",
      payment,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add payment history",
      error: error.message,
    });
  }
};
exports.getPayments = async (req, res) => {
  try {
    // const userId = req.user._id;

    // const { userId,amount, paymentId,seat } = req.body;
    // Ensure user exists
    // Fetch all payment history records
    let data = await PaymentHistory.find({parentId: req.user.parentId ? req.user.parentId : req.user._id});

    // If req.user exists, add parentEmail to each record
    if (req.user && req.user.email) {
      data = data.map(record => {
        // Convert Mongoose document to plain object if needed
        const obj = record.toObject ? record.toObject() : record;
        return { ...obj, parentEmail: req.user.email };
      });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    
    // await payment.save();

    return res.status(201).json({
      success: true,
      message: "Payment history added successfully",
      data,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add payment history",
      error: error.message,
    });
  }
};
