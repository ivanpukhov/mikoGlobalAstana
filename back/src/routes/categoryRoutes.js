const express = require('express');
const router = express.Router();
const {
    getProductsByCategory,
    getProductsBySubcategory,
    getAllCategory,
    getSubcategoriesByCategory, getAllSubcategories, deleteSubcategory
} = require('../controllers/categoryController');

// Получить все категории
router.get('/', getAllCategory);

// Получить продукты по ID категории
router.get('/:id/products', getProductsByCategory);

// Получить подкатегории по ID категории
router.get('/:id/subcategories', getSubcategoriesByCategory);

// Получить продукты по ID категории и подкатегории
router.get('/:id/subcategories/:subId/products', getProductsBySubcategory);
router.get('/subcategories', getAllSubcategories);
router.delete('/subcategories/:subId', deleteSubcategory);



module.exports = router;
