const axios = require('axios');
const { NotificationSetting } = require('../models');

const trimSlash = (value) => (value || '').replace(/\/+$/, '');

const getSettings = async () => {
    const [settings] = await NotificationSetting.findOrCreate({
        where: { id: 1 },
        defaults: {
            id: 1,
            apiUrl: 'https://api.green-api.com',
            mediaUrl: 'https://media.green-api.com',
        },
    });

    return settings;
};

const buildEndpoint = (settings, methodName) => {
    const apiUrl = trimSlash(settings.apiUrl);
    if (!apiUrl || !settings.idInstance || !settings.apiTokenInstance) {
        throw new Error('Green API не настроен полностью.');
    }

    return `${apiUrl}/waInstance${settings.idInstance}/${methodName}/${settings.apiTokenInstance}`;
};

const getStateInstance = async () => {
    const settings = await getSettings();
    const url = buildEndpoint(settings, 'getStateInstance');
    const { data } = await axios.get(url);

    const state = data?.stateInstance || null;
    const isAuthorized = state === 'authorized';

    settings.instanceState = state;
    settings.isAuthorized = isAuthorized;
    await settings.save();

    return { stateInstance: state, isAuthorized, raw: data };
};

const getQr = async () => {
    const settings = await getSettings();
    const url = buildEndpoint(settings, 'qr');
    const { data } = await axios.get(url);

    return {
        type: data?.type,
        message: data?.message,
        qrCode: data?.message || data?.qrCode || null,
        raw: data,
    };
};

const sendGreenMessage = async ({ phoneNumber, message, imageUrl = null }) => {
    const settings = await getSettings();

    if (!settings.idInstance || !settings.apiTokenInstance) {
        console.warn('Пропуск отправки WhatsApp: Green API не настроен.');
        return;
    }

    const formattedNumber = String(phoneNumber || '').replace(/\D/g, '');
    if (formattedNumber.length !== 11 || !formattedNumber.startsWith('7')) {
        throw new Error('Некорректный номер телефона. Ожидается формат: 77073670497.');
    }

    const chatId = `${formattedNumber}@c.us`;
    const methodName = imageUrl ? 'sendFileByUrl' : 'sendMessage';
    const url = buildEndpoint(settings, methodName);
    const payload = imageUrl
        ? { chatId, urlFile: imageUrl, caption: message, fileName: 'attachment' }
        : { chatId, message };

    await axios.post(url, payload);
};

module.exports = {
    getSettings,
    getStateInstance,
    getQr,
    sendGreenMessage,
};
