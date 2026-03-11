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
});


module.exports = Product;
