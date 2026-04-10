export const EVERY_ORDER_GIFT = "сок кантабили";

export const ORDER_GIFT_TIERS = [
    {
        min: 6000,
        max: 9999,
        gift: "Гель для мытья посуды 0,5л",
    },
    {
        min: 10000,
        max: 14999,
        gift: "Кондиционер «Fresh» любой аромат 1л",
    },
    {
        min: 15000,
        max: 19999,
        gift: "Универсальное средство «Clean Master Super» 0,5л",
    },
    {
        min: 20000,
        max: Number.POSITIVE_INFINITY,
        gift: "Кондиционер «Fresh» любой аромат 2л",
    },
];

export const getOrderGiftTier = (amount) => ORDER_GIFT_TIERS.find(({ min, max }) => amount >= min && amount <= max) || null;

export const getNextOrderGiftTier = (amount) => ORDER_GIFT_TIERS.find(({ min }) => amount < min) || null;
