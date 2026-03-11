const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

module.exports = NotificationTemplate;
