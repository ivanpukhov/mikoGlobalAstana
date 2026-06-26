const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AnalyticsSession = sequelize.define('AnalyticsSession', {
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    clientId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    medium: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    campaign: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    content: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    term: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    landingPage: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    referrer: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    gclid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gbraid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    wbraid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    yclid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fbclid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ttclid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    firstSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = AnalyticsSession;
