import { useEffect, useState } from 'react';
import {
    Badge,
    Card,
    Group,
    Loader,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import api from '../api/api';
import { getSourceColor, getSourceLabel } from '../utils/attribution';
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

const formatNumber = (value, digits = 0) =>
    value != null
        ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)
        : '—';

const formatPercent = (value) => `${formatNumber(value || 0, 1)}%`;

const StatCard = ({ title, value, tone = 'miko' }) => (
    <Card radius="lg" shadow="sm" p="lg" ta="center" withBorder>
        <Text size="sm" c="dimmed" mb="xs">{title}</Text>
        <Text size="xl" fw={800} c={tone}>{value}</Text>
    </Card>
);

const StatisticsPage = () => {
    const [statistics, setStatistics] = useState(null);
    const [analytics, setAnalytics] = useState(null);
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
        const params = {
            startDate: dateRange[0].format('YYYY-MM-DDTHH:mm:ss'),
            endDate: dateRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        };

        Promise.all([
            api.get('/orders/statistics', { params }),
            api.get('/analytics/summary', { params }),
        ])
            .then(([ordersRes, analyticsRes]) => {
                setStatistics(ordersRes.data);
                setAnalytics(analyticsRes.data);
                setError('');
            })
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
        <Stack gap="lg" maw={1280} mx="auto">
            <Group justify="space-between" align="flex-end">
                <Stack gap={2}>
                    <Title order={3} fw={700}>Статистика</Title>
                    <Text c="dimmed" size="sm">Заказы, источники клиентов и действия на сайте</Text>
                </Stack>
                <Select
                    data={DATE_OPTIONS}
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    w={240}
                    radius="md"
                />
            </Group>

            <Tabs defaultValue="orders" color="miko">
                <Tabs.List>
                    <Tabs.Tab value="orders">Заказы</Tabs.Tab>
                    <Tabs.Tab value="traffic">Трафик и UTM</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="orders" pt="lg">
                    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
                        <StatCard title="Общее количество заказов" value={formatNumber(statistics.totalOrders)} />
                        <StatCard title="Общая сумма заказов" value={formatCurrency(statistics.totalAmount)} />
                        <StatCard title="Средний чек" value={formatCurrency(statistics.averageOrderAmount)} />
                        <StatCard title="Повторные заказы" value={formatPercent(statistics.repeatOrderRate)} />
                        <StatCard title="Уникальные клиенты" value={formatNumber(statistics.uniqueCustomersCount)} />
                        <StatCard title="Среднее кол-во товаров" value={formatNumber(statistics.averageItemsPerOrder, 1)} />

                        {statistics.geoDistribution?.map((item, idx) => {
                            const cityName = cities.find((c) => c.id === item.cityId)?.name || `Город ID ${item.cityId}`;
                            return (
                                <Card key={idx} radius="lg" shadow="sm" p="lg" ta="center" withBorder>
                                    <Text size="sm" c="dimmed" mb="xs">Город: {cityName}</Text>
                                    <Text fw={700}>Заказы: {item.orderCount}</Text>
                                    <Text size="sm" c="dimmed">Выручка: {formatCurrency(item.totalRevenue)}</Text>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="traffic" pt="lg">
                    <Stack gap="lg">
                        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="md">
                            <StatCard title="Сессии" value={formatNumber(analytics?.totals?.sessions)} />
                            <StatCard title="Просмотры страниц" value={formatNumber(analytics?.totals?.pageViews)} />
                            <StatCard title="События" value={formatNumber(analytics?.totals?.events)} />
                            <StatCard title="Заказы из Google Ads" value={formatNumber(analytics?.totals?.googleAdsOrders)} tone="green" />
                            <StatCard title="Выручка Google Ads" value={formatCurrency(analytics?.totals?.googleAdsRevenue)} tone="green" />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <Card withBorder radius="lg" p="md">
                                <Title order={5} mb="sm">Источники</Title>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Источник</Table.Th>
                                            <Table.Th>Сессии</Table.Th>
                                            <Table.Th>Заказы</Table.Th>
                                            <Table.Th>Выручка</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {(analytics?.sources || []).map((row) => (
                                            <Table.Tr key={row.source}>
                                                <Table.Td>
                                                    <Badge color={getSourceColor(row.source)} variant="light">
                                                        {getSourceLabel(row.source)}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>{formatNumber(row.sessions)}</Table.Td>
                                                <Table.Td>{formatNumber(row.orders)}</Table.Td>
                                                <Table.Td>{formatCurrency(row.revenue)}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>

                            <Card withBorder radius="lg" p="md">
                                <Title order={5} mb="sm">Кампании</Title>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Источник</Table.Th>
                                            <Table.Th>Кампания</Table.Th>
                                            <Table.Th>Заказы</Table.Th>
                                            <Table.Th>Выручка</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {(analytics?.campaigns || []).map((row) => (
                                            <Table.Tr key={`${row.source}-${row.attributionCampaign}`}>
                                                <Table.Td>{getSourceLabel(row.source)}</Table.Td>
                                                <Table.Td>{row.attributionCampaign}</Table.Td>
                                                <Table.Td>{formatNumber(row.orders)}</Table.Td>
                                                <Table.Td>{formatCurrency(row.revenue)}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <Card withBorder radius="lg" p="md">
                                <Title order={5} mb="sm">Популярные страницы</Title>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Страница</Table.Th>
                                            <Table.Th>Просмотры</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {(analytics?.topPages || []).map((row) => (
                                            <Table.Tr key={row.path}>
                                                <Table.Td style={{ wordBreak: 'break-word' }}>{row.path}</Table.Td>
                                                <Table.Td>{formatNumber(row.views)}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>

                            <Card withBorder radius="lg" p="md">
                                <Title order={5} mb="sm">Последние сессии</Title>
                                <Stack gap="sm">
                                    {(analytics?.recentSessions || []).map((session) => (
                                        <div
                                            key={session.sessionId}
                                            style={{
                                                padding: 12,
                                                borderRadius: 8,
                                                border: '1px solid var(--mantine-color-gray-2)',
                                                background: 'var(--mantine-color-gray-0)',
                                            }}
                                        >
                                            <Group justify="space-between" gap="xs">
                                                <Badge color={getSourceColor(session.source)} variant="light">
                                                    {getSourceLabel(session.source)}
                                                </Badge>
                                                <Text size="xs" c="dimmed">
                                                    {dayjs(session.lastSeenAt).format('DD.MM HH:mm')}
                                                </Text>
                                            </Group>
                                            <Text size="sm" mt={6} lineClamp={1}>{session.landingPage || '/'}</Text>
                                            <Text size="xs" c="dimmed">
                                                Событий: {session.events?.length || 0}
                                                {session.orders?.length ? ` · заказов: ${session.orders.length}` : ''}
                                            </Text>
                                        </div>
                                    ))}
                                </Stack>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
};

export default StatisticsPage;
