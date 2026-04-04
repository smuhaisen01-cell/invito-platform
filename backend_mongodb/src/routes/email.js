const express = require('express');
const router = express.Router();
const mailgunService = require('../services/mailgunService');

router.post('/send-event-email', (req, res) => {
    const { to, subject, template } = req.body;
    mailgunService.sendEventEmail(to, subject, template)
        .then(result => {
            res.status(200).json(result);
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});

module.exports = router; 