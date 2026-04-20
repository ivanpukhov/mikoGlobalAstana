import { Box, rem, Text, UnstyledButton } from '@mantine/core';
import {
    IconHome2,
    IconLayoutGrid,
    IconShoppingCart,
} from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './Bar.module.scss';

function getCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    return Object.values(cart).reduce((sum, item) => sum + (item?.quantity || 0), 0);
}

const NAV_ITEMS = [
    { to: '/', icon: IconHome2, label: 'Главная', exact: true },
    { to: '/categories', icon: IconLayoutGrid, label: 'Каталог', exact: false },
    { to: '/cart', icon: IconShoppingCart, label: 'Корзина', exact: false },
];

const BarMobile = () => {
    const [cartCount, setCartCount] = useState(getCartCount);

    useEffect(() => {
        const refresh = () => setCartCount(getCartCount());
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    return (
        <nav className={styles.bar}>
            {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) =>
                        `${styles.bar__item} ${isActive ? styles['bar__item--active'] : ''}`
                    }
                >
                    <Box pos="relative" display="inline-flex">
                        <Icon size={24} />
                        {label === 'Корзина' && cartCount > 0 && (
                            <Box
                                className={styles.badge}
                                pos="absolute"
                                top={-6}
                                right={-8}
                            >
                                {cartCount > 9 ? '9+' : cartCount}
                            </Box>
                        )}
                    </Box>
                    <Text size="xs" mt={2}>{label}</Text>
                </NavLink>
            ))}
        </nav>
    );
};

export default BarMobile;
