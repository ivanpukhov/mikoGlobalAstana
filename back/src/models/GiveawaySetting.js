const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GiveawaySetting = sequelize.define('GiveawaySetting', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Розыгрыш подарков MIKO',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Загрузите фото чека и заполните данные участника.',
    },
    rulesText: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    successTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Заявка принята',
    },
    successText: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Мы сохранили вашу заявку. Номер участника появится на экране после отправки.',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    usePeriod: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    startsAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endsAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    fields: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
}, {
    timestamps: true,
});

module.exports = GiveawaySetting;
