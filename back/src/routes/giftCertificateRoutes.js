const express = require('express');
const router = express.Router();
const { createGiftCertificate, getAllGiftCertificates, deleteGiftCertificate } = require('../controllers/giftCertificateController');

router.post('/', createGiftCertificate);
router.get('/', getAllGiftCertificates);
router.delete('/:id', deleteGiftCertificate);

module.exports = router;
