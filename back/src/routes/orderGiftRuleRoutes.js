const express = require('express');
const router = express.Router();
const {
    getAllOrderGiftRules,
    createOrderGiftRule,
    updateOrderGiftRule,
    deleteOrderGiftRule,
} = require('../controllers/orderGiftRuleController');

router.get('/', getAllOrderGiftRules);
router.post('/', createOrderGiftRule);
router.put('/:id', updateOrderGiftRule);
router.delete('/:id', deleteOrderGiftRule);

module.exports = router;
