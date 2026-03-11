const { Category, Subcategory, Product } = require('../models');

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
            attributes: ['id', 'name'], // Получаем только id и name (если нужно)
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

    try {
        const category = await Category.findByPk(id, {
            include: {
                model: Subcategory,
                as: 'subcategories',
                attributes: ['id', 'name'], // Только id и name для подкатегорий
            },
            attributes: ['id', 'name'], // Только id и name для категории
        });

        if (!category) {
            return res.status(404).json({ message: "Категория не найдена" });
        }

        res.json(category);
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

    try {
        const subcategory = await Subcategory.findByPk(subId);

        if (!subcategory) {
            return res.status(404).json({ message: "Подкатегория не найдена" });
        }

        await subcategory.destroy();
        res.json({ message: "Подкатегория удалена" });
    } catch (error) {
        console.error("Ошибка при удалении подкатегории:", error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getProductsByCategory,
    getProductsBySubcategory,
    getAllCategory,
    getSubcategoriesByCategory,
    getAllSubcategories,
    deleteSubcategory
};
