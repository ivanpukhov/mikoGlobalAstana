const axios = require('axios');

const formatPhoneNumber = (phoneNumber) => {
    const formattedNumber = phoneNumber.replace(/\D/g, ''); // Удаляем все, кроме цифр
    if (formattedNumber.length !== 11 || !formattedNumber.startsWith('7')) {
        throw new Error('Некорректный номер телефона. Ожидается формат: 77073670497.');
    }
    return formattedNumber;
};

const sendNotification = async (phoneNumber, message, imageUrl = null) => {
    try {
        const formattedNumber = formatPhoneNumber(phoneNumber);
        const chatId = `${formattedNumber}@c.us`;
        const url = imageUrl
            ? `https://api.green-api.com/waInstance7103145182/sendFileByUrl/ba4e7758591a4e63ae6994cd23a91631d2980145b0fd4109b5`
            : `https://api.green-api.com/waInstance7103145182/sendMessage/ba4e7758591a4e63ae6994cd23a91631d2980145b0fd4109b5`;

        const payload = imageUrl
            ? { chatId, urlFile: imageUrl, caption: message,  fileName: "freegift" }
            : { chatId, message };

        await axios.post(url, payload);
        console.log('Уведомление отправлено на номер', formattedNumber);
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error.message || error);
        console.log(error);
    }
};

module.exports = sendNotification;
