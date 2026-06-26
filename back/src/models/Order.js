const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const City = require('./City');
const PromoCode = require('./PromoCode');
const PurchasedCertificate = require('./PurchasedCertificate');

const Order = sequelize.define('Order', {
    customerName: { type: DataTypes.STRING, allowNull: false },
    customerPhone: { type: DataTypes.STRING, allowNull: false },
    customerAddress: { type: DataTypes.STRING, allowNull: false },
    deliveryMethod: { type: DataTypes.STRING, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    promoCodeId: { type: DataTypes.INTEGER, allowNull: true },
    giftCertificateCode: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true }, // новый статус заказа
    analyticsSessionId: { type: DataTypes.STRING, allowNull: true },
    analyticsClientId: { type: DataTypes.STRING, allowNull: true },
    attributionSource: { type: DataTypes.STRING, allowNull: true },
    attributionMedium: { type: DataTypes.STRING, allowNull: true },
    attributionCampaign: { type: DataTypes.STRING, allowNull: true },
    attributionContent: { type: DataTypes.STRING, allowNull: true },
    attributionTerm: { type: DataTypes.STRING, allowNull: true },
    landingPage: { type: DataTypes.TEXT, allowNull: true },
    referrer: { type: DataTypes.TEXT, allowNull: true },
    gclid: { type: DataTypes.STRING, allowNull: true },
    gbraid: { type: DataTypes.STRING, allowNull: true },
    wbraid: { type: DataTypes.STRING, allowNull: true },
    yclid: { type: DataTypes.STRING, allowNull: true },
    fbclid: { type: DataTypes.STRING, allowNull: true },
    ttclid: { type: DataTypes.STRING, allowNull: true },
});

Order.belongsTo(City, { foreignKey: 'cityId', as: 'city' });
City.hasMany(Order, { foreignKey: 'cityId', as: 'orders' });

Order.belongsTo(PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });
Order.belongsTo(PurchasedCertificate, { foreignKey: 'giftCertificateCode', targetKey: 'code', as: 'giftCertificate' });

module.exports = Order;
