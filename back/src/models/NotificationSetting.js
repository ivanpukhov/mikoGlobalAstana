const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationSetting = sequelize.define('NotificationSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
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
