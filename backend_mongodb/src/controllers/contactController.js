const Contact = require("../models/Contact");
const Event = require("../models/Event");
const axios = require("axios");
const QRCode = require("qrcode");
const FormData = require("form-data");
const Mailgun = require("mailgun.js");
const cron = require("node-cron");
const { STATIC_IMAGE_URL } = require("../services/mailgunService");
// Initialize Mailgun client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: process.env.MAILGUN_USERNAME || "api",
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_URL || "https://api.mailgun.net",
});

// Validate required environment variables at startup
if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  throw new Error("Mailgun configuration is missing");
}

// Create a new contact
exports.createContact = async (req, res) => {
  try {
    const { parentId, eventId, name, number, email, date } = req.body;

    if (!parentId || !eventId || !name) {
      return res.status(400).json({
        success: false,
        message: "parentId, eventId, and name are required.",
      });
    }

    const contact = new Contact({
      parentId,
      eventId,
      name,
      number,
      email,
      date,
    });

    await contact.save();

    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
      contact,
    });
  } catch (error) {
    console.error("Contact creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a user's invitation approval status
exports.updatedUserInvitation = async (req, res) => {
  const { contactId, approved } = req.body;

  if (!contactId || typeof approved !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "contactId and approved (boolean) are required",
    });
  }

  try {
    // Find user contact
    const user = await Contact.findById(contactId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update approval flag
    user.isEmailApproved = approved;
    user.isEmailApprovedAt = new Date();
    await user.save();

    if (approved && user.email) {
      // Fetch event for QR content
      const event = await Event.findById(user.eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }

      // Send QR code email
      await sendQREmail(user, event);
    }

    res.status(200).json({
      success: true,
      message: `Contact ${contactId} has been ${approved ? "approved" : "disapproved"} successfully`,
    });
  } catch (error) {
    console.error("Error updating contact and sending QR code email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact or send email",
      error: error.message,
    });
  }
};

// Send QR code email
async function sendQREmail(contact, event) {
  try {
    if (!event) {
      throw new Error("Event data is missing");
    }

    const qrContent = `${process.env.FRONTEND_URL}/EventTemplate?contactId=${contact._id}&eventId=${contact.eventId}&source=email`;

    // Generate QR code buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      color: { dark: "#000000", light: "#FFFFFF" },
      margin: 2,
      width: 400,
    });

    console.log("QR Code Buffer", qrCodeBuffer);

    // Updated HTML with Gmail-compatible centering
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f7fc; border-radius: 18px; box-shadow: 0 4px 24px rgba(123,91,242,0.08); padding: 32px 24px;">
        <div style="text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #7B5BF2; margin-bottom: 16px; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif;">
            Invito
          </div>
        </div>
        <h2 style="color: #7B5BF2; text-align: center; margin-bottom: 8px;">You're Invited!</h2>
        <p style="color: #333; font-size: 18px; text-align: center; margin-bottom: 24px;">
          Dear <strong>${contact.name}</strong>,
        </p>
      
               
        <div style="background: #f1eeff; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <h3 style="color: #7B5BF2; margin: 0 0 10px 0; font-size: 20px;">Event Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0; color: #333; font-size: 16px;">
            <li style="margin-bottom: 8px;"><strong>📍 Location:</strong> ${event.location || "To be announced"}</li>
            <li><strong>🗓️ Date & Time:</strong> ${event.eventDateTime
        ? new Date(event.eventDateTime).toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
        : "To be confirmed"
      }</li>
          </ul>
        </div>
        
        <!-- Gmail-compatible QR code centering -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: #fff; border: 4px solid #7B5BF2; border-radius: 18px; padding: 16px; box-shadow: 0 2px 12px rgba(123,91,242,0.10);">
                    <img src="cid:event_qrcode.png" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>


          <p style="color: #444; font-size: 16px; text-align: center; margin-bottom: 24px;">
          Thank you for accepting the invitation to <strong>${event.title || "our event"}</strong>.<br>
          Please present the QR code below at the entrance.
        </p>
 
        <p style="color: #444; font-size: 15px; text-align: center; margin-bottom: 0;">
          We look forward to seeing you there!<br>
          <span style="color: #7B5BF2; font-weight: bold;">The Invito Team</span>
        </p>
      </div>
    `;

    // Also fixed the CID reference to match
    const mailOptions = {
      from: `"Invito Event Team" <${process.env.MAILGUN_FROM_EMAIL || "info@nexplat.sa"}>`,
      to: contact.email,
      subject: `🎟️ Your QR Code for ${event.title || "Our Event"}`,
      html: htmlContent,
      contentType: "image/png",
      inline: [
        {
          data: qrCodeBuffer,
          filename: "event_qrcode.png",
          contentType: "image/png",
          knownLength: qrCodeBuffer.length,
          cid: "event_qrcode.png", // Fixed to match the src attribute
        },
      ],
    };

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    console.log(`QR code email sent to ${contact.email}: ${result.id}`);
    return result;
  } catch (error) {
    console.error("Error sending QR code email:", error);
    throw error;
  }
}

// Update user's subscription status
exports.setUnsubscribed = async (req, res) => {
  const { contactId, isSubscribed, source } = req.body;

  if (!contactId || typeof isSubscribed !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "contactId and isSubscribed (boolean) are required",
    });
  }

  try {
    const user = await Contact.findById(contactId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (source === "email") {
      user.EmailUnsubscribe = true;
      user.EmailUnsubscribeAt = new Date();
    } else {
      user.isWhatsappUnscribed = true;
      user.isWhatsappUnscribedAt = new Date();
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Contact ${contactId} subscription status updated successfully`,
    });
  } catch (error) {
    console.error("Error updating contact subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Failed to update contact subscription.",
      error: error.message,
    });
  }
};

// Reusable Mailgun email sender supporting inline images with CID
async function sendMailgunEmail(to, subject, html, attachments = []) {
  try {
    const mailOptions = {
      from: `"${process.env.MAILGUN_FROM_NAME || "Invito"}" <${process.env.MAILGUN_FROM_EMAIL || "info@nexplat.sa"}>`,
      to,
      subject,
      html,
      attachment: attachments.map((att) => ({
        filename: att.filename,
        data: att.content,
        contentType: att.contentType || "image/png",
        cid: att.cid,
      })),
    };

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    console.log(`Email sent to ${to}: ${result.id}`);
    return result;
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      status: error.status,
      details: error.details || "No additional details",
    });
    throw error;
  }
}

// Send QR code via WhatsApp
async function sendQRWhatsApp(contact, event) {
  try {
    const { _id: contactId, number, eventId } = contact;
    const {
      FRONTEND_URL,
      WHATSAPP_API_VERSION = "v20.0",
      WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_TOKEN,
    } = process.env;

    // Step 1: Generate QR code buffer
    const qrContent = `${FRONTEND_URL}/EventTemplate?contactId=${contactId}&eventId=${eventId}&source=whatsapp`;
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      color: { dark: "#000000", light: "#FFFFFF" },
      margin: 2,
      width: 400,
    });

    // Step 2: Upload image as form-data
    const form = new FormData();
    form.append("file", qrCodeBuffer, {
      filename: "qrcode.png",
      contentType: "image/png",
    });
    form.append("messaging_product", "whatsapp");

    const uploadResponse = await axios.post(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          ...form.getHeaders(), // VERY IMPORTANT
        },
      }
    );

    const mediaId = uploadResponse.data.id;

    // Step 3: Format caption
    const eventDateTimeSaudi = formatEventDateTimeToSaudi(event.eventDateTime);
    const caption = formatWhatsAppCaption(event, eventDateTimeSaudi);

    // Step 1: Send message with media_id (QR code)
    const messagePayload = {
      messaging_product: "whatsapp",
      to: number,
      type: "image",
      image: {
        id: mediaId,
        caption,
      },
    };

    await axios.post(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ QR code sent to ${number}`);


  } catch (error) {
    console.error("❌ Error sending QR code via WhatsApp:", error?.response?.data || error.message || error);
  }
}


// Format event date/time to Saudi Arabia time zone
function formatEventDateTimeToSaudi(eventDateTime) {
  if (!eventDateTime) return "";
  try {
    const date = new Date(eventDateTime);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Riyadh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return eventDateTime;
  }
}

// Format WhatsApp caption
function formatWhatsAppCaption(event, eventDateTimeSaudi) {
  const eventTitle = event?.title || "Event";
  const eventLocation = event?.location || "To be announced";
  const eventTime = eventDateTimeSaudi ? `🕒 Time: ${eventDateTimeSaudi}\n` : "";
  const footer = "\nPlease present this QR code at the entrance for verification. Thank you for joining us!";
  return (
    `🎉 *You're Invited!*\n\n` +
    `🎟️ This is your entry QR code for *${eventTitle}*.\n\n` +
    eventTime +
    `📍 Location: ${eventLocation}\n` +
    footer
  ).trim();

}



// Process WhatsApp message

exports.whatsappMessage = async (req, res) => {
  // every request send to webhook will be logged
  // const axios = require("axios");
  try {
    console.log("📩 Webhook request received1", JSON.stringify(req.body));
    res.sendStatus(200); // Respond immediately to acknowledge webhook
    // console.log("📩 Webhook request received", body);
    var url = "https://chatwoot.zantatech.com/webhooks/whatsapp/+15676230885"
    await axios.post(`${url}`, req.body, { headers: { Authorization: `23cd9bd41e66dd7ddecf5c675d4c3022` } }); // headers: { Authorization: `Bearer ${process.env.CHATWOOT_TOKEN}` } 
  } catch (error) {
    console.error("❌ Webhook Handler Error:", error);
  }
  try {
    const payload = req.body;
    // Enhanced webhook body logging
    console.log("=".repeat(80));
    console.log("📱 WHATSAPP WEBHOOK - POST /whatsapp");
    console.log("=".repeat(80));
    console.log("📦 Request Body:", JSON.stringify(payload, null, 2));
    await Contact.updateOne({})
    console.log("🕒 Timestamp:", new Date().toISOString());
    console.log("=".repeat(80));


    // Extract changes safely
    const change = payload?.entry?.[0]?.changes?.[0];
    if (!change) {
      console.log("No changes found in payload");
      return;
    }
    const statuse = payload?.entry?.[0]?.changes?.[0]?.value?.statuses || [];
    for (const current of statuse) {
      const { id: messageId, status: messageStatus, recipient_id, errors} = current;
      const messageError = errors && errors.length > 0 ? errors[0].title : null;

      
      await Contact.updateOne(
        { $or: [{ number: recipient_id }, { number: `+${recipient_id}` }] },
        { $set: { messageStatus : messageStatus, messageError: messageError} }

      );
    }

    const { value, field } = change;
    if (field !== "messages") {
      console.log(`Ignoring non-message field: ${field}`);
      return;
    }

    const { messaging_product, metadata, messages, statuses } = value;


    // Handle status updates
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        const { id, status: statusType, recipient_id, errors, timestamp } = status;
        console.log(`Status update for message ${id}: ${statusType} to ${recipient_id}`);
        if (statusType === "failed" && errors) {
          console.error("Message delivery failed:", {
            recipient: recipient_id,
            error: errors[0]?.message,
            errorCode: errors[0]?.code,
            details: errors[0]?.error_data?.details,
          });
        }
        // Optionally update contact or event records with status
      }
      return;
    }

    // Handle incoming messages
    if (!messages || messages.length === 0) {
      console.log("No messages found in payload");
      return;
    }

    const message = messages[0];
    const fromNumber = message?.from;
    const buttonText = message?.button?.text;
    const contactName = value?.contacts?.[0]?.profile?.name || "Unknown";

    console.log("Received WhatsApp message:", {
      message: message?.text?.body || buttonText || "No content",
      number: fromNumber,
      contactName,
    });

    if (!fromNumber) {
      console.log("No sender number found in message");
      return;
    }

    // Forward payload in non-local environment
    if (process.env.NODE_ENV !== "local") {
      const FORWARD_URL = "https://1fac664dfe44.ngrok-free.app/api/event/whatsapp";
      axios
        .post(FORWARD_URL, payload)
        .then((response) => {
          console.log(`Webhook forwarded successfully: ${response.status}`);
        })
        .catch((err) => {
          console.error("Error forwarding webhook:", err.message);
        });
    }

    // Find contact
    let user = await Contact.findOne({
      $or: [{ number: `+${fromNumber}` }, { number: fromNumber }],
    }).sort({ _id: -1 });

    if (!user) {
      console.log(`Contact not found for number: ${fromNumber}`);
      return;
    }

    console.log(`Contact found: ${user.name} (${user.number})`);

    // Handle button responses
    if (buttonText === "Accept Invitation") {
      user.isWhatsappApproved = true;
      user.isWhatsappApprovedAt = new Date();
      await user.save();
      console.log(`Updated contact isWhatsappApproved: ${user.name} (${user.number})`);

      let event;
      try {
        event = await Event.findById(user.eventId);
        console.log(`Event found: ${event?.title || "Unnamed Event"}`);
      } catch (err) {
        console.error(`Error fetching event for contact ${user.eventId}:`, err.message);
      }

      if (event) {
        await sendQRWhatsApp(user, event);
        console.log(`WhatsApp QR code sent to ${user.number} for event ${event.title}`);
      } else {
        console.log(`Event not found for contact: ${user.eventId}`);
      }
    } else if (buttonText === "Ask Me Later") {
      user.isWhatsappUnsubscribed = true; // Fixed typo: isWhatsappUnscribed -> isWhatsappUnsubscribed
      await user.save();
      console.log(`Updated contact isWhatsappUnsubscribed: ${user.name} (${user.number})`);

      const messagePayload = {
        messaging_product: "whatsapp",
        to: user.number,
        type: "text",
        text: { body: "We will remind you later about the event invitation." },
      };

      try {
        await axios.post(
          `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v20.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID
          }/messages`,
          messagePayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`Ask Me Later response sent to ${user.number}`);
      } catch (error) {
        console.error(`Error sending Ask Me Later response to ${user.number}:`, {
          message: error.message,
          response: error.response?.data,
        });
      }
    } else {
      console.log(`Unknown button text or message: ${buttonText || message?.text?.body}`);
    }
  } catch (error) {
    console.error("Error processing WhatsApp message:", {
      message: error.message,
      stack: error.stack,
    });
  }
};


async function sendQRReminderWhatsApp({
  recipientPhone, // e.g. '919876543210'
  name,            // e.g. 'Hasnen'
  title,           // e.g. 'Event for Taylor shift'
  location,        // e.g. 'https://...'
  time,            // e.g. '7 Aug 2025 8:00 PM'
  qrImageUrl       // e.g. public image URL for the QR code
}) {
  try {
    const response = await axios.post(
      'https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages',
      {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'template',
        template: {
          name: 'qr_code_reminder',
          language: { code: 'en_US' },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: STATIC_IMAGE_URL
                  }
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: name },
                { type: 'text', text: title },
                { type: 'text', text: location },
                { type: 'text', text: time }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ WhatsApp reminder sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending WhatsApp reminder:', error.response?.data || error.message);
  }
}



// Mark QR code as scanned
exports.markScanned = async (req, res) => {
  const { contactId, eventId, source } = req.body;

  if (!contactId || !eventId || !source) {
    return res.status(400).json({
      success: false,
      message: "contactId, eventId, and source are required",
    });
  }

  if (!["email", "whatsapp"].includes(source)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid source. Must be "email" or "whatsapp"',
    });
  }

  try {
    const updateField =
      source === "email" ? { markEmailScanned: true, markEmailScannedAt: new Date() } : { markWhatScanned: true, markWhatsappScannedAt: new Date() };
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, eventId },
      { $set: { ...updateField, scannedAt: new Date() } },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, message: "Scan status updated", contact });
  } catch (error) {
    console.error("Error updating scan status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get contact by ID
exports.getContactById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  try {
    const user = await Contact.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getContactById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

exports.exportAllContactOfEventId = async (req, res) => {
  const {eventId} = req.params;
  
  if (!eventId) {
    return res.status(400).json({ success: false, message: "Event ID is required" });
  }
  try {
    const event = await Event.findById(eventId).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
        const contacts = await Contact.find({ eventId: eventId }).lean();

    res.status(200).json({ success: true, data: { ...event, contacts } });
  } catch (error) {
    console.error("exportAllContactOfEventId error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Email functions for Signup, Forgot Password, and Book My Spot
exports.sendSignupEmail = async (user) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f7fc; border-radius: 18px; padding: 32px 24px;">
      <h2 style="color: #7B5BF2; text-align: center;">Welcome to Invito!</h2>
      <p style="color: #333; font-size: 18px; text-align: center;">
        Dear <strong>${user.name}</strong>,
      </p>
      <p style="color: #444; font-size: 16px; text-align: center;">
        Thank you for signing up with Invito. Your account has been created successfully.
      </p>
      <p style="color: #444; font-size: 15px; text-align: center;">
        <span style="color: #7B5BF2; font-weight: bold;">The Invito Team</span>
      </p>
    </div>
  `;
  await sendMailgunEmail(user.email, "Welcome to Invito!", html);
};

exports.sendForgotPasswordEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f7fc; border-radius: 18px; padding: 32px 24px;">
      <h2 style="color: #7B5BF2; text-align: center;">Password Reset Request</h2>
      <p style="color: #333; font-size: 18px; text-align: center;">
        Dear <strong>${user.name}</strong>,
      </p>
      <p style="color: #444; font-size: 16px; text-align: center;">
        You requested a password reset. Click the link below to reset your password:
      </p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background: #7B5BF2; color: #fff; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p style="color: #444; font-size: 15px; text-align: center;">
        If you did not request this, please ignore this email.<br>
        <span style="color: #7B5BF2; font-weight: bold;">The Invito Team</span>
      </p>
    </div>
  `;
  await sendMailgunEmail(user.email, "Reset Your Invito Password", html);
};

exports.sendBookMySpotEmail = async (user, event) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f7fc; border-radius: 18px; padding: 32px 24px;">
      <h2 style="color: #7B5BF2; text-align: center;">Your Spot is Reserved!</h2>
      <p style="color: #333; font-size: 18px; text-align: center;">
        Dear <strong>${user.name}</strong>,
      </p>
      <p style="color: #444; font-size: 16px; text-align: center;">
        You've successfully reserved your spot for <strong>${event.title || "our event"}</strong>.
      </p>
      <div style="background: #f1eeff; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
        <h3 style="color: #7B5BF2; margin: 0 0 10px 0; font-size: 20px;">Event Details</h3>
        <ul style="list-style: none; padding: 0; margin: 0; color: #333; font-size: 16px;">
          <li style="margin-bottom: 8px;"><strong>📍 Location:</strong> ${event.location || "To be announced"
    }</li>
          <li><strong>🗓️ Date & Time:</strong> ${event.eventDateTime
      ? new Date(event.eventDateTime).toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
      : "To be confirmed"
    }</li>
        </ul>
      </div>
      <p style="color: #444; font-size: 15px; text-align: center;">
        We look forward to seeing you there!<br>
        <span style="color: #7B5BF2; font-weight: bold;">The Invito Team</span>
      </p>
    </div>
  `;
  await sendMailgunEmail(user.email, `Your Spot for ${event.title || "Our Event"}`, html);
};


// Cron job to run every day at 8:00 AM (Asia/Riyadh time)

// Export the cron job starter function
