const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // <-- Added missing import
const eventController = require('../controllers/eventController');
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Create uploads directory if not exists
const uploadPath = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Multer config — only store images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'image') {
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return cb(null, true);
      return cb(new Error('Only image files are allowed!'));
    }
    if (file.fieldname === 'file') {
      return cb(null, true); 
    }
    cb(null, false);
  }
});



 
router.post( '/add', auth.verify('private'),
upload.fields([ { name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 } ]), 
eventController.createEvent
);


router.get('/list/:id', auth.verify('private'), eventController.getEvents);

router.get('/get/:id', eventController.getEvent);
router.get('/getAll', eventController.getAllEvent);
router.delete('/delete/:id', auth.verify('private'), eventController.deleteEvent);

router.put('/update/:id', auth.verify('private'), eventController.updateEvent);
router.get("/stats/:eventId", eventController.getEventStats);

router.post('/updatedUserInvition',  contactController.updatedUserInvitation);
router.post('/updateEmailUnsubscribe',  contactController.setUnsubscribed);
router.get('/whatsapp', function(req,res){
  console.log(req.query);
  // Return challenge for Meta webhook verification
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
    if (
      process.env.META_WEBHOOK_VERIFY_TOKEN &&
      req.query['hub.verify_token'] === process.env.META_WEBHOOK_VERIFY_TOKEN
    ) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      res.status(403).send('Verification token mismatch');
    }
  } else {
    res.status(400).send('Invalid request');
  }
});
router.post('/whatsapp', contactController.whatsappMessage);
router.post('/markScanned', contactController.markScanned);
router.get('/getUserById/:id', contactController.getContactById);


router.get('/exportAllContactOfEventId/:eventId', contactController.exportAllContactOfEventId);


// Your app configuration .env variable
const CONFIG = {
  APP_ID: process.env.META_APP_ID,
  APP_SECRET: process.env.META_APP_SECRET,
  CONFIGURATION_ID: process.env.META_CONFIGURATION_ID,
  REDIRECT_URI: process.env.META_REDIRECT_URI || 'http://localhost:8082/api/event/auth/callback'
};



// Step 1: Initialize Embedded Signup
router.get('/auth/whatsapp', (req, res) => {
  console.log('=== /auth/whatsapp route hit ===');
  console.log('Request query:', req.query);
  console.log('Request IP:', req.ip);

  if (!CONFIG.APP_ID || !CONFIG.REDIRECT_URI) {
    return res.status(500).json({
      success: false,
      message: 'Meta WhatsApp OAuth is not configured on the server.',
    });
  }

  // Store state in session/database for verification
  const timestamp = new Date().getTime();
  console.log('Generated timestamp for state:', timestamp);

  const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?` +
    `client_id=${CONFIG.APP_ID}&` +
    `redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&` +
    `state=${timestamp}&` +
    `response_type=code&` +
    `override_default_response_type=true`;


  console.log('Generated auth URL:', authUrl);
  console.log('Redirecting to Facebook OAuth...');

  res.redirect(authUrl);
});


router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  try {
    if (!CONFIG.APP_ID || !CONFIG.APP_SECRET || !CONFIG.REDIRECT_URI) {
      throw new Error('Meta WhatsApp OAuth environment variables are missing');
    }
    var access_token;
    if (code) {
      // 1. Exchange code for access token
      const tokenRes = await axios.post('https://graph.facebook.com/v22.0/oauth/access_token', {
        client_id: CONFIG.APP_ID,
        client_secret: CONFIG.APP_SECRET,
        redirect_uri: CONFIG.REDIRECT_URI,
        code
      });
      access_token = tokenRes.data.access_token
    } 

    console.log('Access Token:', access_token);

    // Step 1: Debug token to get target_ids (Business IDs)
    const app_token = `${CONFIG.APP_ID}|${CONFIG.APP_SECRET}`;
    const debugRes = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: access_token,
        access_token: app_token
      }
    });

    const granularScopes = debugRes.data.data.granular_scopes;
    const waBusinessScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');

    console.log('waBusinessScope::: ', waBusinessScope);

    if (!waBusinessScope || !waBusinessScope.target_ids || waBusinessScope.target_ids.length === 0) {
      throw new Error('No WhatsApp Business target_ids found in granular scopes');
    }

    console.log('waBusinessScope.target_ids::: ', waBusinessScope.target_ids);
    const waba_id = waBusinessScope.target_ids[0]; // pick latest/last
    console.log('WABA ID:', waba_id);

    // Step 2: Get WABA details
    const wabaDetailsRes = await axios.get(`https://graph.facebook.com/v22.0/${waba_id}`, {
      params: {
        fields: 'id,name,currency,owner_business_info',
        access_token
      }
    });

    const wabaDetails = wabaDetailsRes.data;
    console.log('WABA Details:', wabaDetails);

    var business_portfolio_id = wabaDetails.owner_business_info.id

    // Step 3: Get Phone Numbers linked to WABA
    const phoneRes = await axios.get(`https://graph.facebook.com/v22.0/${waba_id}/phone_numbers`, {
      params: {
        fields: 'id,cc,country_dial_code,display_phone_number,verified_name,status,quality_rating,search_visibility,platform_type,code_verification_status',
        access_token
      }
    });

    const phone_number = phoneRes.data.data?.[0];
    if (!phone_number) throw new Error('No phone number found');
    const phone_number_id = phone_number.id;
    console.log('Phone Number ID:', phone_number_id);

    // Step 4: Register Phone Number using PIN
    const pin = '289169';
    const registerRes = await axios.post(
      `https://graph.facebook.com/v19.0/${phone_number_id}/register`,
      {
        messaging_product: 'whatsapp',
        pin
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    console.log('Register Success:', registerRes.data);

    // Step 5: Subscribe App to the WABA
    const subscribeRes = await axios.post(
      `https://graph.facebook.com/v22.0/${waba_id}/subscribed_apps`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );
    console.log('Subscribed App Response:', subscribeRes.data);


    // Step 6: Get Page ID from the owning business
    const pagesRes = await axios.get(`https://graph.facebook.com/v22.0/${business_portfolio_id}/owned_pages`, {
      params: {
        access_token,
        fields: 'id,name'
      }
    });

    const page = pagesRes.data.data?.[0];
    if (!page) throw new Error('No page found for WABA');
    const page_id = page.id;
    const page_name = page.name;
    console.log('Page ID:', page_id);
    console.log('Page Name:', page_name);

    // Step 6.1: Get Page Access Token
    const pageTokenRes = await axios.get(`https://graph.facebook.com/v22.0/${page_id}`, {
      params: {
        fields: 'access_token',
        access_token
      }
    });

    const page_access_token = pageTokenRes.data.access_token;
    console.log('Page Access Token:', page_access_token);

    // Step 6.2: Get Instagram Business Account from Page using Page Access Token
    const instaBusinessRes = await axios.get(`https://graph.facebook.com/v22.0/${page_id}`, {
      params: {
        fields: 'id,name,instagram_business_account{id,name}',
        access_token: page_access_token
      }
    });

    const instagram_business_account = instaBusinessRes.data.instagram_business_account;
    console.log('Instagram Business Account:', instagram_business_account);


    // Step 6.3: Get Ad Accounts from the business
    const adAccountsRes = await axios.get(`https://graph.facebook.com/v19.0/me/adaccounts`, {
      params: {
        access_token,
        fields: 'id,name,account_status,account_id,currency,timezone_name'
      }
    });

    const ad_accounts = adAccountsRes.data.data;
    console.log('Ad Accounts:', ad_accounts);



    // Final JSON Response
    res.json({
      access_token,
      waba_id,
      waba_details: wabaDetails,
      phone_number_id,
      phone_number,
      register_result: registerRes.data,
      page_access_token,
      page_id,
      page_name,
      business_portfolio_id,
      instagram_business_account,
      ad_accounts

    });

  } catch (error) {
    console.error('=== OAuth Callback Error ===');
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data || 'No response');
    res.status(500).json({ error: 'WABA authentication and registration failed' });
  }
});


module.exports = router; 
