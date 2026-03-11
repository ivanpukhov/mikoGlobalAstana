const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PromoCode = sequelize.define('PromoCode', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    discountPercentage: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
            max: 100,
        },
    },
    discountAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    isActive: {
        type: DataTypes.VIRTUAL,
        get() {
            return (
                this.usageCount < this.usageLimit &&
                new Date() <= this.expirationDate
            );
        },
    },
}, {
    timestamps: true,
});

module.exports = PromoCode;
