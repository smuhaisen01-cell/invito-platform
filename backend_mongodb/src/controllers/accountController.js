const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { generateSignupToken } = require("../services/authService");
const { sendEmail } = require("../services/emailService");

const { ERROR_MESSAGES } = require("../utils/constants");

exports.create = async (req, res) => {
  try {
    const { email, password, name, parentId, signupType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: ERROR_MESSAGES.EMAIL_EXISTS,
      });
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      parentId: parentId || null,
      signupType: signupType || "email",
      emailVerify: false, // Set initial emailVerify to false
      emailVerifyAt: Date.now(), // Set unique timestamp for token generation
    });

    await newUser.save();

    // Generate signup verification token
    const verificationToken = generateSignupToken(newUser);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verifyemail?token=${verificationToken}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en" style="background: #faf9fe;">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Verify your Invito account</title>
          <style>
            body {
              background: #faf9fe;
              font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
              color: #22223b;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 480px;
              margin: 40px auto;
              background: #fff;
              border-radius: 16px;
              box-shadow: 0 4px 24px rgba(88,41,207,0.08);
              padding: 32px 24px 24px 24px;
            }
            .logo {
              text-align: center;
              color: #5829cf;
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 24px;
              letter-spacing: 2px;
            }
            .greeting {
              font-size: 1.1rem;
              margin-bottom: 12px;
            }
            .message {
              margin-bottom: 24px;
              color: #4a4e69;
            }
            .verify-btn {
              display: inline-block;
              background: #5829cf;
              color: #fff !important;
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-size: 1rem;
              font-weight: 500;
              margin: 16px 0;
              transition: background 0.2s;
            }
            .verify-btn:hover {
              background: #3d1b99;
            }
            .footer {
              margin-top: 32px;
              font-size: 0.95rem;
              color: #8d99ae;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Invito</div>
            <div class="greeting">Hi ${newUser.name},</div>
            <div class="message">
              Thank you for signing up for Invito!<br/>
              Please verify your email address to activate your account.
            </div>
            <div style="text-align:center;">
              <a href="${verificationUrl}" class="verify-btn">Verify Your Email</a>
            </div>
            <div class="message" style="margin-top:24px;">
              If you did not sign up for Invito, you can safely ignore this email.
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Invito. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;
    let emailDelivery = { sent: true };
    try {
      await sendEmail(
        newUser.email,
        "Verify your Invito account",
        `Hi ${newUser.name},\n\nPlease verify your account: ${verificationUrl}`,
        html
      );
    } catch (emailError) {
      if (emailError.message === "Mailgun configuration is missing") {
        emailDelivery = {
          sent: false,
          reason: "mail_not_configured",
        };
        console.warn(
          `Mailgun is not configured, so the verification email to ${newUser.email} was skipped`
        );
      } else {
        throw emailError;
      }
    }

    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      emailVerify: newUser.emailVerify,
      signupType: newUser.signupType,
      verificationToken,
      emailDelivery,
    });
  } catch (error) {
    console.error("Account creation error:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

exports.verify = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "signup") {
      return res.status(400).json({ success: false, message: "Invalid token type" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Check if token is already used
    if (
      !user.emailVerifyAt ||
      !decoded.emailVerifyAt ||
      user.emailVerifyAt.getTime() !== new Date(decoded.emailVerifyAt).getTime()
    ) {
      return res.status(400).json({ success: false, message: "Verification token has expired. Please request a new one." });
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
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};
