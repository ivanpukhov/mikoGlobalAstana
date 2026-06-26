const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');
const Subcategory = require('./Subcategory');

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    image: {
        type: DataTypes.STRING,
    },
    isExpiringSoon: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    expiresAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    shelfLifeMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    expiryNote: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});


module.exports = Product;
