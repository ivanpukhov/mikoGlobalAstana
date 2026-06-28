const express = require('express');
const upload = require('../config/multer');
const authenticate = require('../utils/authenticate');
const {
    createGiveawayParticipant,
    deleteGiveawayParticipant,
    getGiveawayParticipants,
    getGiveawaySettings,
    getPublicGiveawayForm,
    updateGiveawayParticipant,
    updateGiveawaySettings,
} = require('../controllers/giveawayController');

const router = express.Router();

router.get('/form', getPublicGiveawayForm);
router.post('/participants', upload.single('receipt'), createGiveawayParticipant);

router.get('/settings', authenticate, getGiveawaySettings);
router.put('/settings', authenticate, updateGiveawaySettings);
router.get('/participants', authenticate, getGiveawayParticipants);
router.patch('/participants/:id', authenticate, updateGiveawayParticipant);
router.delete('/participants/:id', authenticate, deleteGiveawayParticipant);

module.exports = router;
