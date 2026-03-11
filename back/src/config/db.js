const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH,
    logging: false, // Убираем логи для чистоты
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Соединение с базой данных успешно установлено.');
    } catch (error) {
        console.error('Ошибка подключения к базе данных:', error);
    }
})();

module.exports = sequelize;
