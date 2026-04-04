const express = require("express");
const router = express.Router();
const axios = require("axios");
const cors = require("cors");
const Plan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const PaymentHistory = require('../models/PaymentHistory');
const cron = require('node-cron');

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const IS_TEST_MODE = process.env.NODE_ENV === "local";

// Middleware
router.use(cors());
router.use(express.json());

// Helper: Get next month date
function getNextMonthDate(currentDate) {
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth;
}

// Helper: Validate payment token
function isValidToken(token) {
  return typeof token === 'string' && token.startsWith('token_') && token.length > 10;
}

// Helper: Count total users (parent + children) based on parentId
async function countTotalUsers(parentId) {
  try {
    const childCount = await User.countDocuments({ parentId: parentId });
    console.log(`[countTotalUsers] Found ${childCount} child users for parentId: ${parentId}`);
    return childCount + 1; // Add 1 to include the parent
  } catch (error) {
    console.error('[countTotalUsers] Error counting total users:', error.message);
    return 1; // Default to 1 in case of error to avoid zero amount
  }
}

// Helper: Update isActive for child users
async function updateChildUsersIsActive(parentId, isActive = true) {
  try {
    const result = await User.updateMany(
      { parentId: parentId },
      { $set: { 'subscription.isActive': isActive } }
    );
    console.log(`[updateChildUsersIsActive] Updated ${result.modifiedCount} child users for parentId: ${parentId}`);
  } catch (error) {
    console.error('[updateChildUsersIsActive] Error updating child users:', error.message);
  }
}

// Helper: Save payment to PaymentHistory
async function savePaymentToHistory(userId, payment, planTitle, seat) {
  try {
    const paymentRecord = new PaymentHistory({
      parentId:userId,
      paymentId: payment.id,
      amount: payment.amount / 100, // Convert halalas to SAR
      status: payment.status,
      planTitle,
      seat,
      paymentDate: new Date(),
      source: payment.source,
    });
    await paymentRecord.save();
    console.log(`[savePaymentToHistory] Payment saved for user ${userId}, paymentId: ${payment.id}`);
  } catch (error) {
    console.error('[savePaymentToHistory] Error saving payment:', error.message);
  }
}

// Helper: Activate subscription with reusable source
async function activateSubscription(userId, planTitle, source) {
  console.log(`[activateSubscription] Starting for user: ${userId}, plan: ${planTitle}`);
  const [user, plan] = await Promise.all([
    User.findById(userId),
    Plan.findOne({ name: { $regex: new RegExp(`^${planTitle}$`, "i") } }),
  ]);

  if (!user) {
    console.error("[activateSubscription] User not found");
    throw new Error("User not found");
  }
  if (!plan) {
    console.error(`[activateSubscription] Plan not found: ${planTitle}`);
    throw new Error(`Plan not found: ${planTitle}`);
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.durationInDays);

  user.subscription = {
    planId: plan._id,
    planName : plan.name,
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

  if (source?.token && source.token.startsWith("src_")) {
    user.subscription.source = source;
    console.log(`[activateSubscription] Updated subscription with reusable source: ${source.token}`);
  } else if (source?.token && source.token.startsWith("token_")) {
    console.warn(`[activateSubscription] One-time token detected: ${source.token}. Re-authentication required for auto-renewal.`);
  }

  await user.save();
  console.log(`[activateSubscription] Subscription activated for user ${userId}`);
  return { user, plan };
}

// Charge card using token (One-time)
async function processAutoPayment(user, plan, source, retryCount = 0, maxRetries = 3) {
  console.log(`[autoPayment] Processing payment for user: ${user._id}, plan: ${plan.name}, attempt: ${retryCount + 1}`);

  if (!source || !isValidToken(source.token)) {
    throw new Error('Invalid or missing payment token');
  }

  if (!plan || !plan.price || plan.price <= 0) {
    throw new Error('Invalid or zero plan price');
  }

  const totalUserCount = await countTotalUsers(user._id);
  const totalAmount = plan.price * totalUserCount;

  console.log(`[autoPayment] Using token: ${source.token.substring(0, 10)}...`);

  try {
    const paymentData = {
      amount: Math.round(totalAmount * 100), // Convert to smallest currency unit (halalas for SAR)
      currency: 'SAR',
      description: `Auto-renewal for ${plan.name} plan - ${totalUserCount} users`,
      source: {
        type: 'token',
        token: source.token,
      },
      callback_url: `${FRONTEND_URL}/payment/callback`,
    };

    console.log(`[autoPayment] Sending payment request for user ${user._id}:`, {
      amount: paymentData.amount,
      currency: paymentData.currency,
      sourceType: paymentData.source.type,
      totalUserCount: totalUserCount,
    });

    const response = await axios.post(
      'https://api.moyasar.com/v1/payments',
      paymentData,
      {
        auth: { username: MOYASAR_SECRET_KEY, password: '' },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const payment = response.data;
    console.log(`[autoPayment] Payment response for user ${user._id}:`, {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
    });

    if (payment.status === 'paid') {
      const currentEndDate = new Date(user.subscription.endDate);
      const newStartDate = new Date();
      const newEndDate = getNextMonthDate(currentEndDate);

      // Save payment to history
      await savePaymentToHistory(user._id, payment, plan.name, totalUserCount);

      // Update parent user subscription
      user.subscription = {
        planId: plan._id,
        planName: plan.name,
        startDate: newStartDate,
        endDate: newEndDate,
        isActive: true,
        lastPaymentId: payment.id,
        lastPaymentDate: new Date(),
        autoRenew: true,
        retryCount: 0,
        source: user.subscription.source,
        totalUserCount: totalUserCount,
      };

      await user.save();
      console.log(`[autoPayment] ✅ Subscription renewed for user ${user._id} until ${newEndDate} for ${totalUserCount} users`);

      await updateChildUsersIsActive(user._id, true);

      return { success: true, payment, newEndDate, totalUserCount };
    } else {
      throw new Error(`Payment failed with status: ${payment.status}`);
    }
  } catch (error) {
    console.error(`[autoPayment] Error for user ${user._id}:`, error.message);
    if (error.response) {
      console.error(`[autoPayment] Response Data:`, JSON.stringify(error.response.data, null, 2));
    }

    if (retryCount < maxRetries - 1) {
      console.log(`[autoPayment] Retrying payment for user ${user._id}, attempt ${retryCount + 2}`);
      user.subscription.retryCount = retryCount + 1;
      await user.save();
      return processAutoPayment(user, plan, source, retryCount + 1, maxRetries);
    }

    user.subscription.retryCount = retryCount + 1;
    user.subscription.isActive = false;
    await user.save();
    console.error(`[autoPayment] ❌ Max retries reached for user ${user._id}`);
    return { success: false, error: error.message, details: error.response?.data };
  }
}

// Fetch users from database for renewal
async function fetchUsersForRenewal() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const users = await User.find({
      'subscription.isActive': true,
      'subscription.endDate': { $gte: startOfDay, $lte: endOfDay },
      'subscription.source.token': { $exists: true },
    });

    console.log(`[fetchUsersForRenewal] Found ${users.length} users for renewal`);
    return users;
  } catch (error) {
    console.error('[fetchUsersForRenewal] Error fetching users:', error.message);
    return [];
  }
}

// Cron job
function startAutoPaymentCron() {
  if (!MOYASAR_SECRET_KEY || !FRONTEND_URL) {
    console.warn('[autoPaymentCron] Skipping auto-payment cron because MOYASAR_SECRET_KEY or FRONTEND_URL is missing');
    return;
  }

  cron.schedule('* * * * *', async () => {
    console.log('[autoPaymentCron] Running auto-payment check at', new Date().toISOString());

    try {
      const users = await fetchUsersForRenewal();
      console.log(`[autoPaymentCron] Processing ${users.length} subscriptions expiring today`);

      for (const user of users) {
        const plan = await Plan.findById(user.subscription.planId);
        if (!plan) {
          console.error(`[autoPaymentCron] Plan not found for user ${user._id}`);
          continue;
        }

        try {
          const result = await processAutoPayment(user, plan, user.subscription.source);
          if (result.success) {
            console.log(`[autoPaymentCron] ✅ Payment success for user ${user._id} for ${result.totalUserCount} users`);
          } else {
            console.log(`[autoPaymentCron] ❌ Payment failed for user ${user._id}: ${result.error}`);
          }
        } catch (err) {
          console.error(`[autoPaymentCron] Error processing user ${user._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[autoPaymentCron] Critical error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[autoPaymentCron] ✅ Scheduled auto-payment cron');
}



module.exports = { router, startAutoPaymentCron, processAutoPayment };
