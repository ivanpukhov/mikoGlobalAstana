export const roundAmount = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.round(numericValue);
};

export const formatInteger = (value) => new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
}).format(roundAmount(value)).replace(/[\u00A0\u202F]/g, " ");

export const formatCurrency = (value, currency = "₸") => `${formatInteger(value)} ${currency}`;
