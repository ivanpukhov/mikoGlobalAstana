const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');
const City = require('./City');

const ProductPrice = sequelize.define('ProductPrice', {
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    availability: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // По умолчанию товар доступен
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: true, // Скидка в процентах
    },
});


module.exports = ProductPrice;
