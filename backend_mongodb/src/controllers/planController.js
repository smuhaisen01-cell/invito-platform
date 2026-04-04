const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");

exports.getAllplans = async (req, res) => {
  try {
    
    const plan = await SubscriptionPlan.find().sort({price: 1});
    
    if (!plan) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      plan
    });
  }
    catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
}
exports.getPlan = async (req, res) => {
  try {
    const {planId} = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      plan
    });
  }
    catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
}