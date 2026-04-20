const { Op } = require('sequelize');
const { Category, Subcategory, Product, sequelize } = require('../models');

const getProductsByCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const products = await Product.findAll({
            where: { categoryId: id },
            include: ['category', 'subcategory', 'prices'],
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllCategory = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name', 'icon'], // Получаем только нужные поля
            order: [['createdAt', 'DESC']], // Сортировка по дате создания
        });

        if (categories.length === 0) {
            return res.status(404).json({ message: "Категории не найдены" });
        }

        res.json(categories);
    } catch (error) {
        console.error("Ошибка при получении категорий:", error);
        res.status(500).json({ error: error.message });
    }
};

const getCategoryAdminSummary = async (req, res) => {
    try {
        const [categories, productCounts, subcategoryCounts, unassignedProductCounts, nonEmptySubcategoryCounts] = await Promise.all([
            Category.findAll({
                attributes: ['id', 'name', 'icon'],
                order: [['name', 'ASC']],
            }),
            Product.findAll({
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'productCount'],
                ],
                group: ['categoryId'],
                raw: true,
            }),
            Subcategory.findAll({
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'subcategoryCount'],
                ],
                group: ['categoryId'],
                raw: true,
            }),
            Product.findAll({
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'unassignedProductCount'],
                ],
                where: { subcategoryId: null },
                group: ['categoryId'],
                raw: true,
            }),
            Product.findAll({
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('subcategoryId'))), 'nonEmptySubcategoryCount'],
                ],
                where: {
                    subcategoryId: {
                        [Op.ne]: null,
                    },
                },
                group: ['categoryId'],
                raw: true,
            }),
        ]);

        const productCountByCategoryId = new Map(
            productCounts.map((item) => [Number(item.categoryId), Number(item.productCount) || 0])
        );
        const subcategoryCountByCategoryId = new Map(
            subcategoryCounts.map((item) => [Number(item.categoryId), Number(item.subcategoryCount) || 0])
        );
        const unassignedProductCountByCategoryId = new Map(
            unassignedProductCounts.map((item) => [Number(item.categoryId), Number(item.unassignedProductCount) || 0])
        );
        const nonEmptySubcategoryCountByCategoryId = new Map(
            nonEmptySubcategoryCounts.map((item) => [Number(item.categoryId), Number(item.nonEmptySubcategoryCount) || 0])
        );

        const result = categories.map((category) => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            productCount: productCountByCategoryId.get(category.id) || 0,
            subcategoryCount: subcategoryCountByCategoryId.get(category.id) || 0,
            unassignedProductCount: unassignedProductCountByCategoryId.get(category.id) || 0,
            nonEmptySubcategoryCount: nonEmptySubcategoryCountByCategoryId.get(category.id) || 0,
        }));

        res.json(result);
    } catch (error) {
        console.error('Ошибка при получении списка категорий для админки:', error);
        res.status(500).json({ error: error.message });
    }
};



const getProductsBySubcategory = async (req, res) => {
    const { id, subId } = req.params;

    try {
        const products = await Product.findAll({
            where: { categoryId: id, subcategoryId: subId },
            include: ['category', 'subcategory', 'prices'],
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSubcategoriesByCategory = async (req, res) => {
    const { id } = req.params;
    const excludeEmpty = req.query.excludeEmpty === '1' || req.query.excludeEmpty === 'true';

    try {
        const category = await Category.findByPk(id, {
            attributes: ['id', 'name', 'icon'], // Только нужные поля для категории
        });

        if (!category) {
            return res.status(404).json({ message: "Категория не найдена" });
        }

        const subcategories = await Subcategory.findAll({
            where: { categoryId: id },
            attributes: [
                'id',
                'name',
                'categoryId',
                [sequelize.fn('COUNT', sequelize.col('products.id')), 'productCount'],
            ],
            include: [{
                model: Product,
                as: 'products',
                attributes: [],
                required: false,
            }],
            group: ['Subcategory.id', 'Subcategory.name', 'Subcategory.categoryId'],
            order: [['name', 'ASC']],
        });

        const normalizedSubcategories = subcategories
            .map((subcategory) => ({
                id: subcategory.id,
                name: subcategory.name,
                categoryId: subcategory.categoryId,
                productCount: Number(subcategory.get('productCount')) || 0,
            }))
            .filter((subcategory) => !excludeEmpty || subcategory.productCount > 0);

        res.json({
            id: category.id,
            name: category.name,
            icon: category.icon,
            subcategories: normalizedSubcategories,
        });
    } catch (error) {
        console.error("Ошибка при получении подкатегорий:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.findAll({
            attributes: ['id', 'name', 'categoryId'],
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id'],
            }],
        });

        const result = subcategories.map(subcategory => ({
            id: subcategory.id,
            name: subcategory.name,
            categoryId: subcategory.categoryId,
            productCount: subcategory.products.length,
        }));

        res.json(result);
    } catch (error) {
        console.error("Ошибка при получении всех подкатегорий:", error);
        res.status(500).json({ error: error.message });
    }
};

const deleteSubcategory = async (req, res) => {
    const { subId } = req.params;
    const { targetSubcategoryId } = req.body;

    try {
        const subcategory = await Subcategory.findByPk(subId);

        if (!subcategory) {
            return res.status(404).json({ message: "Подкатегория не найдена" });
        }

        const targetSubcategory = await Subcategory.findByPk(targetSubcategoryId);
        if (!targetSubcategory) {
            return res.status(400).json({ message: 'Укажите подкатегорию, в которую нужно перенести товары.' });
        }

        if (Number(targetSubcategory.id) === Number(subcategory.id)) {
            return res.status(400).json({ message: 'Нельзя переносить товары в ту же подкатегорию.' });
        }

        if (Number(targetSubcategory.categoryId) !== Number(subcategory.categoryId)) {
            return res.status(400).json({ message: 'Товары можно переносить только в подкатегорию той же категории.' });
        }

        await Product.update(
            { subcategoryId: targetSubcategory.id },
            { where: { subcategoryId: subcategory.id } }
        );

        await subcategory.destroy();
        res.json({ message: "Подкатегория удалена" });
    } catch (error) {
        console.error("Ошибка при удалении подкатегории:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, icon } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название категории обязательно.' });
    }

    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: 'Категория не найдена.' });
        }

        category.name = name.trim();
        category.icon = typeof icon === 'string' && icon.trim() ? icon.trim() : null;
        await category.save();

        res.json(category);
    } catch (error) {
        console.error('Ошибка при обновлении категории:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const { targetCategoryId } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const category = await Category.findByPk(id, {
            include: [{ model: Subcategory, as: 'subcategories' }],
            transaction,
        });

        if (!category) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Категория не найдена.' });
        }

        const targetCategory = await Category.findByPk(targetCategoryId, { transaction });
        if (!targetCategory) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Укажите категорию, в которую нужно перенести товары.' });
        }

        if (Number(targetCategory.id) === Number(category.id)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Нельзя переносить товары в ту же категорию.' });
        }

        await Product.update(
            { categoryId: targetCategory.id, subcategoryId: null },
            { where: { categoryId: category.id }, transaction }
        );

        await Subcategory.destroy({
            where: { categoryId: category.id },
            transaction,
        });

        await category.destroy({ transaction });
        await transaction.commit();

        res.json({ message: 'Категория удалена, товары перенесены.' });
    } catch (error) {
        await transaction.rollback();
        console.error('Ошибка при удалении категории:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateSubcategory = async (req, res) => {
    const { subId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название подкатегории обязательно.' });
    }

    try {
        const subcategory = await Subcategory.findByPk(subId);
        if (!subcategory) {
            return res.status(404).json({ message: 'Подкатегория не найдена.' });
        }

        subcategory.name = name.trim();
        await subcategory.save();

        res.json(subcategory);
    } catch (error) {
        console.error('Ошибка при обновлении подкатегории:', error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getProductsByCategory,
    getProductsBySubcategory,
    getAllCategory,
    getCategoryAdminSummary,
    getSubcategoriesByCategory,
    getAllSubcategories,
    deleteSubcategory,
    updateCategory,
    deleteCategory,
    updateSubcategory,
};
