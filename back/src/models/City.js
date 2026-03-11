const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const City = sequelize.define('City', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
});

module.exports = City;
