import { useEffect, useState } from 'react';
import {
    AppShell,
    Avatar,
    Burger,
    Group,
    NavLink,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCategory,
    IconChartBar,
    IconBell,
    IconBuildingStore,
    IconGift,
    IconHome,
    IconLogout,
    IconMapPin,
    IconShoppingCart,
    IconTag,
    IconTicket,
    IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../images/logo-admin.svg';

const NAV_ITEMS = [
    { to: '/admin/products',                icon: IconBuildingStore, label: 'Товары' },
    { to: '/admin/categories',              icon: IconCategory,      label: 'Категории' },
    { to: '/admin/order-gifts',             icon: IconGift,          label: 'Подарки к заказу' },
    { to: '/admin/cities',                  icon: IconMapPin,        label: 'Города' },
    { to: '/admin/orders',                  icon: IconShoppingCart,  label: 'Заказы' },
    { to: '/admin/statistics',              icon: IconChartBar,      label: 'Статистика' },
    { to: '/admin/users',                   icon: IconUsers,         label: 'Пользователи' },
    { to: '/admin/promocodes',              icon: IconTag,           label: 'Промокоды' },
    { to: '/admin/gift-certificates',       icon: IconGift,          label: 'Подарочные серт.' },
    { to: '/admin/purchased-certificates',  icon: IconTicket,        label: 'Купленные серт.' },
    { to: '/admin/notifications',           icon: IconBell,          label: 'Уведомления' },
];

const AdminLayout = () => {
    const [opened, { toggle, close }] = useDisclosure(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const adminName = localStorage.getItem('adminName');

    useEffect(() => {
        if (!token) navigate('/admin/login');
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminCity');
        navigate('/admin/login');
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <img src={logo} alt="Логотип" style={{ height: 36 }} />
                    </Group>

                    <Group gap="sm">
                        <Text size="sm" c="dimmed">{currentTime.toLocaleTimeString('ru-RU')}</Text>
                        <Avatar color="miko" radius="xl" size="sm">
                            {(adminName || 'А')[0].toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={500} visibleFrom="xs">Привет, {adminName || 'Админ'}!</Text>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="xs">
                <AppShell.Section grow>
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            component={Link}
                            to={to}
                            label={label}
                            leftSection={<Icon size={18} />}
                            active={location.pathname.startsWith(to)}
                            color="miko"
                            variant="light"
                            radius="md"
                            mb={2}
                            onClick={close}
                        />
                    ))}
                </AppShell.Section>

                <AppShell.Section>
                    <NavLink
                        label="Выход"
                        leftSection={<IconLogout size={18} />}
                        color="red"
                        variant="light"
                        radius="md"
                        onClick={handleLogout}
                    />
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default AdminLayout;
