const { NotificationTemplate, User } = require('../models');
const sendNotification = require('../utils/notificationService');
const { ensureDefaultTemplates, getRenderedTemplate } = require('../utils/templateService');
const { disconnectWhatsApp, getSettings, getStateInstance, getQr } = require('../utils/baileysService');

const getNotificationSettings = async (req, res) => {
    try {
        await ensureDefaultTemplates();
        const settings = await getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateNotificationSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkInstanceState = async (req, res) => {
    try {
        const state = await getStateInstance();
        res.json(state);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInstanceQr = async (req, res) => {
    try {
        const data = await getQr();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logoutWhatsApp = async (req, res) => {
    try {
        const data = await disconnectWhatsApp();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNotificationTemplates = async (req, res) => {
    try {
        await ensureDefaultTemplates();
        const templates = await NotificationTemplate.findAll({ order: [['name', 'ASC']] });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateNotificationTemplate = async (req, res) => {
    try {
        const { key } = req.params;
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Текст шаблона обязателен.' });
        }

        await ensureDefaultTemplates();
        const template = await NotificationTemplate.findOne({ where: { key } });

        if (!template) {
            return res.status(404).json({ error: 'Шаблон не найден.' });
        }

        template.text = text;
        await template.save();

        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendFeedback = async (req, res) => {
    try {
        const { feedbackText, contact = '-' } = req.body;

        if (!feedbackText || !String(feedbackText).trim()) {
            return res.status(400).json({ error: 'Введите текст обратной связи.' });
        }

        const admins = await User.findAll({ where: { cityId: null } });
        if (!admins.length) {
            return res.status(404).json({ error: 'Администраторы не найдены.' });
        }

        const message = await getRenderedTemplate(
            'feedback.toAdmin',
            {
                feedbackText: String(feedbackText).trim(),
                contact: String(contact).trim() || '-',
            },
            '🗣 Обратная связь с сайта\\nСообщение: {feedbackText}\\nКонтакт: {contact}'
        );

        for (const admin of admins) {
            await sendNotification(admin.phoneNumber, message);
        }

        res.json({ message: 'Обратная связь отправлена.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getNotificationSettings,
    updateNotificationSettings,
    checkInstanceState,
    getInstanceQr,
    logoutWhatsApp,
    getNotificationTemplates,
    updateNotificationTemplate,
    sendFeedback,
};
