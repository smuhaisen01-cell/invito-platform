const nodemailer = require('nodemailer');
const config = require('../config/emailConfig');
const Mailgun = require('mailgun.js');
const FormData = require('form-data');

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: process.env.MAILGUN_USERNAME || 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_URL || 'https://api.mailgun.net',
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: config.mailgun.from || `Invito Team <${process.env.MAILGUN_EMAIL || 'no-reply@yourdomain.com'}>`,
      to,
      subject,
      text,
      html,
    };
    await mg.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    return { success: true };
  } catch (error) {
    console.error('sendEmail error:', error);
    throw error; // Let the caller handle the error
  }
};

module.exports = { sendEmail }; 