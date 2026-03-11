const express = require('express');
const router = express.Router();
const {
    createPromoCode,
    getPromoCodes,
    getPromoCodeByName,
    updatePromoCode,
    deletePromoCode
} = require('../controllers/promoCodeController');

router.post('/', createPromoCode);
router.get('/', getPromoCodes);
router.get('/:name', getPromoCodeByName);
router.put('/:name', updatePromoCode);
router.delete('/:name', deletePromoCode);

module.exports = router;
