const cron = require('node-cron');
const Event = require('../models/Event');
const Contact = require('../models/Contact');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { sendEventEmail } = require('../services/mailgunService');

// Configuration constants
const CRON_SCHEDULE = '*/1 * * * *'; // Every 10 minutes
const DELAY_MIN_MS = 7000; 
const DELAY_MAX_MS = 12000; 
const STATIC_IMAGE_URL = 'https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg'; 

function generateRandomDelay(minMs = DELAY_MIN_MS, maxMs = DELAY_MAX_MS) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function shouldSendWhatsApp(event, contact) {
  return event.whatsappSent && 
         contact.number && 
         event.whatsapp && 
         event.whatsapp.templateName;
}

function shouldSendEmail(event, contact) {
  return event.emailSent && contact.email && isValidEmail(contact.email);
}

function formatWhatsAppEventDate(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString('en-US', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

async function sendWhatsAppToContact(event, contact) {
  try {
    console.log(`📱 Preparing WhatsApp for ${contact.number}`);
    console.log(`Using template: ${event?.whatsapp?.templateName}`);
    await sendWhatsAppMessage({
      to: contact.number,
      templateName: event?.whatsapp?.templateName,
      languageCode: event?.whatsapp?.languageCode || 'en',
      bodyParameters: [
        contact.name,
        event.title,
        formatWhatsAppEventDate(event.eventDateTime),
        event.location,
      ],
      imageUrl: process.env.NODE_ENV =='local' ? STATIC_IMAGE_URL : event.whatsapp.imageUrl  , // Using static image
     
    });
    console.log(`✅ WhatsApp sent to ${contact.number} for event ${event._id}`);
  } catch (error) {
    console.error(`❌ WhatsApp send error for ${contact.number}:`, error.message);
    throw error; // Re-throw to allow retry logic if needed
  }
}

async function sendEmailToContact(event, contact) {
  try {
    const emailTemplate = {
      title: event.title,
      description: event.description,
      image_url: process.env.NODE_ENV =='local' ? STATIC_IMAGE_URL : event.whatsapp.imageUrl,
      footer: event.footerText,
      event_link: `${process.env.FRONTEND_URL}/EventDetails?contactId=${contact?._id}&eventId=${contact?.eventId}&source=email`,
      contact_id: contact?._id,
    };
    
    
    await sendEventEmail(
      contact.email, 
      `${event.title}`, 
      emailTemplate
    );
    console.log(`✅ Email sent to ${contact.email} for event ${event._id}`);
  } catch (error) {
    console.error(`❌ Email send error for ${contact.email}:`, error.message);
    throw error; // Re-throw to allow retry logic if needed
  }
}

async function processContact(event, contact) {
  try {
    // Send WhatsApp if enabled
    if (shouldSendWhatsApp(event, contact)) {
      await sendWhatsAppToContact(event, contact);
      await wait(generateRandomDelay());
    }

    // Send Email if enabled
    if (shouldSendEmail(event, contact)) {
      await sendEmailToContact(event, contact);
      await wait(generateRandomDelay());
    } else if (event.emailSent && contact.email && !isValidEmail(contact.email)) {
      console.warn(`⚠️ Invalid email skipped: ${contact.email}`);
    }
  } catch (error) {
    console.error(`⚠️ Error processing contact ${contact._id}:`, error.message);
  }
}

async function processEvent(event) {
  try {
    console.log(`🔍 Processing event ${event._id}: ${event.title}`);
    
    const contacts = await Contact.find({ eventId: event._id });
    console.log(`👥 Found ${contacts.length} contacts for this event`);

    if (contacts.length === 0) {
      console.warn('⚠️ No contacts found for this event');
      return;
    }

    event.status = 'running';
    await event.save();

    // Process contacts sequentially with delays
    for (const contact of contacts) {
      await processContact(event, contact);
    }

    event.status = 'completed';
    event.completedAt = new Date();
    await event.save();
    console.log(`🎉 Successfully processed event ${event._id}`);
    
  } catch (error) {
    console.error(`💥 Error processing event ${event._id}:`, error.message);
    event.status = 'failed';
    event.lastError = error.message;
    await event.save();
  }
}

async function runMessageSendingJob() {
  try {
    console.log('\n🚀 Starting message sending job at', new Date().toISOString());
    
    const events = await Event.find({
      scheduleTime: { $lte: new Date() },
      isDeleted: false,
      status: 'scheduled',
      $or: [{"whatsapp.status": "APPROVED"},{whatsappSent:false}]
    }).sort({ scheduleTime: 1 }); // Process oldest first

    console.log(`📊 Found ${events.length} events to process`);

    if (events.length === 0) {
      console.log('✨ No events to process');
      return;
    }

    // Process events sequentially
    for (const event of events) {
      await processEvent(event);
    }

  } catch (error) {
    console.error('💥 Cron job error:', error.message);
  } finally {
    console.log('🏁 Job cycle completed\n');
  }
}

// Initialize cron job
console.log(`⏰ Message sending job scheduled to run every 10 minutes`);
cron.schedule(CRON_SCHEDULE, runMessageSendingJob);

module.exports = {
  runMessageSendingJob,
  processEvent,
  processContact,
  generateRandomDelay,
  isValidEmail,
  STATIC_IMAGE_URL 
};
