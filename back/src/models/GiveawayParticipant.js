const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GiveawayParticipant = sequelize.define('GiveawayParticipant', {
    ticketNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    receiptImage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    formData: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
    status: {
        type: DataTypes.ENUM('new', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'new',
    },
    adminNote: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = GiveawayParticipant;
