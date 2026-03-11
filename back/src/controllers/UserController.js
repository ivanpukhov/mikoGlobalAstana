const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, City } = require('../models');
const { Op } = require('sequelize');
const sendNotification = require('../utils/notificationService');
const { getRenderedTemplate } = require('../utils/templateService');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

class UserController {
    static async register(req, res) {
        try {
            const { phoneNumber, cityId, password, name } = req.body;

            if (!phoneNumber || !password || !name) {
                return res.status(400).json({ message: 'Все поля обязательны.' });
            }

            const city = cityId === 'all' || cityId === null ? null : await City.findByPk(cityId);
            if (cityId !== 'all' && cityId !== null && !city) {
                return res.status(404).json({ message: 'Указанный город не найден.' });
            }

            const existingUser = await User.findOne({ where: { phoneNumber } });
            if (existingUser) {
                return res.status(400).json({ message: 'Пользователь с таким номером телефона уже существует.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                phoneNumber,
                cityId: cityId === 'all' ? null : cityId,
                password: hashedPassword,
                name
            });

            const token = jwt.sign(
                { id: newUser.id, phoneNumber: newUser.phoneNumber },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Отправляем уведомление о регистрации
            const cityName = city ? city.name : 'Все города';
            const message = await getRenderedTemplate(
                'user.register',
                { name, phoneNumber, password, cityName },
                'Добро пожаловать, {name}! Вы успешно зарегистрированы.\nВаш номер телефона: {phoneNumber}\nВаш пароль: {password}\nВаш город: {cityName}'
            );
            await sendNotification(phoneNumber, message);

            res.status(201).json({
                message: 'Пользователь успешно зарегистрирован.',
                token,
                user: {
                    id: newUser.id,
                    phoneNumber: newUser.phoneNumber,
                    name: newUser.name,
                    cityId: newUser.cityId
                }
            });
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }

    static async login(req, res) {
        try {
            const { phoneNumber, password } = req.body;

            if (!phoneNumber || !password) {
                return res.status(400).json({ message: 'Номер телефона и пароль обязательны.' });
            }

            const user = await User.findOne({ where: { phoneNumber } });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Неверный номер телефона или пароль.' });
            }

            const token = jwt.sign(
                { id: user.id, phoneNumber: user.phoneNumber },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Отправляем уведомление о входе
            const message = await getRenderedTemplate(
                'user.login',
                { name: user.name, phoneNumber },
                'Здравствуйте, {name}!\nВы успешно вошли в систему.\nВаш номер телефона: {phoneNumber}'
            );
            await sendNotification(phoneNumber, message);

            res.status(200).json({
                message: 'Успешный вход.',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    phoneNumber: user.phoneNumber,
                    cityId: user.cityId
                }
            });
        } catch (error) {
            console.error('Ошибка входа:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }

    static async create(req, res) {
        try {
            const { phoneNumber, cityId, name } = req.body;
            const creatorId = req.user.id; // Получаем ID текущего пользователя из токена

            const creator = await User.findByPk(creatorId);
            if (!creator) {
                return res.status(403).json({ message: 'Недостаточно прав для выполнения действия.' });
            }

            if (!phoneNumber || !name) {
                return res.status(400).json({ message: 'Все поля обязательны.' });
            }

            const city = cityId === 'all' || cityId === null ? null : await City.findByPk(cityId);
            if (cityId !== 'all' && cityId !== null && !city) {
                return res.status(404).json({ message: 'Указанный город не найден.' });
            }

            const existingUser = await User.findOne({ where: { phoneNumber } });
            if (existingUser) {
                return res.status(400).json({ message: 'Пользователь с таким номером телефона уже существует.' });
            }

            const generatedPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            const newUser = await User.create({
                phoneNumber,
                cityId: cityId === 'all' ? null : cityId,
                password: hashedPassword,
                name
            });

            // Отправляем уведомление о создании аккаунта
            const cityName = city ? city.name : 'Все города';
            const message = await getRenderedTemplate(
                'user.createdByAdmin',
                { name, phoneNumber, password: generatedPassword, cityName },
                'Здравствуйте, {name}!\nДля вас был создан аккаунт.\nВаш номер телефона: {phoneNumber}\nВаш временный пароль: {password}\nВаш город: {cityName}'
            );
            await sendNotification(phoneNumber, message);

            res.status(201).json({
                message: 'Новый пользователь успешно создан.',
                password: generatedPassword,
                user: {
                    id: newUser.id,
                    phoneNumber: newUser.phoneNumber,
                    name: newUser.name,
                    cityId: newUser.cityId
                }
            });
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден.' });
            }

            await user.destroy();
            res.status(200).json({ message: 'Пользователь успешно удалён.' });
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }


    static async getById(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id, { include: { model: City, as: 'city' } });
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден.' });
            }

            res.status(200).json(user);
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }

    static async getAll(req, res) {
        try {
            const { cityId } = req.query;

            const whereCondition = cityId
                ? {
                    [Op.or]: [
                        { cityId }, // Пользователи для указанного города
                        { cityId: null } // Пользователи для всех городов
                    ]
                }
                : {}; // Пустое условие для выборки всех пользователей

            const users = await User.findAll({
                where: whereCondition,
                include: { model: City, as: 'city' }
            });

            res.status(200).json(users);
        } catch (error) {
            console.error('Ошибка получения списка пользователей:', error);
            res.status(500).json({ message: 'Ошибка сервера.' });
        }
    }
}

module.exports = UserController;
