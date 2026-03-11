const { NotificationTemplate } = require('../models');

const DEFAULT_TEMPLATES = [
    {
        key: 'user.register',
        name: 'Регистрация пользователя',
        text: 'Добро пожаловать, {name}! Вы успешно зарегистрированы.\\nВаш номер телефона: {phoneNumber}\\nВаш пароль: {password}\\nВаш город: {cityName}',
    },
    {
        key: 'user.login',
        name: 'Вход пользователя',
        text: 'Здравствуйте, {name}!\\nВы успешно вошли в систему.\\nВаш номер телефона: {phoneNumber}',
    },
    {
        key: 'user.createdByAdmin',
        name: 'Создание пользователя админом',
        text: 'Здравствуйте, {name}!\\nДля вас был создан аккаунт.\\nВаш номер телефона: {phoneNumber}\\nВаш временный пароль: {password}\\nВаш город: {cityName}',
    },
    {
        key: 'order.createdForCustomer',
        name: 'Создан заказ (клиент)',
        text: '📦 Ваш заказ успешно создан!\\n\\nИмя клиента: {customerName}\\nНомер телефона: {customerPhone}\\nАдрес доставки: {customerAddress}\\nСпособ доставки: {deliveryMethod}\\nСпособ оплаты: {paymentMethod}\\nСумма заказа: {finalTotalAmount} KZT\\n{promoText}\\n{certificateText}\\n\\nТовары:\\n{itemsDetailsText}\\n\\nСпасибо за ваш заказ!',
    },
    {
        key: 'order.createdForAdmin',
        name: 'Создан заказ (админ)',
        text: '🔔 Новый заказ в вашем городе {cityName}!\\n\\nИмя клиента: {customerName}\\nНомер телефона: {customerPhone}\\nАдрес доставки: {customerAddress}\\nСпособ доставки: {deliveryMethod}\\nСпособ оплаты: {paymentMethod}\\nСумма заказа: {finalTotalAmount} KZT\\n{promoText}\\n{certificateText}\\n\\nТовары:\\n{itemsDetailsText}\\n\\nСсылка: {orderLink}',
    },
    {
        key: 'order.statusUpdatedForCustomer',
        name: 'Обновление статуса заказа (клиент)',
        text: '📦 Обновление по вашему заказу!\\n\\nЗдравствуйте, {customerName}\\nСтатус заказа №{orderId}: {status}',
    },
    {
        key: 'order.statusUpdatedForAdmin',
        name: 'Обновление статуса заказа (админ)',
        text: '🔔 Статус заказа №{orderId} изменён на {status}.\\nКлиент: {customerName}\\nТелефон: {customerPhone}',
    },
    {
        key: 'certificate.general',
        name: 'События по сертификатам (админ)',
        text: '🔔 {action}\\nID: {id}\\nКод: {code}\\nСтатус: {status}\\nСумма: {amount} KZT\\nОтправитель: {senderPhone}\\nПолучатель: {recipientPhone}\\nСообщение: {message}\\nТип сертификата: {certificateName}',
    },
    {
        key: 'certificate.paymentConfirmed',
        name: 'Сертификат активирован (получатель)',
        text: '🎁 Вам подарили сертификат на сумму {amount} KZT!\\nОтправитель: {senderPhone}\\nСообщение: {message}\\nКод сертификата: {code}\\n\\nДля активации перейдите по ссылке: {url}',
    },
    {
        key: 'feedback.toAdmin',
        name: 'Обратная связь (админ)',
        text: '🗣 Обратная связь с сайта\\nСообщение: {feedbackText}\\nКонтакт: {contact}',
    },
];

const ensureDefaultTemplates = async () => {
    for (const template of DEFAULT_TEMPLATES) {
        const existing = await NotificationTemplate.findOne({ where: { key: template.key } });
        if (!existing) {
            await NotificationTemplate.create(template);
        }
    }
};

const renderTemplate = (templateText, variables = {}) => {
    return templateText.replace(/\{([^}]+)\}/g, (_, token) => {
        const value = variables[token.trim()];
        return value === undefined || value === null ? '' : String(value);
    });
};

const getRenderedTemplate = async (key, variables = {}, fallbackText = '') => {
    await ensureDefaultTemplates();
    const template = await NotificationTemplate.findOne({ where: { key } });

    if (!template) {
        return renderTemplate(fallbackText, variables);
    }

    return renderTemplate(template.text, variables);
};

module.exports = {
    DEFAULT_TEMPLATES,
    ensureDefaultTemplates,
    renderTemplate,
    getRenderedTemplate,
};
