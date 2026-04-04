const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const FormData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(FormData);
const axios = require("axios");

exports.getMe = (req, res) => {
  return res.status(200).json({ success: true, message: 'User info endpoint' });
};

exports.confirmEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  try {
    // Verify JWT and check type
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'signup') {
      return res.status(400).json({ success: false, message: 'Invalid token type' });
    }
    // Update user
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { emailVerify: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Create authorization token
    const authorizationToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(200).json({
      success: true,
      authorizationToken,
      userId: user._id,
      email: user.email
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.verifyEmailToken = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'signup') {
      return res.status(400).json({ success: false, message: 'Invalid token type' });
    }
    return res.status(200).json({
      success: true,
      userId: decoded.id,
      email: decoded.email
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.verifyEmailTokenPost = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    if (decoded.type !== 'invite') {
      return res.status(400).json({ success: false, message: 'Invalid token type' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded.id },
      { emailVerify: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      userId: updatedUser._id,
      email: updatedUser.email
    });

  } catch (err) {
    console.error('Token Verification Error:', err);
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};


const inviteEmailTemplate = (name, role, token, inviterId, inviterName = 'Invito Team') => {
  const link = `${process.env.FRONTEND_URL}/setnewpassword?token=${token}&parentId=${inviterId}`;
  return `
  <div style="font-family:Arial,sans-serif;color:#333;">
    <h2 style="color:#5829CF;">Welcome to Invito, ${name}!</h2>
    <p>You have been invited as a <strong>${role}</strong>. Please set up your password by clicking below:</p>
    <a href="${link}" 
       style="display:inline-block;padding:12px 24px;background:#5829CF;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
       Set your password
    </a>
    <p>Best regards,<br/>${inviterName}</p>
    <hr/>
    <small style="color:#999;">If you didn't expect this email, ignore it.</small>
  </div>`;
};


// Initialize Mailgun
const mg = mailgun.client({
  username: process.env.MAILGUN_USERNAME || 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_URL || 'https://api.mailgun.net', 
});

exports.sendInvite = async (req, res) => {
  const { name, role, email } = req.body;
  
  if (!name || !role || !email) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already invited or registered' });
    }
    const inviterId = req.user.id;


    user = new User({ name, email, role, emailVerify: false, signupType: 'email', isActive: true,
       parentId: inviterId,
      });
    await user.save();

    const token = jwt.sign({ id: user._id, type: 'invite' }, process.env.JWT_SECRET);
    console.log('inviterId: ' + inviterId);

    // Send invite email with token link using Mailgun
    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Invito Team <${process.env.MAILGUN_EMAIL || 'no-reply@yourdomain.com'}>`,
      to: email,
      subject: `You're invited to Invito as ${role}`,
      html: inviteEmailTemplate(name, role, token, inviterId),
    });

    console.log(`Email sent successfully to ${email} for role ${role} with token ${token}`);

    return res.status(200).json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('sendInvite error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
};
exports.setNewPassword = async (req, res) => {
  const { token, password,parentid } = req.body;
  console.log(token,password);
  
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and password are required" });
  }

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional check if token type is invite/reset
    if (decoded.type !== "invite") {
      return res.status(400).json({ success: false, message: "Invalid token type" });
    }

    // 2. Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update user password and optionally mark email verified
    user.password = hashedPassword;
    user.emailVerify = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in."
    });

  } catch (error) {
    console.error("setNewPassword error:", error.message);
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const decodeId = req.user._id;

    const currentUser = await User.findById(decodeId).select("-password");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let parentIdToUse;

    // Step 2: Determine whether user is parent or child
    if (currentUser.parentId) {
      // If user is a child, use their parentId
      parentIdToUse = currentUser.parentId;
    } else {
      // If user is a parent, use their own ID
      parentIdToUse = currentUser._id;
    }

    // Step 3: Fetch parent and all users under that parentId
    const users = await User.find({
      $or: [
        { _id: parentIdToUse },       
        { parentId: parentIdToUse }  
      ]
    }).select("-password");

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("getAllUsers error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};
exports.getAllUsersCount = async (req, res) => {
  try {
    const decodeId = req.user._id;

    const currentUser = await User.findById(decodeId).select("-password");
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let parentIdToUse;

    // Step 2: Determine whether user is parent or child
    if (currentUser.parentId) {
      // If user is a child, use their parentId
      parentIdToUse = currentUser.parentId;
    } else {
      // If user is a parent, use their own ID
      parentIdToUse = currentUser._id;
    }

    // Step 3: Fetch parent and all users under that parentId
    const users = await User.find({
      $or: [
        { _id: parentIdToUse },       
        { parentId: parentIdToUse }  
      ]
    }).select("-password");

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("getAllUsers error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).send({
        message: "No users found",
        data: []
      });
    }

    return res.status(200).send({
      message: "Users fetched successfully",
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the authenticated request
    const user = await User.findById(userId).select("-password"); //
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // if user has subscription, set EventTrial to 1
    if (user.subscription?.isActive) {
      user.EventTrial = 1;
    }
    
    return res.status(200).json({
      success: true,
      user
    });
  }
    catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
}

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if token exists in user subscription
    if (!user.subscription || !user.subscription.source || !user.subscription.source.token) {
      return res.status(400).json({ success: false, message: "No payment token found for this user" });
    }

    const tokenId = user.subscription.source.token; // ✅ no optional chaining here
    const secretKey = process.env.MOYASAR_SECRET_KEY;

    // Delete token from Moyasar
    await axios.delete(`https://api.moyasar.com/v1/tokens/${tokenId}`, {
      auth: {
        username: secretKey,
        password: "" // Moyasar only needs the secret key
      }
    });

    // Update subscription fields in DB
    user.subscription.isActive = false;
    user.subscription.iscancelled = true;

    if (user.subscription.source) {
      user.subscription.source.token = null;
      user.markModified("subscription.source");
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled and token removed successfully",
      user
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.response?.data || error.message
    });
  }
};
