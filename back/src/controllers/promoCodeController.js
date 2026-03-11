const { PromoCode } = require('../models');

const createPromoCode = async (req, res) => {
    try {
        const { name, discountPercentage, discountAmount, expirationDate, usageLimit } = req.body;

        if (discountPercentage && discountAmount) {
            return res.status(400).json({ error: 'Промокод может содержать либо процентную скидку, либо фиксированную сумму, но не оба параметра.' });
        }

        const promoCode = await PromoCode.create({
            name,
            discountPercentage: discountPercentage || null,
            discountAmount: discountAmount || null,
            expirationDate,
            usageLimit
        });

        res.status(201).json(promoCode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.findAll();
        res.json(promoCodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPromoCodeByName = async (req, res) => {
    try {
        const { name } = req.params;
        const promoCode = await PromoCode.findOne({ where: { name } });

        if (!promoCode) {
            return res.status(404).json({ error: 'Промокод не найден' });
        }

        res.json({
            name: promoCode.name,
            discountPercentage: promoCode.discountPercentage,
            discountAmount: promoCode.discountAmount,
            expirationDate: promoCode.expirationDate,
            usageLimit: promoCode.usageLimit,
            usageCount: promoCode.usageCount,
            isActive: promoCode.isActive,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePromoCode = async (req, res) => {
    try {
        const { name } = req.params;
        const { discountPercentage, discountAmount, expirationDate, usageLimit } = req.body;

        const promoCode = await PromoCode.findOne({ where: { name } });
        if (!promoCode) return res.status(404).json({ error: 'Промокод не найден' });

        if (discountPercentage && discountAmount) {
            return res.status(400).json({ error: 'Промокод может содержать либо процентную скидку, либо фиксированную сумму, но не оба параметра.' });
        }

        await promoCode.update({
            discountPercentage: discountPercentage || null,
            discountAmount: discountAmount || null,
            expirationDate,
            usageLimit
        });

        res.json(promoCode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePromoCode = async (req, res) => {
    try {
        const { name } = req.params;
        const promoCode = await PromoCode.findOne({ where: { name } });

        if (!promoCode) {
            return res.status(404).json({ error: 'Промокод не найден' });
        }

        await promoCode.destroy();
        res.json({ message: 'Промокод удален' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPromoCode, getPromoCodes, getPromoCodeByName, updatePromoCode, deletePromoCode };
