const { OrderGiftRule, Product, ProductPrice, sequelize } = require('../models');

const includeProduct = {
    model: Product,
    as: 'product',
    attributes: ['id', 'name', 'image'],
    include: [
        {
            model: ProductPrice,
            as: 'prices',
            attributes: ['price', 'discount', 'cityId', 'availability'],
            required: false,
        },
    ],
};

const normalizeRulePayload = (body = {}) => {
    const minAmount = Number(body.minAmount);
    const maxAmount =
        body.maxAmount === null || body.maxAmount === '' || typeof body.maxAmount === 'undefined'
            ? null
            : Number(body.maxAmount);
    const productId = Number(body.productId);
    const sortOrder = Number(body.sortOrder || 0);

    if (!Number.isFinite(minAmount) || minAmount < 0) {
        return { error: 'Минимальная сумма должна быть числом не меньше 0.' };
    }

    if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < minAmount)) {
        return { error: 'Максимальная сумма должна быть больше или равна минимальной.' };
    }

    if (!Number.isFinite(productId) || productId <= 0) {
        return { error: 'Выберите товар для подарка.' };
    }

    return {
        minAmount,
        maxAmount,
        productId,
        sortOrder,
    };
};

const getAllOrderGiftRules = async (req, res) => {
    try {
        const rules = await OrderGiftRule.findAll({
            include: [includeProduct],
            order: [
                ['sortOrder', 'ASC'],
                ['minAmount', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createOrderGiftRule = async (req, res) => {
    const payload = normalizeRulePayload(req.body);
    if (payload.error) {
        return res.status(400).json({ error: payload.error });
    }

    try {
        const product = await Product.findByPk(payload.productId);
        if (!product) {
            return res.status(404).json({ error: 'Товар для подарка не найден.' });
        }

        const created = await OrderGiftRule.create(payload);
        const rule = await OrderGiftRule.findByPk(created.id, { include: [includeProduct] });
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateOrderGiftRule = async (req, res) => {
    const payload = normalizeRulePayload(req.body);
    if (payload.error) {
        return res.status(400).json({ error: payload.error });
    }

    try {
        const rule = await OrderGiftRule.findByPk(req.params.id);
        if (!rule) {
            return res.status(404).json({ error: 'Правило подарка не найдено.' });
        }

        const product = await Product.findByPk(payload.productId);
        if (!product) {
            return res.status(404).json({ error: 'Товар для подарка не найден.' });
        }

        await rule.update(payload);
        const updated = await OrderGiftRule.findByPk(rule.id, { include: [includeProduct] });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteOrderGiftRule = async (req, res) => {
    try {
        const rule = await OrderGiftRule.findByPk(req.params.id);
        if (!rule) {
            return res.status(404).json({ error: 'Правило подарка не найдено.' });
        }

        await rule.destroy();
        res.json({ message: 'Правило подарка удалено.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const seedDefaultOrderGiftRules = async () => {
    const count = await OrderGiftRule.count();
    if (count > 0) {
        return;
    }

    const products = await Product.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
        limit: 50,
    });

    const matchProduct = (patterns) =>
        products.find((product) =>
            patterns.some((pattern) => product.name.toLowerCase().includes(pattern))
        );

    const fallback = products[0];
    if (!fallback) {
        return;
    }

    const rules = [
        {
            minAmount: 6000,
            maxAmount: 9999,
            sortOrder: 1,
            productId:
                matchProduct(['гель для мытья посуды', 'посуд'])?.id || fallback.id,
        },
        {
            minAmount: 10000,
            maxAmount: 14999,
            sortOrder: 2,
            productId:
                matchProduct(['кондиционер', 'fresh'])?.id || fallback.id,
        },
        {
            minAmount: 15000,
            maxAmount: 19999,
            sortOrder: 3,
            productId:
                matchProduct(['универсальное средство', 'clean'])?.id || fallback.id,
        },
        {
            minAmount: 20000,
            maxAmount: null,
            sortOrder: 4,
            productId:
                matchProduct(['кондиционер', 'fresh'])?.id || fallback.id,
        },
    ];

    await OrderGiftRule.bulkCreate(rules);
};

module.exports = {
    getAllOrderGiftRules,
    createOrderGiftRule,
    updateOrderGiftRule,
    deleteOrderGiftRule,
    seedDefaultOrderGiftRules,
};
