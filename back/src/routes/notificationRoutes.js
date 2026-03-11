const express = require('express');
const authenticate = require('../utils/authenticate');
const {
    getNotificationSettings,
    updateNotificationSettings,
    checkInstanceState,
    getInstanceQr,
    getNotificationTemplates,
    updateNotificationTemplate,
    sendFeedback,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/settings', authenticate, getNotificationSettings);
router.put('/settings', authenticate, updateNotificationSettings);
router.get('/state', authenticate, checkInstanceState);
router.post('/qr', authenticate, getInstanceQr);
router.get('/templates', authenticate, getNotificationTemplates);
router.put('/templates/:key', authenticate, updateNotificationTemplate);
router.post('/feedback', sendFeedback);

module.exports = router;
