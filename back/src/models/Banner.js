const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
    type: {
        type: DataTypes.ENUM('image', 'image_link', 'text'),
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    linkUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    buttonText: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    buttonLink: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    background: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'sunset',
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    timestamps: true,
});

module.exports = Banner;
