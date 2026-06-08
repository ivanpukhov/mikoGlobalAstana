const { sendBaileysMessage } = require('./baileysService');

const formatPhoneNumber = (phoneNumber) => {
    const formattedNumber = phoneNumber.replace(/\D/g, ''); // Удаляем все, кроме цифр
    if (formattedNumber.length !== 11 || !formattedNumber.startsWith('7')) {
        throw new Error('Некорректный номер телефона. Ожидается формат: 77073670497.');
    }
    return formattedNumber;
};

const sendNotification = (phoneNumber, message, imageUrl = null) => {
    try {
        const formattedNumber = formatPhoneNumber(phoneNumber);
        sendBaileysMessage({ phoneNumber: formattedNumber, message, imageUrl })
            .then((sent) => {
                if (sent) {
                    console.log('Уведомление отправлено на номер', formattedNumber);
                }
            })
            .catch((error) => {
                console.error('Ошибка при отправке уведомления:', error.message || error);
            });
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error.message || error);
    }
};

module.exports = sendNotification;
