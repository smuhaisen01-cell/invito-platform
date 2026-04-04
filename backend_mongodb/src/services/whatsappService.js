const fs = require('fs');
const axios = require('axios');
const { whatsapp } = require('../config/whatsappConfig');
const Contact = require('../models/Contact');

// Configuration for retries
const MAX_RETRIES = 3;
const DELAY_MIN_MS = 7000;
const DELAY_MAX_MS = 12000;

function generateRandomDelay(minMs = DELAY_MIN_MS, maxMs = DELAY_MAX_MS) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

async function getTemplateDetails(templateName) {
  try {
    const response = await axios.get(
      `${whatsapp.apiUrl}/${whatsapp.businessAccountId}/message_templates`,
      {
        params: {
          name: templateName,
          access_token: whatsapp.token
        }
      }
    );
    return response.data.data[0] || null;
  } catch (error) {
    console.error('Error getting template details:', error.response?.data || error.message);
    throw error;
  }
}

async function uploadImageToWhatsApp(imageFile) {
  try {
    let retries = MAX_RETRIES;
    while (retries > 0) {
      try {
        const fileStats = fs.statSync(imageFile.path);
        const fileBuffer = fs.readFileSync(imageFile.path);

        const sessionRes = await axios.post(
          `${whatsapp.apiUrl}/${whatsapp.appId}/uploads`,
          null,
          {
            params: {
              file_name: imageFile.originalname,
              file_length: fileStats.size,
              file_type: imageFile.mimetype,
              access_token: whatsapp.token,
            },
          }
        );
        const uploadSessionId = sessionRes.data.id;

        const uploadRes = await axios.post(
          `${whatsapp.apiUrl}/${uploadSessionId}`,
          fileBuffer,
          {
            headers: {
              Authorization: `OAuth ${whatsapp.token}`,
              'file_offset': 0,
              'Content-Type': imageFile.mimetype,
              'Content-Length': fileStats.size,
            },
          }
        );
        return uploadRes.data.h;
      } catch (error) {
        if ([429, 503, 403].includes(error.response?.status)) {
          console.warn(`⚠️ Retry due to transient error:`, error.message);
          await new Promise(resolve => setTimeout(resolve, generateRandomDelay()));
          retries--;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded for image upload');
  } catch (error) {
    console.error('Error uploading image to WhatsApp:', error.response?.data || error.message);
    throw error;
  }
}

function sanitizeFooterText(text) {
  if (!text) return text;
  return text.replace(/[\n\r]/g, ' ').replace(/[\uD800-\uDFFF]./g, '').trim();
}

async function createEventTemplate({
  imageFile,
  headerText,
  description,
  footerText = '',
  buttonUrl = '',
  contactId
}) {
  try {
    let mediaId;
    if (imageFile) {
      mediaId = await uploadImageToWhatsApp(imageFile);
      if (!mediaId) throw new Error('Image upload failed: no mediaId returned');
    }

    const components = [];

    if (mediaId) {
      components.push({
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [mediaId],
        },
      });
    }

    components.push({
      type: 'BODY',
      text: `*${headerText}*\n\n${description}`,
    });

    const sanitizedFooterText = sanitizeFooterText(footerText);
    if (sanitizedFooterText) {
      components.push({
        type: 'FOOTER',
        text: sanitizedFooterText
      });
    }

    // ✅ Use correct format for template buttons
    const buttons = [
      {
        type: 'QUICK_REPLY',
        text: 'Accept Invitation'
      },
      {
        type: 'QUICK_REPLY',
        text: 'Ask Me Later'
      }
    ];

    if (buttonUrl) {
      buttons.push({
        type: 'URL',
        text: 'View Details',
        url: buttonUrl
      });
    }

    components.push({
      type: 'BUTTONS',
      buttons
    });

    const whatsappPayload = {
      name: `event_${Date.now()}`,
      language: 'en',
      category: 'MARKETING',
      messaging_product: 'whatsapp',
      components
    };

    const response = await axios.post(
      `${whatsapp.apiUrl}/${whatsapp.businessAccountId}/message_templates`,
      whatsappPayload,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Template created successfully', response.data);
    if (response.data.status === 'PENDING') {
      console.warn(`⚠️ Template ${whatsappPayload.name} is PENDING approval, cannot be used until APPROVED`);
    }

    return {
      success: true,
      message: 'Template created successfully',
      status: response.data.status,
      templateName: whatsappPayload.name,
      templateId: response.data.id,
      mediaId,
      hasButtons: components.some(c => c.type === 'BUTTONS')
    };
  } catch (err) {
    console.error('WhatsApp Template Service Error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
}

async function sendWhatsAppMessage({ to, templateName, languageCode = 'en', mediaId, imageUrl }) {
  try {
    console.log('msg->'+to, templateName, languageCode, mediaId, imageUrl);
    
    const components = [];


    if (mediaId) {
      components.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: { id: mediaId }
        }]
      });
    } else if (imageUrl) {
      components.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: { link: imageUrl }
        }]
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components.length > 0 ? components : undefined
      }
    };

    const response = await axios.post(
      `${whatsapp.apiUrl}/${whatsapp.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${whatsapp.token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    await Contact.updateOne({ number: to },{ messageid: response?.data?.messages[0]?.id});
    console.log('WhatsApp message sent successfully', response.data);
    return response.data;
  } catch (err) {
    console.error('WhatsApp Message Service Error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  uploadImageToWhatsApp,
  createEventTemplate,
  sendWhatsAppMessage,
  getTemplateDetails
};
