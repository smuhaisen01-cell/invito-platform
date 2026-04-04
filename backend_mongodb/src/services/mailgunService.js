const formData = require("form-data");
const Mailgun = require("mailgun.js");
const fs = require("fs");
const path = require("path");
const { htmlToText } = require("html-to-text");

// Static image configuration
const STATIC_IMAGE_URL =
  "https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg";

const config = require("../config/mailgunConfig");
const emailTemplateConfig = require("../config/emailTemplateConfig");

function getMailgunClient() {
  if (!config.mailgun.apiKey || !config.mailgun.domain) {
    return null;
  }

  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: config.mailgun.username,
    key: config.mailgun.apiKey,
  });
}

// Centralized email sending function
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailgunClient = getMailgunClient();
    if (!mailgunClient) {
      throw new Error("Mailgun configuration is missing");
    }

    const data = {
      from: `${config.mailgun.fromName} <${config.mailgun.email}>`,
      to,
      subject,
      html,
      text: text || htmlToText(html),
    };
    const result = await mailgunClient.messages.create(config.mailgun.domain, data);
    return result;
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Generate unsubscribe link to match the React route
const generateUnsubscribeLink = (contactId) => {
  // Use environment variable for base URL in production
  const baseUrl = process.env.UNSUBSCRIBE_BASE_URL ;
  // Sanitize contactId to prevent injection
  const safeContactId = encodeURIComponent(contactId);
  return `${baseUrl}/unsubscribe/${safeContactId}`;
};

// Send event email with template
const sendEventEmail = async (to, subject, template) => {
  console.log('sendEventEmail '+ template.title, to);
  
  const htmlTemplate = fs.readFileSync(
    path.join(__dirname, "../template/event-template-3.html"),
    "utf8"
  );

  // Format description for HTML
  const descriptionWithBreaks = template.description
    .replace(/  /g, "&nbsp;&nbsp;")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/\r?\n/g, "<br>");

  // Replace placeholders in the HTML template
  const finalHTML = htmlTemplate
    .replace("{{title}}", template.title)
    .replace("{{description}}", descriptionWithBreaks)
    .replace("{{image_url}}", process.env.NODE_ENV =='local' ? STATIC_IMAGE_URL : template.image_url)
    .replace("{{footer}}", template.footer)
    .replace("{{rsvp_link}}", emailTemplateConfig.eventTemplate.rsvp_link)
    .replace("{{instagram_link}}", emailTemplateConfig.eventTemplate.instagram_link)
    .replace("{{event_link}}", template.event_link)
    .replace("{{linkedin_link}}", emailTemplateConfig.eventTemplate.linkedin_link)
    .replace("{{website_link}}", emailTemplateConfig.eventTemplate.website_link)
    .replace("{{unsubscribe_link}}", generateUnsubscribeLink(template.contact_id));

  return sendEmail(to, subject, finalHTML);
};

module.exports = {
  sendEmail, // Renamed for clarity
  sendEventEmail,
  STATIC_IMAGE_URL,
};
