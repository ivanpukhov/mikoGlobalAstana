const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderGiftRule = sequelize.define('OrderGiftRule', {
    minAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    maxAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
});

module.exports = OrderGiftRule;
