export const GIVEAWAY_FIELD_TYPES = [
    { value: 'text', label: 'Текст' },
    { value: 'textarea', label: 'Большой текст' },
    { value: 'phone', label: 'Телефон' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'select', label: 'Список' },
    { value: 'multiselect', label: 'Мультисписок' },
    { value: 'radio', label: 'Один вариант' },
    { value: 'checkbox', label: 'Чекбокс' },
    { value: 'checkbox_group', label: 'Несколько чекбоксов' },
];

export const OPTION_FIELD_TYPES = ['select', 'multiselect', 'radio', 'checkbox_group'];

export const GIVEAWAY_STATUS_OPTIONS = [
    { value: 'all', label: 'Все статусы' },
    { value: 'new', label: 'Новые' },
    { value: 'approved', label: 'Подтверждённые' },
    { value: 'rejected', label: 'Отклонённые' },
];

export const GIVEAWAY_STATUS_LABELS = {
    new: 'Новый',
    approved: 'Подтверждён',
    rejected: 'Отклонён',
};

export const GIVEAWAY_STATUS_COLORS = {
    new: 'blue',
    approved: 'teal',
    rejected: 'red',
};

export const getFieldTypeLabel = (type) => (
    GIVEAWAY_FIELD_TYPES.find((item) => item.value === type)?.label || type
);

export const createEmptyGiveawayField = (index = 0) => ({
    id: `field_${Date.now()}_${index}`,
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
    showInTable: true,
    sortOrder: index + 1,
});

export const normalizeOptionsText = (text) => (
    String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => ({ label: line, value: line || `option_${index + 1}` }))
);

export const optionsToText = (options = []) => (
    Array.isArray(options)
        ? options.map((option) => option.label || option.value).filter(Boolean).join('\n')
        : ''
);

export const getInitialFieldValue = (field) => {
    if (field.type === 'checkbox') {
        return false;
    }

    if (field.type === 'multiselect' || field.type === 'checkbox_group') {
        return [];
    }

    return '';
};

export const formatGiveawayValue = (value, field) => {
    if (field?.type === 'checkbox') {
        return value ? 'Да' : 'Нет';
    }

    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'undefined' || value === null || value === '') {
        return '—';
    }

    return String(value);
};

export const formatGiveawayDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const resolveGiveawayReceipt = (path) => {
    if (!path) {
        return '';
    }

    if (path.startsWith('http')) {
        return path;
    }

    return `/api${path}`;
};
