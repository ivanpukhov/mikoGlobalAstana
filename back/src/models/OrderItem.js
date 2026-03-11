const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Order = require('./Order');
const Product = require('./Product');

const OrderItem = sequelize.define('OrderItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});


OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = OrderItem;
