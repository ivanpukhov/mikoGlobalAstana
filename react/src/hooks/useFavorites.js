import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'favorites';
const EVENT_NAME = 'favorites:changed';

const readStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeStorage = (ids) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const useFavorites = () => {
    const [ids, setIds] = useState(() => readStorage());

    useEffect(() => {
        const sync = () => setIds(readStorage());
        window.addEventListener(EVENT_NAME, sync);
        window.addEventListener('storage', sync);

        return () => {
            window.removeEventListener(EVENT_NAME, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const has = useCallback((id) => ids.includes(Number(id)), [ids]);

    const add = useCallback((id) => {
        const next = Array.from(new Set([...readStorage(), Number(id)]));
        writeStorage(next);
    }, []);

    const remove = useCallback((id) => {
        const next = readStorage().filter((item) => item !== Number(id));
        writeStorage(next);
    }, []);

    const toggle = useCallback(
        (id) => {
            if (has(id)) {
                remove(id);
            } else {
                add(id);
            }
        },
        [add, has, remove]
    );

    return {
        ids,
        count: ids.length,
        has,
        add,
        remove,
        toggle,
    };
};
