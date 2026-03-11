const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');

const ProductAttribute = sequelize.define('ProductAttribute', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

Product.hasMany(ProductAttribute, { foreignKey: 'productId', as: 'attributes' });
ProductAttribute.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = ProductAttribute;
