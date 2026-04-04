const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createEventTemplate, sendWhatsAppMessage } = require('../services/whatsappService');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

/**
 * @swagger
 * /api/whatsapp/create-template:
 *   post:
 *     summary: Create a WhatsApp event template
 *     tags: [WhatsApp]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               headerText:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduleTime:
 *                 type: string
 *               location:
 *                 type: string
 *               footerText:
 *                 type: string
 *               buttonUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 templateName:
 *                   type: string
 *                 templateId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/create-template', upload.single('image'), async (req, res) => {
  try {
    const { headerText, description, scheduleTime, location, footerText, buttonUrl } = req.body;
    
    if (!req.file || !headerText || !description || !scheduleTime || !location) {
      return res.status(400).json({ message: 'Missing required fields: image, headerText, description, scheduleTime, location' });
    }
    console.log('Creating template with:', {
  headerText,
  description,
  contactId: req.body.contactId || (req.body.contacts && req.body.contacts[0]?._id)
});

    const result = await createEventTemplate({
      imageFile: req.file,
      headerText,
      description,
      scheduleTime,
      location,
      footerText,
      buttonUrl,
       contactId: req.body.contactId || // You need to provide a contact ID
    (req.body.contacts && req.body.contacts[0]?._id)
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in /create-template:', err);
    res.status(500).json({ message: err.message || 'Failed to create WhatsApp template' });
  }
});

/**
 * @swagger
 * /api/whatsapp/send-message:
 *   post:
 *     summary: Send a WhatsApp message
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               templateName:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/send-message', async (req, res) => {
  try {

    const { to, templateName, imageUrl } = req.body;
    console.log(''+to, templateName, imageUrl);
    
    if (!to || !templateName || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields: to, templateName, imageUrl' });
    }
    const result = await sendWhatsAppMessage({ to, templateName, imageUrl });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in /send-message:', err);
    res.status(500).json({ message: err.message || 'Failed to send WhatsApp message' });
  }
});

module.exports = router; 