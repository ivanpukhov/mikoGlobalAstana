const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const City = require('./City');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    cityId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Позволяем быть null
        references: {
            model: City,
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

City.hasMany(User, { foreignKey: 'cityId', as: 'users' });
User.belongsTo(City, { foreignKey: 'cityId', as: 'city' });

module.exports = User;
