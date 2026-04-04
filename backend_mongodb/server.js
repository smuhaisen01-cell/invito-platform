// server.js

// --- Begin merged code from app.js, router.js, and server.js ---
const moment = require('moment-timezone');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { startAutoPaymentCron } = require("./src/cronjobs/startAutoPaymentCron");
startAutoPaymentCron(); // ✅ works

const swaggerUi = require('swagger-ui-express'); // from app.js
const swaggerJsdoc = require('swagger-jsdoc');   // from app.js

const connectDB = require('./src/config/database');
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Invito API',
      version: '1.0.0',
      description: 'API documentation for the Invito event and campaign platform.',
    },
    servers: [
      {
        url: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8082}`,
      },
    ],
  },
  apis: [path.join(__dirname, 'src/routes/*.js')],
});

// Middleware, routes etc.
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Begin merged router logic (from router.js) ---

const accountRoutes = require('./src/routes/account');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const eventRoutes = require('./src/routes/event');
const emailRoutes = require('./src/routes/email');
const whatsappRoutes = require('./src/routes/whatsapp');
const moyasarRoutes = require('./src/routes/moyasar');
const plans = require('./src/routes/plan');
const payments = require('./src/routes/payment');
const Event = require('./src/models/Event');


// Instead of using router, directly use in app:
app.use('/api/account', accountRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/moyasar', moyasarRoutes);
app.use('/api/plan', plans);
app.use('/api/payments',payments);




// --- End merged router logic ---
if (isProduction) {

  
  // Serve static files from the dist folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// --- Begin merged cronjob loader logic (from app.js) ---
const cronjobsPath = path.join(__dirname, 'src/cronjobs');
if (fs.existsSync(cronjobsPath)) {
  fs.readdirSync(cronjobsPath).forEach(function(file) {
    if (file.endsWith('.js')) {
      require(path.join(cronjobsPath, file));
    }
  });
}
// --- End merged cronjob loader logic ---

// --- Begin server start logic (from server.js) ---
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}\n`);
});

connectDB().catch((error) => {
  console.error("❌ Database connection failed during startup:", error.message);
});
// --- End server start logic ---
