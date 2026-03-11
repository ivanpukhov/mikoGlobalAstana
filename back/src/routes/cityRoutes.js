const express = require('express');
const router = express.Router();
const { createCity, updateProductPriceInCity, getAllCities} = require('../controllers/cityController');

router.post('/', createCity);
router.get('/', getAllCities); // Получение списка городов
router.patch('/:id/products/:productId', updateProductPriceInCity);

module.exports = router;
