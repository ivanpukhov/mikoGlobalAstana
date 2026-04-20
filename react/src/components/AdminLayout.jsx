import { useEffect, useState } from 'react';
import {
    AppShell,
    Avatar,
    Badge,
    Burger,
    Group,
    NavLink,
    Select,
    Text,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
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
import api from '../api/api';
import logo from '../images/logo-admin.svg';

const NAV_ITEMS = [
    { to: '/admin/products',                icon: IconBuildingStore, label: 'Товары' },
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
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(localStorage.getItem('adminCity') || 'all');
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const adminName = localStorage.getItem('adminName');

    useEffect(() => {
        if (!token) navigate('/admin/login');
        api.get('/cities')
            .then(({ data }) => setCities(data))
            .catch(console.error);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [token, navigate]);

    const handleCityChange = (value) => {
        setSelectedCity(value);
        localStorage.setItem('adminCity', value);
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminName');
        navigate('/admin/login');
    };

    const cityOptions = [
        { value: 'all', label: 'Все города' },
        ...cities.map((c) => ({ value: c.id.toString(), label: c.name })),
    ];

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
                        <Select
                            value={selectedCity}
                            onChange={handleCityChange}
                            data={cityOptions}
                            size="xs"
                            w={160}
                            radius="md"
                        />
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
