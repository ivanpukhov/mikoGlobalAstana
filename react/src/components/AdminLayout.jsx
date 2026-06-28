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
    IconBrandWhatsapp,
    IconBuildingStore,
    IconGift,
    IconHome,
    IconLogout,
    IconMapPin,
    IconPhoto,
    IconRosetteDiscountCheck,
    IconShoppingCart,
    IconTag,
    IconTicket,
    IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../images/logo-admin.svg';
import api, { clearAdminSession } from '../api/api';

const NAV_ITEMS = [
    { to: '/admin/products',                icon: IconBuildingStore, label: 'Товары' },
    { to: '/admin/categories',              icon: IconCategory,      label: 'Категории' },
    { to: '/admin/banners',                 icon: IconPhoto,         label: 'Баннеры' },
    { to: '/admin/order-gifts',             icon: IconGift,          label: 'Подарки к заказу' },
    { to: '/admin/cities',                  icon: IconMapPin,        label: 'Города' },
    { to: '/admin/orders',                  icon: IconShoppingCart,  label: 'Заказы' },
    { to: '/admin/statistics',              icon: IconChartBar,      label: 'Статистика' },
    { to: '/admin/users',                   icon: IconUsers,         label: 'Пользователи' },
    { to: '/admin/promocodes',              icon: IconTag,           label: 'Промокоды' },
    { to: '/admin/gift-certificates',       icon: IconGift,          label: 'Подарочные серт.' },
    { to: '/admin/purchased-certificates',  icon: IconTicket,        label: 'Купленные серт.' },
    { to: '/admin/giveaway',                icon: IconRosetteDiscountCheck, label: 'Розыгрыш' },
    { to: '/admin/whatsapp',                icon: IconBrandWhatsapp, label: 'WhatsApp' },
];

const AdminLayout = () => {
    const [opened, { toggle, close }] = useDisclosure(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();
    const adminName = localStorage.getItem('adminName');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const validateSession = async () => {
            const currentToken = localStorage.getItem('token');

            if (!currentToken) {
                clearAdminSession(false);
                navigate('/admin/login', { replace: true });
                return;
            }

            try {
                const [{ data: meData }, { data: refreshData }] = await Promise.all([
                    api.get('/users/me'),
                    api.post('/users/refresh'),
                ]);

                const user = refreshData.user || meData.user;
                if (refreshData.token) localStorage.setItem('token', refreshData.token);
                if (user?.name) localStorage.setItem('adminName', user.name);
                if (user?.cityId !== undefined && user?.cityId !== null) {
                    localStorage.setItem('adminCity', user.cityId);
                }
                if (user?.phoneNumber) localStorage.setItem('phoneNumber', user.phoneNumber);
            } catch {
                clearAdminSession(false);
                navigate('/admin/login', { replace: true });
            }
        };

        validateSession();
        const authTimer = setInterval(validateSession, 5 * 60 * 1000);

        return () => {
            clearInterval(timer);
            clearInterval(authTimer);
        };
    }, [navigate]);

    const handleLogout = () => {
        clearAdminSession(false);
        navigate('/admin/login', { replace: true });
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
