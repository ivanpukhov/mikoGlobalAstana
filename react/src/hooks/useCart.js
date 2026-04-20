import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cart';
const EVENT_NAME = 'cart:changed';

const normalizeCart = (value) => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value).reduce((acc, [key, item]) => {
        if (!item || typeof item !== 'object') {
            return acc;
        }

        const normalizedId = item.id ?? key;
        acc[normalizedId] = {
            ...item,
            id: normalizedId,
        };
        return acc;
    }, {});
};

const readStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }
        return normalizeCart(JSON.parse(raw));
    } catch {
        return {};
    }
};

const writeStorage = (cart) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCart(cart)));
    window.dispatchEvent(new Event(EVENT_NAME));
};

const computeCount = (cart) =>
    Object.values(cart).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

export const useCart = () => {
    const [cart, setCart] = useState(() => readStorage());

    useEffect(() => {
        const sync = () => setCart(readStorage());
        window.addEventListener(EVENT_NAME, sync);
        window.addEventListener('storage', sync);

        return () => {
            window.removeEventListener(EVENT_NAME, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const has = useCallback((id) => Boolean(cart?.[id]), [cart]);
    const quantity = useCallback((id) => Number(cart?.[id]?.quantity || 0), [cart]);

    const add = useCallback((product) => {
        const current = readStorage();
        const id = product.id;

        if (current[id]) {
            current[id] = { ...current[id], quantity: (current[id].quantity || 0) + 1 };
        } else {
            current[id] = { ...product, quantity: 1 };
        }

        writeStorage(current);
    }, []);

    const setQuantity = useCallback((id, qty) => {
        const current = readStorage();

        if (!current[id]) {
            return;
        }

        if (qty <= 0) {
            delete current[id];
        } else {
            current[id] = { ...current[id], quantity: qty };
        }

        writeStorage(current);
    }, []);

    const remove = useCallback((id) => {
        const current = readStorage();
        delete current[id];
        writeStorage(current);
    }, []);

    const clear = useCallback(() => {
        writeStorage({});
    }, []);

    return {
        cart,
        items: Object.values(cart),
        count: computeCount(cart),
        has,
        quantity,
        add,
        setQuantity,
        remove,
        clear,
    };
};
