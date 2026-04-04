const cron = require("node-cron");
const FormData = require("form-data");
const Mailgun = require("mailgun.js");
const axios = require("axios");
const QRCode = require("qrcode");
const Event = require("../models/Event"); // Adjust based on your model imports
const Contact = require("../models/Contact"); // Adjust based on your model imports

// Initialize Mailgun client
const requiredEnvVars = [
  "MAILGUN_API_KEY",
  "MAILGUN_DOMAIN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_TOKEN",
  "FRONTEND_URL",
];

function getMailgunClient() {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return mailgun.client({
    username: process.env.MAILGUN_USERNAME || "api",
    key: process.env.MAILGUN_API_KEY,
    url: process.env.MAILGUN_URL || "https://api.mailgun.net",
  });
}

// Format WhatsApp caption
function formatWhatsAppCaption(event, eventDateTimeSaudi) {
  return `
🔔 *Event Reminder: ${event.title || "Our Event"}* 🔔
Dear ${event.contactName || "Guest"},

You're invited to our event today!

📍 *Location*: ${event.location || "To be announced"}
🗓️ *Date & Time*: ${eventDateTimeSaudi || "To be confirmed"}

Please present the attached QR code at the entrance.
Best regards,
*The Invito Team*
  `.trim();
}

// Format event date to Saudi time (Asia/Riyadh)
function formatEventDateTimeToSaudi(date) {
  if (!date) return "To be confirmed";
  return new Date(date).toLocaleString("en-US", { timeZone: "Asia/Riyadh" });
}


async function startReminderCron() {
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.warn(`[reminderCron] Skipping reminder cron because required environment variables are missing: ${missingEnvVars.join(", ")}`);
    return;
  }

  cron.schedule(
    "0 * * * *", // every minute (adjust to your preferred schedule)
    async () => {
      try {
        console.log("Running event reminder cron job...");

        // Helper: Get start/end of current day in Saudi local time
        const getSaudiDayRange = () => {
          const now = new Date();
          const saudiNow = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
          );

          const start = new Date(saudiNow);
          start.setHours(0, 0, 0, 0);

          const end = new Date(saudiNow);
          end.setHours(23, 59, 59, 999);

          return { start, end };
        };
        console.log("Getting all Event");
        const { start, end } = getSaudiDayRange();

        console.log(
          `Checking events for Saudi date: ${start.toISOString().split("T")[0]}`
        );
        console.log("Start:", start, "End:", end);

        const events = await Event.find({
          eventDateTime: {
            $gte: start,
            $lte: end,
          },
        });
        console.log(`Found ${events.length} event(s) for today`);
        if (!events || events.length === 0) {
          console.log("No events scheduled for today.");
          return;
        }

        console.log(`Found ${events.length} event(s) for today`);

        for (const event of events) {
          const contacts = await Contact.find({
            eventId: event._id,
            $or: [
              { isEmailApproved: true, EmailUnsubscribe: { $ne: true } },
              {
                isWhatsappApproved: true,
                isWhatsappUnsubscribed: { $ne: true },
              },
            ],
          });

          if (!contacts || contacts.length === 0) {
            console.log(
              `No eligible contacts for event: ${event.title || "Unnamed Event"}`
            );
            continue;
          }

          console.log(
            `Processing ${contacts.length} contact(s) for event: ${event.title || "Unnamed Event"}`
          );

          for (const contact of contacts) {
            try {
              // Email reminder
              if (
                contact.isEmailApproved &&
                contact.email &&
                !contact.EmailUnsubscribe
              ) {
                await sendQREmail(contact, event);
                console.log(`Email reminder sent to ${contact.email}`);
              }

              // WhatsApp reminder
              if (
                contact.isWhatsappApproved &&
                contact.number &&
                !contact.isWhatsappUnsubscribed
              ) {
                await sendQRWhatsApp(contact, event);
                console.log(`WhatsApp reminder sent to ${contact.number}`);
              }
            } catch (error) {
              console.error(
                `Failed to send reminder to ${contact.email || contact.number}:`,
                { message: error.message, stack: error.stack }
              );
            }
          }
        }
      } catch (error) {
        console.error("Error in reminder cron job:", {
          message: error.message,
          stack: error.stack,
        });
      }
    },
    { timezone: "Asia/Riyadh" } // ✅ Run based on Saudi time
  );
}


async function sendQREmail(contact, event) {
  try {
    if (!event || !contact) {
      throw new Error("Event or contact data is missing");
    }

    const qrContent = `${process.env.FRONTEND_URL}/EventTemplate?contactId=${contact._id}&eventId=${contact.eventId}&source=email`;
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      color: { dark: "#000000", light: "#FFFFFF" },
      margin: 2,
      width: 400,
    });

    // Convert buffer to base64 for broader compatibility
    const qrCodeBase64 = qrCodeBuffer.toString("base64");

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f7fc; border-radius: 18px; padding: 32px 24px;">
        <h2 style="color: #7B5BF2; text-align: center;">Reminder: ${
          event.title || "Our Event"
        }</h2>
        <p style="color: #333; font-size: 18px; text-align: center;">
          Dear <strong>${contact.name}</strong>,
        </p>
        <p style="color: #444; font-size: 16px; text-align: center;">
          This is a reminder for <strong>${
            event.title || "our event"
          }</strong> happening today!
        </p>
        <div style="background: #f1eeff; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <h3 style="color: #7B5BF2; margin: 0 0 10px 0; font-size: 20px;">Event Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0; color: #333; font-size: 16px;">
            <li style="margin-bottom: 8px;"><strong>📍 Location:</strong> ${
              event.location || "To be announced"
            }</li>
            <li><strong>🗓️ Date & Time:</strong> ${formatEventDateTimeToSaudi(
              event.eventDateTime
            )}</li>
          </ul>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
          <tr>
            <td align="center">
              <img src="cid:event_qrcode.png" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
            </td>
          </tr>
        </table>
        <p style="color: #444; font-size: 15px; text-align: center;">
          Please present this QR code at the entrance.<br>
          <span style="color: #7B5BF2; font-weight: bold;">The Invito Team</span>
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"Invito Event Team" <${
        process.env.MAILGUN_FROM_EMAIL || "info@nexplat.sa"
      }>`,
      to: contact.email,
      subject: `Reminder: ${event.title || "Our Event"} Today!`,
      html: htmlContent,
      inline: [
        {
          data: qrCodeBuffer,
          filename: "event_qrcode.png",
          contentType: "image/png",
          cid: "event_qrcode", // Removed .png extension to match HTML src
        },
      ],
      // Explicitly set MIME structure for Outlook
      contentType: "multipart/related",
    };

    const mailgunClient = getMailgunClient();
    if (!mailgunClient) {
      throw new Error("Mailgun configuration is missing");
    }

    const result = await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    console.log(`QR code email sent to ${contact.email}: ${result.id}`);
    return result;
  } catch (error) {
    console.error("Error sending QR code email:", {
      message: error.message,
      stack: error.stack,
      email: contact?.email,
    });
    throw error;
  }
}

async function sendQRWhatsApp(contact, event) {
  try {
    const qrContent = `${process.env.FRONTEND_URL}/EventTemplate?contactId=${contact._id}&eventId=${contact.eventId}&source=whatsapp`;
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      color: { dark: "#000000", light: "#FFFFFF" },
      margin: 2,
      width: 400,
    });

    const form = new FormData();
    form.append("file", qrCodeBuffer, {
      filename: "qrcode.png",
      contentType: "image/png",
    });
    form.append("messaging_product", "whatsapp");

    const uploadResponse = await axios.post(
      `https://graph.facebook.com/${
        process.env.WHATSAPP_API_VERSION || "v20.0"
      }/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          ...form.getHeaders(),
        },
      }
    );

    const mediaId = uploadResponse.data.id;
    const eventDateTimeSaudi = formatEventDateTimeToSaudi(event.eventDateTime);
    const caption = formatWhatsAppCaption(event, eventDateTimeSaudi);

    const messagePayload = {
      messaging_product: "whatsapp",
      to: contact.number,
      type: "image",
      image: {
        id: mediaId,
        caption,
      },
    };

    await axios.post(
      `https://graph.facebook.com/${
        process.env.WHATSAPP_API_VERSION || "v20.0"
      }/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`QR code sent via WhatsApp to ${contact.number}`);
  } catch (error) {
    console.error("Error sending QR code via WhatsApp:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = { startReminderCron };
