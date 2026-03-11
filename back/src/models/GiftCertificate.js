const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GiftCertificate = sequelize.define('GiftCertificate', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true
});

module.exports = GiftCertificate;
