const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateSignupToken = (user) => {
  return jwt.sign({ 
    id: user._id, 
    email: user.email, 
    type: 'signup',
    emailVerifyAt: user.emailVerifyAt 
  }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateSignupToken,
}; 