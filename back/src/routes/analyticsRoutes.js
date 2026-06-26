const express = require('express');
const authenticate = require('../utils/authenticate');
const { trackEvent, getAnalyticsSummary } = require('../controllers/analyticsController');

const router = express.Router();

router.post('/events', trackEvent);
router.get('/summary', authenticate, getAnalyticsSummary);

module.exports = router;
