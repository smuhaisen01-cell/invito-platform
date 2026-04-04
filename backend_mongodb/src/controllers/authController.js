const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { sendEmail } = require("../services/emailService");
const SubscriptionPlan = require("../models/SubscriptionPlan");
 async function seedInitialPlans() {
    const planCount = await SubscriptionPlan.countDocuments();
    if (planCount === 0) {
      const plans = [
        {
          name: "Bronze",
          price: 2000, // 20.00 SAR in halalas (1 SAR = 100 halalas)
          durationInDays: 30,
          maxEmails: 100,
          maxWhatsAppMessages: 50,
          features: ["Feature 1", "Feature 2"],
        },
        {
          name: "Silver",
          price: 4000,
          durationInDays: 30,
          maxEmails: 500,
          maxWhatsAppMessages: 200,
          features: ["All Basic features", "Priority Support"],
        },
        {
          name: "Gold",
          price: 6000,
          durationInDays: 30,
          maxEmails: 2000,
          maxWhatsAppMessages: 1000,
          features: ["All Standard features", "24/7 Support", "API Access"],
        },
      ];
      await SubscriptionPlan.insertMany(plans);
      console.log("Initial plans seeded successfully");
    }
  }
exports.signin = async (req, res) => {
  const { email, password } = req.body;
 
  
  // Initialize database
  seedInitialPlans().catch(console.error);
  
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    // Check if email is verified
    if (!user.emailVerify) {
      return res.status(403).json({
        success: false,
        message:
          "Your email is not verified. Please verify your email before logging in.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      token,
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Your token is invalid" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verify = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }
  try {
    // Verify JWT and check type
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "signup") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token type" });
    }
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Check if token is already used
    if (
      !user.emailVerifyAt ||
      !decoded.emailVerifyAt ||
      user.emailVerifyAt.getTime() !== new Date(decoded.emailVerifyAt).getTime()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Verification token has expired. Please request a new one.",
        });
    }
    // Mark email as verified and update emailVerifyAt
    user.emailVerify = true;
    user.emailVerifyAt = Date.now(); // Invalidate all previous tokens
    await user.save();
    // Create authorization token for login
    const authorizationToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      authorizationToken,
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

exports.googleSignup = async (req, res) => {
  const { email, token } = req.body;
  seedInitialPlans().catch(console.error);

  if (!email || !token) {
    return res
      .status(400)
      .json({ success: false, message: "Email and token are required" });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });

    let isNewUser = false;

    if (!user) {
      // New user, so we flag it
      isNewUser = true;

      user = new User({
        email: email.toLowerCase(),
        name: email.split("@")[0],
        signupType: "gmail",
        emailVerify: true,
        password: null,
        isActive: true,
      });

      await user.save();
    }

    const authorizationToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      authorizationToken,
      userId: user._id,
      email: user.email,
      isNewUser, 
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Google signup failed",
      error: err.message,
    });
  }
};


exports.resetPasswordRequest = async (req, res) => {
  console.log('email');
  const { email } = req.body;
  
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Set passwordResetAt timestamp for unique token generation
    user.passwordResetAt = Date.now();
    await user.save();

    // Generate JWT token for password reset
    const resetToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: "reset",
        passwordResetAt: user.passwordResetAt,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create reset linkqrContent
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword?token=${resetToken}`;
    const html = `
    <div style="background:#faf9fe;padding:20px;min-height:100vh;">
      <img src="${process.env.BACKEND_URL}/uploads/images/invito.png" alt="Invito Logo" style="width: 100px; display:flex; justify-self:center; align-items:center;">
        <h2 style="color:#5829cf; justify-self:center;">Invito</h2>
        <p>Hi ${user.name || user.email},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="background:#5829cf;color:#fff;padding:12px 24px;text-decoration:none;border-radius:12px;display:inline-block;margin:8px 0;">Reset Password</a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;
    await sendEmail(
      user.email,
      "Reset your Invito password",
      `Hi ${user.name || user.email},\n\nReset your password: ${resetUrl}`,
      html
    );

    res.json({ success: true, message: "Password reset email sent" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push("minimum 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("at least one special character");
  }
  if (errors.length === 0) return null;
  let msg =
    "Please enter a stronger password: " +
    errors.join(", ").replace(/, ([^,]*)$/, ", and $1") +
    ".";
  return msg;
}

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Token and new password are required" });
  }

  // Password validation
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "reset") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token type" });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.email !== decoded.email) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Check if token is already used
    if (
      !user.passwordResetAt ||
      !decoded.passwordResetAt ||
      user.passwordResetAt.getTime() !==
        new Date(decoded.passwordResetAt).getTime()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Reset token has expired. Please request a new one.",
        });
    }
    // **HASH THE PASSWORD BEFORE SAVING**
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    user.passwordResetAt = Date.now();
    await user.save();
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Reset token has expired. Please request a new one.",
        });
    }
    if (err.name === "JsonWebTokenError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reset token." });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
