const express = require('express');
const UserController = require('../controllers/UserController');
const authenticate = require('../utils/authenticate');

const router = express.Router();

// Роуты для пользователей
router.post('/register', UserController.register); // Регистрация нового пользователя
router.post('/login', UserController.login); // Авторизация пользователя
router.get('/me', authenticate, UserController.me); // Проверка текущего токена
router.post('/refresh', authenticate, UserController.refresh); // Обновление текущего токена
router.post('/create', authenticate, UserController.create); // Создание нового пользователя авторизованным пользователем
router.get('/:id', authenticate, UserController.getById); // Получение информации о пользователе по ID
router.get('/', authenticate, UserController.getAll); // Получение списка всех пользователей
router.delete('/:id', authenticate, UserController.delete); // Удаление пользователя

// Middleware для обработки ошибок
router.use((err, req, res, next) => {
    console.error('Ошибка:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера.' });
});

module.exports = router;
