const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
    getAllProducts,
    getProductById,
    createProducts,
    getProductsByCity,
    updateProductAvailability,
    updateProductDiscount,
    getProductsByCategoryInCity,
    searchProducts,
    getSearchSuggestions,
    getAllIndexedDocuments,
    createProductsJson,
    updateProductPrice,
    searchProductsByCity,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

router.get('/', getAllProducts); // Получение всех товаров
router.post('/more', upload.single('image'), createProducts); // Создание нескольких товаров
router.get('/:cityId/products', getProductsByCity); // Получение товаров с ценами в городе
router.patch('/:cityId/products/:productId/availability', updateProductAvailability); // Обновление доступности товара
router.patch('/:cityId/products/:productId/discount', updateProductDiscount); // Обновление скидки товара
router.get('/:cityId/category/:categoryId/products', getProductsByCategoryInCity); // Получение товаров по категории в городе
router.get('/search/city', searchProductsByCity); // Поиск товаров с учетом ошибок и похожих слов
router.get('/suggestions', getSearchSuggestions); // Получение подсказок для поиска
router.get('/index', getAllIndexedDocuments); // Получение всех товаров
router.get('/:id', getProductById); // Получение товара по ID
router.patch('/update/:id', upload.single('image'), updateProduct); // Редактирование товара
router.delete('/:id', deleteProduct); // Удаление товара
router.patch('/:cityId/products/:productId/price', updateProductPrice); // Обновление цены товара

module.exports = router;
