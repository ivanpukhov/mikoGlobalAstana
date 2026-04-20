import { NavLink } from 'react-router-dom';
import { Box, Indicator, Stack, Text } from '@mantine/core';
import { IconCategory, IconHome, IconShoppingCart } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import classes from './MobileBottomBar.module.css';

const items = [
    { to: '/', label: 'Главная', icon: IconHome, end: true },
    { to: '/categories', label: 'Каталог', icon: IconCategory },
    { to: '/cart', label: 'Корзина', icon: IconShoppingCart, badge: 'cart' },
];

export const MobileBottomBar = () => {
    const cart = useCart();

    return (
        <Box className={classes.root}>
            {items.map(({ to, label, icon: Icon, end, badge }) => {
                const count = badge === 'cart' ? cart.count : 0;

                return (
                    <NavLink key={to} to={to} end={end} className={classes.item}>
                        {({ isActive }) => (
                            <Stack gap={2} align="center">
                                <Indicator
                                    label={count}
                                    size={14}
                                    color="red"
                                    disabled={!count}
                                    offset={2}
                                >
                                    <Icon
                                        size={22}
                                        stroke={isActive ? 2.4 : 1.8}
                                        color={
                                            isActive
                                                ? 'var(--mantine-color-miko-6)'
                                                : 'var(--mantine-color-gray-6)'
                                        }
                                    />
                                </Indicator>
                                <Text
                                    fz={10}
                                    fw={isActive ? 700 : 500}
                                    c={isActive ? 'miko.7' : 'dimmed'}
                                >
                                    {label}
                                </Text>
                            </Stack>
                        )}
                    </NavLink>
                );
            })}
        </Box>
    );
};
