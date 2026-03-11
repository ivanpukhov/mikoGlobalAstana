const express = require('express');
const jwt = require('jsonwebtoken');
const UserController = require('../controllers/UserController');

const router = express.Router();

// Middleware для проверки токена
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Токен отсутствует.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        next();
    } catch {
        next();

        res.status(401).json({ message: 'Недействительный токен.' });
    }
};

// Роуты для пользователей
router.post('/register', UserController.register); // Регистрация нового пользователя
router.post('/login', UserController.login); // Авторизация пользователя
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
