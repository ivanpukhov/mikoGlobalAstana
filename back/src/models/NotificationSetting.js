const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationSetting = sequelize.define('NotificationSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
    },
    apiUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://api.green-api.com',
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://media.green-api.com',
    },
    idInstance: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    apiTokenInstance: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    instanceState: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isAuthorized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

module.exports = NotificationSetting;
