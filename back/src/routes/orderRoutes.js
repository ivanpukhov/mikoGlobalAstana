const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrdersByPhone,
    getOrdersByCity,
    getOrderById,
    getOrderStatistics,
    deleteOrder,
    updateOrderStatus
} = require('../controllers/orderController');

router.get('/statistics', getOrderStatistics); // Получить статистику заказов за период
router.post('/', createOrder); // Создать заказ
router.patch('/:id/status', updateOrderStatus); // обновить статус заказа

router.get('/', getAllOrders); // Получить список всех заказов с фильтрацией и сортировкой
router.get('/city/:cityId', getOrdersByCity); // Получить заказы в определенном городе
router.get('/:id', getOrderById); // Получить конкретный заказ по ID
router.get('/phone/:phone', getOrdersByPhone); // Получить заказы по номеру телефона
router.delete('/:id', deleteOrder); // Удалить заказ по ID

module.exports = router;
