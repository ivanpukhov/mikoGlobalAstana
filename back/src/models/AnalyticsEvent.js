const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AnalyticsSession = require('./AnalyticsSession');

const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clientId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    eventName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    path: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
    },
});

AnalyticsEvent.belongsTo(AnalyticsSession, {
    foreignKey: 'sessionId',
    targetKey: 'sessionId',
    as: 'session',
});

module.exports = AnalyticsEvent;
