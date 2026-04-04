const express = require('express');
const { getAllplans, getPlan } = require('../controllers/planController');

const router = express.Router();

router.get('/getAllPlan', getAllplans);
router.get('/getPlan', getPlan);
module.exports = router; 