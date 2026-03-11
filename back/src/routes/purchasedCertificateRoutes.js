const express = require('express');
const router = express.Router();
const {
    createPurchasedCertificate,
    confirmPayment,
    getAllPurchasedCertificates,
    deletePurchasedCertificate,
    checkGiftCertificateValidity, markCertificateAsUsed
} = require('../controllers/purchasedCertificateController');

router.get('/validate/:code', checkGiftCertificateValidity);
router.post('/', createPurchasedCertificate);
router.get('/', getAllPurchasedCertificates);
router.put('/:id/confirm-payment', confirmPayment);
router.delete('/:id', deletePurchasedCertificate);
router.put('/:id/mark-used', markCertificateAsUsed);

module.exports = router;
