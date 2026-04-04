const nodemailer = require('nodemailer');
const config = require('../config/emailConfig');
const Mailgun = require('mailgun.js');
const FormData = require('form-data');

function getMailgunClient() {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({
    username: process.env.MAILGUN_USERNAME || 'api',
    key: process.env.MAILGUN_API_KEY,
    url: process.env.MAILGUN_URL || 'https://api.mailgun.net',
  });
}

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailgunClient = getMailgunClient();
    if (!mailgunClient) {
      throw new Error('Mailgun configuration is missing');
    }

    const mailOptions = {
      from: config.mailgun.from || `Invito Team <${process.env.MAILGUN_EMAIL || 'no-reply@yourdomain.com'}>`,
      to,
      subject,
      text,
      html,
    };
    await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    return { success: true };
  } catch (error) {
    console.error('sendEmail error:', error);
    throw error; // Let the caller handle the error
  }
};

module.exports = { sendEmail }; 
