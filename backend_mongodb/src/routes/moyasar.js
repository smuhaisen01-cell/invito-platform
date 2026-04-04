const express = require("express");
const router = express.Router();
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const Plan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const PaymentHistory = require("../models/PaymentHistory");
const authMiddleware = require("../middleware/auth");

// Middleware
router.use(cors());
router.use(express.json());

// Configuration
const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY;
const MOYASAR_PUBLISHABLE_KEY = process.env.MOYASAR_PUBLISHABLE_KEY;
const BASE_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const IS_TEST_MODE = process.env.NODE_ENV === "local";

// Helper: Activate subscription and store token
async function activateSubscription(userId, planTitle, source) {
  console.log(`[activateSubscription] Starting for user: ${userId}, plan: ${planTitle}`);
  
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId format");
  }

  const [user, plan] = await Promise.all([
    User.findById(userId),
    Plan.findOne({ name: { $regex: new RegExp(`^${planTitle}$`, "i") } }),
  ]);

  if (!user) throw new Error("User not found");
  if (!plan) throw new Error(`Plan not found: ${planTitle}`);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.durationInDays);

  user.subscription = {
    planId: plan._id,
    planName: plan.name,
    startDate,
    endDate,
    isActive: true,
    source: source || user.subscription?.source || null,
    lastPaymentId: null,
    iscancelled: false,
    lastPaymentDate: startDate,
    autoRenew: true,
    retryCount: 0,
  };

  if (source?.s && source.token) {
    user.subscription.source = source;
    console.log(`[activateSubscription] Stored reusable source: ${source.token}`);
  }

  await user.save();
  console.log(`[activateSubscription] Subscription saved for user: ${userId}, token: ${user.subscription.source?.token || 'none'}`);
  return { user, plan };
}

async function countTotalUsers(parentId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      throw new Error("Invalid parentId format");
    }
    const childCount = await User.countDocuments({ parentId });
    console.log(`[countTotalUsers] Found ${childCount} child users for parentId: ${parentId}`);
    return childCount + 1; // Include parent
  } catch (error) {
    console.error("[countTotalUsers] Error:", error.message);
    return 1; // Default to 1
  }
}

// POST /upgrade: Initiate payment with stored token
router.post("/upgrade", authMiddleware.verify(), async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId } = req.body;

    console.log(`[upgrade] Starting for user: ${userId}, plan: ${planId}`);

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("[upgrade] Invalid userId format");
      return res.status(400).json({ success: false, error: "Invalid userId format" });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      console.error("[upgrade] User not found");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get total users for seat-based pricing
    const totalUsers = await countTotalUsers(userId);

    // Get plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      console.error(`[upgrade] Plan not found: ${planId}`);
      return res.status(404).json({ success: false, error: `Plan not found: ${planId}` });
    }

    const planTitle = plan.name;
    const amount = Math.round(Number(plan.price) * totalUsers);

    // Check if user already has a reusable source token
    const reusableSource =
      user.subscription?.source?.token?.startsWith("token_") ? user.subscription.source : null;

    if (reusableSource) {
      console.log(`[upgrade] Using reusable source: ${reusableSource.token}`);

      const paymentPayload = {
        amount,
        currency: "SAR",
        description: `Subscription to ${planTitle}`,
        source: { type: "token", token: reusableSource.token },
        metadata: { userId, planId, planTitle },
        callback_url: `${BASE_URL}/api/moyasar/callback`,
      };

      const paymentResponse = await axios.post(
        "https://api.moyasar.com/v1/payments",
        paymentPayload,
        { auth: { username: MOYASAR_SECRET_KEY, password: "" } }
      );

      const paymentData = paymentResponse.data;
      console.log("[upgrade] Payment response:", paymentData);

      // Handle 3DS redirection
      if (paymentData.status === "initiated" && paymentData.source?.transaction_url) {
        return res.json({
          success: false,
          requiresAction: true,
          transactionUrl: paymentData.source.transaction_url,
        });
      }

      // Failed payment
      if (paymentData.status !== "paid") {
        return res.status(400).json({ success: false, error: `Payment failed: ${paymentData.status}` });
      }

      // Save payment history (keep old token if new one is null)
      await PaymentHistory.create({
        userId,
        seat: totalUsers,
        amount: paymentData.amount,
        parentId: userId,
        paymentId: paymentData.id,
        status: paymentData.status,
        source: user.subscription.source,
        planTitle,
        createdAt: new Date(),
      });

      console.log("paymentSource---->" + JSON.stringify(paymentData.source));

      // Update subscription only if new token exists
      if (paymentData.source?.token && paymentData.source.token !== reusableSource.token) {
        user.subscription = {
          ...user.subscription,
          source: {
            token: paymentData.source.token,
            type: paymentData.source.type,
            scheme: paymentData.source.scheme || null,
            last4: paymentData.source.last4 || null,
          },
        };
        await user.save();
        console.log(`[upgrade] Updated subscription with new token: ${paymentData.source.token}`);
      } else {
        console.log("[upgrade] No new token received, keeping old token:", reusableSource.token);
      }

      // Activate subscription (use new source if exists else old one)
      const { user: updatedUser, plan: updatedPlan } = await activateSubscription(
        userId,
        planTitle,
        paymentData.source?.token ? paymentData.source : reusableSource
      );

      return res.json({
        success: true,
        payment: paymentData,
        cardToken: paymentData.source?.token || reusableSource.token,
        subscription: updatedUser.subscription,
        userId,
        planTitle,
      });
    } else {
      console.log("[upgrade] No reusable source, payment form required");
      return res.json({
        success: false,
        requiresForm: true,
        paymentFormUrl: `${BASE_URL}/api/moyasar/payment-form?userId=${userId}&planTitle=${encodeURIComponent(
          planTitle
        )}&amount=${amount}`,
      });
    }
  } catch (error) {
    console.error("[upgrade] Error:", error.message, error.stack);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /payment-form: Serve HTML payment form
router.get("/payment-form", authMiddleware.verify(), async (req, res) => {
  const { planId } = req.query;
  const userId = req.user._id;

  if (!planId) {
    console.error("[payment-form] Missing required query parameter: planId");
    return res.status(400).send("Missing required query parameter: planId");
  }

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error("[payment-form] Invalid userId format");
    return res.status(400).send("Invalid userId format");
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    console.error("[payment-form] User not found");
    return res.status(404).send("User not found");
  }

  // Verify plan exists
  const plan = await Plan.findById(planId);
  if (!plan) {
    console.error("[payment-form] Plan not found");
    return res.status(404).send("Plan not found");
  }

  const planTitle = plan.name;
  const totalUsers = await countTotalUsers(userId);
  const amount = Math.round(Number(plan.price) * totalUsers);

  console.log("[payment-form] Rendering payment form");
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Moyasar Payment</title>
  <link rel="stylesheet" href="https://unpkg.com/moyasar-payment-form@2.0.16/dist/moyasar.css" />
  <script src="https://unpkg.com/moyasar-payment-form@2.0.16/dist/moyasar.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f4f4f4; }
    .payment-container { max-width: 400px; margin: auto; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="payment-container">
    <h2>Pay with Moyasar</h2>
    <div class="mysr-form"></div>
  </div>
<script>
  console.log("Payment form initialized");
  Moyasar.init({
    element: ".mysr-form",
    amount: ${amount},
    currency: "SAR",
    description: "${planTitle}",
    publishable_api_key: "${MOYASAR_PUBLISHABLE_KEY}",
    callback_url: "${BASE_URL}/api/moyasar/callback",
    metadata: { userId: "${userId}", planTitle: "${planTitle}" },
    methods: ['creditcard'],
    credit_card: { save_card: true },
    on_completed: async function (payment) {
      console.log("[Client] Payment completed:", payment);
      try {
        const res = await axios.post("${BASE_URL}/api/moyasar/verify-payment", {
          id: payment.id,
          userId: payment.metadata.userId,
          planTitle: payment.metadata.planTitle,
          amount: payment.amount,
          status: payment.status,
          token: payment.source?.token || null,
          mydata: payment,
        }, { headers: { "Content-Type": "application/json" } });
        if (res.data.success) {
          const successUrl = new URL("${FRONTEND_URL}/PaymentSuccess");
          ['status', 'paymentId', 'userId', 'planTitle'].forEach(param => {
            successUrl.searchParams.append(param, payment[param] || payment.metadata[param]);
          });
          successUrl.searchParams.append("amount", (payment.amount / 100).toFixed(2));
          successUrl.searchParams.append("date", new Date().toISOString());
          if (payment.source?.token) successUrl.searchParams.append("token", payment.source.token);
          window.location.href = successUrl.toString();
        } else if (res.data.requiresAction) {
          window.location.href = res.data.transactionUrl;
        } else {
          alert("❌ Payment failed: " + (res.data.message || "Unknown error"));
          window.location.href = "${FRONTEND_URL}/PaymentFailed?reason=" +
            encodeURIComponent(res.data.message || "Payment failed");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        alert("Payment verification failed: " + errorMsg);
        window.location.href = "${FRONTEND_URL}/PaymentFailed?reason=" +
          encodeURIComponent(errorMsg);
      }
    },
    onComplete: function (payment) {
      console.log("[Client] onComplete triggered:", payment);
    }
  });
</script>
</body>
</html>`;
  res.send(html);
});

// POST /verify-payment
router.post("/verify-payment", async (req, res) => {
  try {
    const { id: paymentId, userId, planTitle, amount, status, token, mydata } = req.body;
    console.log(`[verify-payment] Received: paymentId=${paymentId}, userId=${userId}, planTitle=${planTitle}`);

    // Validate userId
    if (!userId || userId === "undefined" || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("[verify-payment] Invalid or missing userId");
      return res.status(400).json({ success: false, error: "Invalid or missing userId" });
    }

    // try catch
  
      const response = await axios.get(
        `https://api.moyasar.com/v1/payments/${paymentId}`,
        { auth: { username: MOYASAR_SECRET_KEY, password: "" } }
      );
      console.log("response---->" + JSON.stringify(response.data));
   
   


    const paymentData = response.data;
    console.log("[verify-payment] Payment data:", paymentData);

    if (IS_TEST_MODE && paymentData.status === "initiated" && paymentData.source?.transaction_url) {
      paymentData.source.transaction_url = `https://api.moyasar.com/v1/card_auth/test_3ds/prepare`;
    }

    if (paymentData.status === "initiated" && paymentData.source?.transaction_url) {
      return res.json({ success: false, requiresAction: true, transactionUrl: paymentData.source.transaction_url });
    }

    if (paymentData.status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const { user, plan } = await activateSubscription(userId, planTitle, paymentData.source);

    const totalUsers = await countTotalUsers(userId);
    await PaymentHistory.create({
      userId,
      seat: totalUsers,
      amount: paymentData.amount,
      paymentId: paymentData.id,
      status: paymentData.status,
      token: paymentData.source?.token || null, // Store token permanently
      planTitle,
      createdAt: new Date(),
    });

    console.log(`[verify-payment] Payment history saved with token: ${paymentData.source?.token || 'none'}`);
    return res.json({
      success: true,
      payment: paymentData,
      cardToken: paymentData.source?.token || null,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("[verify-payment] Error:", error.message, error.stack);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /callback
router.get("/callback", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(`[callback] Received paymentId: ${id}`);

    if (!id) {
      const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
      errorUrl.searchParams.append("reason", "Invalid payment data");
      console.error("[callback] Missing paymentId");
      return res.redirect(errorUrl.toString());
    }

    const response = await axios.get(
      `https://api.moyasar.com/v1/payments/${id}`,
      { auth: { username: MOYASAR_SECRET_KEY, password: "" } }
    );

    const payment = response.data;
    console.log("[callback] Payment data:", payment);

    // Handle test mode for 3DS transaction URL
    if (IS_TEST_MODE && payment.status === "initiated" && payment.source?.transaction_url) {
      payment.source.transaction_url = `https://api.moyasar.com/v1/card_auth/test_3ds/prepare`;
    }

    // Handle 3DS redirection
    if (payment.status === "initiated" && payment.source?.transaction_url) {
      console.log("[callback] Payment requires 3DS authentication, redirecting to:", payment.source.transaction_url);
      return res.redirect(payment.source.transaction_url);
    }

    // Check payment status
    if (payment.status !== "paid") {
      const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
      errorUrl.searchParams.append("reason", `Payment not completed: ${payment.status}`);
      console.error(`[callback] Payment not completed: ${payment.status}`);
      return res.redirect(errorUrl.toString());
    }

    // Validate metadata
    const { userId, planTitle } = payment.metadata || {};
    if (!payment.metadata) {
      const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
      errorUrl.searchParams.append("reason", "Missing payment metadata");
      console.error("[callback] Missing payment metadata");
      return res.redirect(errorUrl.toString());
    }

    if (!userId || userId === "undefined" || !mongoose.Types.ObjectId.isValid(userId)) {
      const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
      errorUrl.searchParams.append("reason", "Invalid or missing userId in metadata");
      console.error(`[callback] Invalid or missing userId: ${userId}`);
      return res.redirect(errorUrl.toString());
    }

    if (!planTitle) {
      const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
      errorUrl.searchParams.append("reason", "Missing planTitle in metadata");
      console.error("[callback] Missing planTitle");
      return res.redirect(errorUrl.toString());
    }

    // Activate subscription
    const { user } = await activateSubscription(userId, planTitle, payment.source);

    // Save payment history
    const totalUsers = await countTotalUsers(userId);
    await PaymentHistory.create({
      userId,
      seat: totalUsers,
      amount: payment.amount,
      paymentId: payment.id,
      parentId: userId,
      status: payment.status,
      token: payment.source?.token || null, // Store token permanently
      planTitle,
      createdAt: new Date(),
    });

    console.log(`[callback] Payment history saved with token: ${payment.source?.token || 'none'}`);
    // Redirect to success page
    const successUrl = new URL(`${FRONTEND_URL}/PaymentSuccess`);
    const params = {
      status: "success",
      paymentId: payment.id,
      userId,
      planTitle,
      amount: (payment.amount / 100).toFixed(2),
      date: new Date().toISOString(),
      ...(payment.source?.token && { token: payment.source.token }),
    };

    Object.entries(params).forEach(([key, value]) => {
      successUrl.searchParams.append(key, value);
    });

    console.log("[callback] Redirecting to success URL:", successUrl.toString());
    return res.redirect(successUrl.toString());
  } catch (error) {
    console.error("[callback] Error:", error.message, error.stack);
    const errorUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
    errorUrl.searchParams.append("reason", error.message);
    return res.redirect(errorUrl.toString());
  }
});

module.exports = router;