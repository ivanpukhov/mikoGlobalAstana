const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const GiftCertificate = require('./GiftCertificate');

const PurchasedCertificate = sequelize.define('PurchasedCertificate', {
    senderPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recipientPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('ожидает оплаты', 'ожидает активации', 'активирован', 'использован'),
        defaultValue: 'ожидает оплаты',
    }
}, { timestamps: true });

PurchasedCertificate.belongsTo(GiftCertificate, { foreignKey: 'giftCertificateId', as: 'giftCertificate' });

module.exports = PurchasedCertificate;
