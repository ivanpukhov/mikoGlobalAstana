const crypto = require('crypto');
const { GiveawayParticipant, GiveawaySetting } = require('../models');

const FIELD_TYPES = new Set([
    'text',
    'textarea',
    'phone',
    'email',
    'number',
    'date',
    'select',
    'multiselect',
    'radio',
    'checkbox',
    'checkbox_group',
]);

const OPTION_FIELD_TYPES = new Set(['select', 'multiselect', 'radio', 'checkbox_group']);

const DEFAULT_FIELDS = [
    {
        id: 'fullName',
        type: 'text',
        label: 'Имя и фамилия',
        placeholder: 'Например, Айгерим Иванова',
        required: true,
        options: [],
        showInTable: true,
        sortOrder: 1,
    },
    {
        id: 'phone',
        type: 'phone',
        label: 'Номер телефона',
        placeholder: '+7 777 000 00 00',
        required: true,
        options: [],
        showInTable: true,
        sortOrder: 2,
    },
    {
        id: 'receiptNumber',
        type: 'text',
        label: 'Номер чека',
        placeholder: 'Укажите номер с чека',
        required: false,
        options: [],
        showInTable: true,
        sortOrder: 3,
    },
    {
        id: 'consent',
        type: 'checkbox',
        label: 'Согласен(на) на участие в розыгрыше и обработку данных',
        placeholder: '',
        required: true,
        options: [],
        showInTable: false,
        sortOrder: 4,
    },
];

const normalizeText = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
};

const parseJsonInput = (value, fallback) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return fallback;
    }

    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const normalizeDateValue = (value) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

const isValidBannerLink = (value) => (
    !value || value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
);

const createFieldId = (label, index) => {
    const slug = normalizeText(label)
        .toLowerCase()
        .replace(/[^a-zа-я0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');

    return slug || `field_${index + 1}`;
};

const normalizeOptions = (options = []) => {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map((option, index) => {
            const label = normalizeText(option?.label || option?.value || '');
            const value = normalizeText(option?.value || label || `option_${index + 1}`);

            if (!label) {
                return null;
            }

            return { label, value };
        })
        .filter(Boolean);
};

const normalizeFields = (fieldsInput) => {
    const rawFields = Array.isArray(fieldsInput) ? fieldsInput : [];
    const ids = new Set();
    const fields = [];

    for (const [index, field] of rawFields.entries()) {
        const type = normalizeText(field?.type);
        const label = normalizeText(field?.label);

        if (!FIELD_TYPES.has(type)) {
            return { error: `Некорректный тип поля "${label || index + 1}".` };
        }

        if (!label) {
            return { error: 'У каждого поля должно быть название.' };
        }

        let id = normalizeText(field?.id) || createFieldId(label, index);
        id = id.replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_');

        if (ids.has(id)) {
            id = `${id}_${index + 1}`;
        }
        ids.add(id);

        const options = normalizeOptions(field?.options);
        if (OPTION_FIELD_TYPES.has(type) && options.length === 0) {
            return { error: `Добавьте варианты ответа для поля "${label}".` };
        }

        fields.push({
            id,
            type,
            label,
            placeholder: normalizeText(field?.placeholder),
            required: Boolean(field?.required),
            options: OPTION_FIELD_TYPES.has(type) ? options : [],
            showInTable: field?.showInTable !== false,
            sortOrder: Number.isFinite(Number(field?.sortOrder)) ? Number(field.sortOrder) : index + 1,
        });
    }

    return {
        fields: fields.sort((a, b) => a.sortOrder - b.sortOrder),
    };
};

const getOrCreateSettings = async () => {
    const [settings] = await GiveawaySetting.findOrCreate({
        where: { id: 1 },
        defaults: {
            title: 'Розыгрыш подарков MIKO',
            description: 'Загрузите фото чека и заполните данные участника.',
            rulesText: 'Участвуют чеки с покупками MIKO. Один чек можно загрузить один раз.',
            successTitle: 'Вы участвуете в розыгрыше',
            successText: 'Мы сохранили вашу заявку. Сохраните номер участника до объявления результатов.',
            isActive: true,
            usePeriod: false,
            startsAt: null,
            endsAt: null,
            bannerImage: null,
            bannerLink: null,
            fields: DEFAULT_FIELDS,
        },
    });

    return settings;
};

const getAcceptanceState = (settings) => {
    const usePeriod = Boolean(settings.usePeriod);
    const now = new Date();
    const startsAt = settings.startsAt ? new Date(settings.startsAt) : null;
    const endsAt = settings.endsAt ? new Date(settings.endsAt) : null;

    if (!usePeriod) {
        return {
            isAcceptingReceipts: Boolean(settings.isActive),
            closedReason: settings.isActive ? null : 'Приём чеков сейчас закрыт.',
        };
    }

    if (!startsAt || !endsAt) {
        return {
            isAcceptingReceipts: false,
            closedReason: 'Период розыгрыша ещё не настроен.',
        };
    }

    if (now < startsAt) {
        return {
            isAcceptingReceipts: false,
            closedReason: 'Приём чеков начнётся позже.',
        };
    }

    if (now > endsAt) {
        return {
            isAcceptingReceipts: false,
            closedReason: 'Период приёма чеков завершён.',
        };
    }

    return {
        isAcceptingReceipts: true,
        closedReason: null,
    };
};

const serializeSettings = (settings) => ({
    id: settings.id,
    title: settings.title,
    description: settings.description,
    rulesText: settings.rulesText,
    successTitle: settings.successTitle,
    successText: settings.successText,
    isActive: settings.isActive,
    usePeriod: settings.usePeriod,
    startsAt: settings.startsAt,
    endsAt: settings.endsAt,
    bannerImage: settings.bannerImage,
    bannerLink: settings.bannerLink,
    ...getAcceptanceState(settings),
    fields: Array.isArray(settings.fields) ? settings.fields : DEFAULT_FIELDS,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
});

const isEmptyValue = (value, fieldType) => {
    if (fieldType === 'checkbox') {
        return value !== true && value !== 'true';
    }

    if (fieldType === 'multiselect' || fieldType === 'checkbox_group') {
        return !Array.isArray(value) || value.length === 0;
    }

    return typeof value === 'undefined' || value === null || String(value).trim() === '';
};

const getOptionValues = (field) => new Set((field.options || []).map((option) => option.value));

const normalizeParticipantValue = (field, rawValue) => {
    if (field.type === 'checkbox') {
        return rawValue === true || rawValue === 'true';
    }

    if (field.type === 'multiselect' || field.type === 'checkbox_group') {
        return Array.isArray(rawValue) ? rawValue.map(String) : [];
    }

    if (field.type === 'number') {
        if (isEmptyValue(rawValue, field.type)) {
            return '';
        }

        return Number(rawValue);
    }

    return typeof rawValue === 'undefined' || rawValue === null ? '' : String(rawValue).trim();
};

const validateParticipantData = (rawData, fields) => {
    const data = {};

    for (const field of fields) {
        const value = normalizeParticipantValue(field, rawData?.[field.id]);

        if (field.required && isEmptyValue(value, field.type)) {
            return { error: `Заполните поле "${field.label}".` };
        }

        if (!isEmptyValue(value, field.type)) {
            if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return { error: `Укажите корректный email в поле "${field.label}".` };
            }

            if (field.type === 'number' && !Number.isFinite(value)) {
                return { error: `Укажите число в поле "${field.label}".` };
            }

            if (field.type === 'select' || field.type === 'radio') {
                const allowedValues = getOptionValues(field);
                if (!allowedValues.has(value)) {
                    return { error: `Выберите корректный вариант в поле "${field.label}".` };
                }
            }

            if (field.type === 'multiselect' || field.type === 'checkbox_group') {
                const allowedValues = getOptionValues(field);
                const hasUnknownValue = value.some((item) => !allowedValues.has(item));
                if (hasUnknownValue) {
                    return { error: `Выберите корректные варианты в поле "${field.label}".` };
                }
            }
        }

        data[field.id] = value;
    }

    return { data };
};

const generateTicketNumber = () => {
    const now = new Date();
    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();

    return `MIKO-${datePart}-${suffix}`;
};

const getPublicGiveawayForm = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(serializeSettings(settings));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getGiveawaySettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(serializeSettings(settings));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateGiveawaySettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const fieldsInput = parseJsonInput(req.body.fields, []);
        const { fields, error } = normalizeFields(fieldsInput);

        if (error) {
            return res.status(400).json({ error });
        }

        const title = normalizeText(req.body.title);
        const successTitle = normalizeText(req.body.successTitle);
        const usePeriod = req.body.usePeriod === true || req.body.usePeriod === 'true';
        const startsAt = normalizeDateValue(req.body.startsAt);
        const endsAt = normalizeDateValue(req.body.endsAt);
        const bannerLink = normalizeText(req.body.bannerLink);
        const removeBanner = req.body.removeBanner === true || req.body.removeBanner === 'true';
        const bannerImage = req.file
            ? `/uploads/${req.file.filename}`
            : removeBanner
                ? null
                : settings.bannerImage;

        if (!title) {
            return res.status(400).json({ error: 'Укажите заголовок страницы розыгрыша.' });
        }

        if (!successTitle) {
            return res.status(400).json({ error: 'Укажите заголовок успешной отправки.' });
        }

        if (usePeriod && (!startsAt || !endsAt)) {
            return res.status(400).json({ error: 'Для периода укажите дату начала и окончания.' });
        }

        if (usePeriod && startsAt >= endsAt) {
            return res.status(400).json({ error: 'Дата окончания должна быть позже даты начала.' });
        }

        if (!isValidBannerLink(bannerLink)) {
            return res.status(400).json({ error: 'Ссылка баннера должна начинаться с /, http:// или https://.' });
        }

        if (bannerImage && !bannerLink) {
            return res.status(400).json({ error: 'Укажите ссылку для клика по баннеру.' });
        }

        await settings.update({
            title,
            description: normalizeText(req.body.description) || null,
            rulesText: normalizeText(req.body.rulesText) || null,
            successTitle,
            successText: normalizeText(req.body.successText) || null,
            isActive: req.body.isActive === true || req.body.isActive === 'true',
            usePeriod,
            startsAt: usePeriod ? startsAt : null,
            endsAt: usePeriod ? endsAt : null,
            bannerImage,
            bannerLink: bannerImage ? bannerLink : null,
            fields,
        });

        res.json(serializeSettings(settings));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createGiveawayParticipant = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const { isAcceptingReceipts, closedReason } = getAcceptanceState(settings);

        if (!isAcceptingReceipts) {
            return res.status(403).json({ error: closedReason || 'Приём чеков сейчас закрыт.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Прикрепите фото чека.' });
        }

        const fields = Array.isArray(settings.fields) ? settings.fields : DEFAULT_FIELDS;
        const rawData = parseJsonInput(req.body.formData, {});
        const { data, error } = validateParticipantData(rawData, fields);

        if (error) {
            return res.status(400).json({ error });
        }

        let participant = null;
        let lastError = null;

        for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
                participant = await GiveawayParticipant.create({
                    ticketNumber: generateTicketNumber(),
                    receiptImage: `/uploads/${req.file.filename}`,
                    formData: data,
                    ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
                    userAgent: req.headers['user-agent'] || null,
                });
                break;
            } catch (createError) {
                lastError = createError;
            }
        }

        if (!participant) {
            throw lastError || new Error('Не удалось создать участника.');
        }

        res.status(201).json({
            id: participant.id,
            ticketNumber: participant.ticketNumber,
            successTitle: settings.successTitle,
            successText: settings.successText,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getGiveawayParticipants = async (req, res) => {
    try {
        const participants = await GiveawayParticipant.findAll({
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
            ],
        });

        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateGiveawayParticipant = async (req, res) => {
    try {
        const participant = await GiveawayParticipant.findByPk(req.params.id);

        if (!participant) {
            return res.status(404).json({ error: 'Участник не найден.' });
        }

        const status = normalizeText(req.body.status);
        if (status && !['new', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Выберите корректный статус участника.' });
        }

        await participant.update({
            status: status || participant.status,
            adminNote: normalizeText(req.body.adminNote) || null,
        });

        res.json(participant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteGiveawayParticipant = async (req, res) => {
    try {
        const participant = await GiveawayParticipant.findByPk(req.params.id);

        if (!participant) {
            return res.status(404).json({ error: 'Участник не найден.' });
        }

        await participant.destroy();
        res.json({ message: 'Участник удалён.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPublicGiveawayForm,
    getGiveawaySettings,
    updateGiveawaySettings,
    createGiveawayParticipant,
    getGiveawayParticipants,
    updateGiveawayParticipant,
    deleteGiveawayParticipant,
};
