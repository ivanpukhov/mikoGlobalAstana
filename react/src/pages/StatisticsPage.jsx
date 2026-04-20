import { useEffect, useState } from 'react';
import {
    Card,
    Group,
    Loader,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const DATE_OPTIONS = [
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'last_week', label: 'За последнюю неделю' },
    { value: 'last_month', label: 'За последний месяц' },
];

const getDateRange = (value) => {
    const today = dayjs().startOf('day');
    switch (value) {
        case 'today':     return [today, dayjs().endOf('day')];
        case 'yesterday': return [today.subtract(1, 'day'), today.subtract(1, 'day').endOf('day')];
        case 'last_week': return [today.subtract(7, 'days'), dayjs().endOf('day')];
        case 'last_month':return [today.subtract(1, 'month'), dayjs().endOf('day')];
        default:          return [today, dayjs().endOf('day')];
    }
};

const formatNumber = (value) =>
    value != null ? new Intl.NumberFormat('ru-RU').format(value) : '—';

const StatCard = ({ title, value }) => (
    <Card radius="xl" shadow="sm" p="lg" ta="center" withBorder>
        <Text size="sm" c="dimmed" mb="xs">{title}</Text>
        <Text size="xl" fw={800} c="miko">{value}</Text>
    </Card>
);

const StatisticsPage = () => {
    const [statistics, setStatistics] = useState(null);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('last_month');
    const [dateRange, setDateRange] = useState(getDateRange('last_month'));

    const handlePeriodChange = (value) => {
        setSelectedPeriod(value);
        setDateRange(getDateRange(value));
    };

    useEffect(() => {
        api.get('/cities').then(({ data }) => setCities(data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const startDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
        const endDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
        api.get(`/orders/statistics?startDate=${startDate}&endDate=${endDate}`)
            .then(({ data }) => { setStatistics(data); setError(''); })
            .catch(() => setError('Ошибка загрузки данных. Повторите попытку позже.'))
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) {
        return <Group justify="center" py="xl"><Loader size="lg" color="miko" /></Group>;
    }

    if (error) {
        return <Text c="red" ta="center" py="xl">{error}</Text>;
    }

    return (
        <Stack gap="lg" maw={1200} mx="auto">
            <Group justify="space-between" align="flex-end">
                <Stack gap={2}>
                    <Title order={3} fw={700}>Статистика заказов</Title>
                    <Text c="dimmed" size="sm">Информация за выбранный период</Text>
                </Stack>
                <Select
                    data={DATE_OPTIONS}
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    w={220}
                    radius="md"
                />
            </Group>

            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
                <StatCard title="Общее количество заказов" value={formatNumber(statistics.totalOrders)} />
                <StatCard title="Общая сумма заказов" value={formatCurrency(statistics.totalAmount)} />
                <StatCard title="Средний чек" value={formatCurrency(statistics.averageOrderAmount)} />
                <StatCard title="Повторные заказы" value={`${formatNumber(statistics.repeatOrderRate)}%`} />
                <StatCard title="Уникальные клиенты" value={formatNumber(statistics.uniqueCustomersCount)} />
                <StatCard title="Среднее кол-во товаров" value={formatNumber(statistics.averageItemsPerOrder)} />

                {statistics.geoDistribution?.map((item, idx) => {
                    const cityName = cities.find((c) => c.id === item.cityId)?.name || `Город ID ${item.cityId}`;
                    return (
                        <Card key={idx} radius="xl" shadow="sm" p="lg" ta="center" withBorder>
                            <Text size="sm" c="dimmed" mb="xs">Город: {cityName}</Text>
                            <Text fw={700}>Заказы: {item.orderCount}</Text>
                            <Text size="sm" c="dimmed">Выручка: {formatCurrency(item.totalRevenue)}</Text>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
};

export default StatisticsPage;
