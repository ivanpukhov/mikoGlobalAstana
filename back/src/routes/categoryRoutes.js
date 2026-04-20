const express = require('express');
const router = express.Router();
const {
    getProductsByCategory,
    getProductsBySubcategory,
    getAllCategory,
    getSubcategoriesByCategory,
    getAllSubcategories,
    deleteSubcategory,
    getCategoryAdminSummary,
    updateCategory,
    deleteCategory,
    updateSubcategory,
} = require('../controllers/categoryController');

router.get('/admin/summary', getCategoryAdminSummary);
router.get('/subcategories', getAllSubcategories);
router.patch('/subcategories/:subId', updateSubcategory);
router.delete('/subcategories/:subId', deleteSubcategory);

// Получить все категории
router.get('/', getAllCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Получить продукты по ID категории
router.get('/:id/products', getProductsByCategory);

// Получить подкатегории по ID категории
router.get('/:id/subcategories', getSubcategoriesByCategory);

// Получить продукты по ID категории и подкатегории
router.get('/:id/subcategories/:subId/products', getProductsBySubcategory);



module.exports = router;
