const cron = require('node-cron');
const axios = require('axios');
const Event = require("../models/Event");

// Configuration constants
const CRON_SCHEDULE = '*/1 * * * *'; // Every 1 minute

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function checkEventTemplateStatusJob() {
  try {
    // Find events whose whatsapp template status is neither APPROVED nor REJECTED
    const events = await Event.find({ "whatsapp.status": { $nin: ["APPROVED", "REJECTED"] }, "whatsapp.templateId": { $exists: true, $ne: null }, isDeleted: false });

    console.log("[checkTemplateStatus] events.length", events.length);

    for (const event of events) {
      try {
        // Use templateName as identifier for WhatsApp API
        const templateId = event.whatsapp.templateId;
        if (!templateId) continue;

        const response = await axios.get(
          `${WHATSAPP_API_URL}/${templateId}`,
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            },
          }
        );

        const newStatus = response.data.status;

        if (newStatus === "APPROVED" || newStatus === "REJECTED" || newStatus === "PENDING") {
          await Event.findByIdAndUpdate(event._id, {
            "whatsapp.status": newStatus,
          });
          console.log(`✅ Updated event "${event.title}" whatsapp template status to ${newStatus}`);
        } else {
          console.log(`ℹ️ Received unknown status "${newStatus}" for event "${event.title}"`);
        }
      } catch (err) {
        console.error(
          `❌ Error checking status for event "${event.title}":`,
          err.response?.data || err.message
        );
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch events from DB:", err.message);
  }
}

// Initialize cron job
console.log(`⏰ Checking WhatsApp template status for events every minute`);
cron.schedule(CRON_SCHEDULE, checkEventTemplateStatusJob);
