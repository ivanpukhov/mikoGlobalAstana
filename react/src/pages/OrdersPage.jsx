import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Group,
    Loader,
    Select,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const STATUS_BUTTONS = [
    { label: 'Все', value: 'all' },
    { label: 'Новый', value: null },
    { label: 'В обработке', value: 'в обработке' },
    { label: 'Выполнен', value: 'выполнен' },
    { label: 'Отклонён', value: 'отклонен' },
];

const PERIOD_BUTTONS = [
    { label: 'Сегодня', value: 'today' },
    { label: 'Вчера', value: 'yesterday' },
    { label: 'Неделя', value: 'week' },
    { label: 'Месяц', value: 'month' },
    { label: 'Все', value: 'all' },
];

const statusColor = (s) => {
    if (s === 'выполнен') return 'teal';
    if (s === 'в обработке') return 'blue';
    if (s === 'отклонен') return 'red';
    return 'gray';
};

const OrdersPage = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [status, setStatus] = useState('all');
    const [period, setPeriod] = useState('today');
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        api.get('/orders')
            .then(({ data }) => setAllOrders(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const orders = useMemo(() => {
        let filtered = [...allOrders];

        if (deliveryMethod) filtered = filtered.filter((o) => o.deliveryMethod === deliveryMethod);
        if (paymentMethod) filtered = filtered.filter((o) => o.paymentMethod === paymentMethod);

        if (status !== 'all') {
            filtered = status === null
                ? filtered.filter((o) => !o.status)
                : filtered.filter((o) => o.status === status);
        }

        if (period !== 'all') {
            const today = dayjs().startOf('day');
            const ranges = {
                today: [today, today.endOf('day')],
                yesterday: [today.subtract(1, 'day'), today.subtract(1, 'day').endOf('day')],
                week: [today.subtract(6, 'days'), today.endOf('day')],
                month: [today.subtract(29, 'days'), today.endOf('day')],
            };
            const [start, end] = ranges[period];
            filtered = filtered.filter((o) => {
                const created = dayjs(o.createdAt);
                return (created.isAfter(start) || created.isSame(start)) &&
                    (created.isBefore(end) || created.isSame(end));
            });
        }

        return filtered;
    }, [allOrders, deliveryMethod, paymentMethod, status, period]);

    return (
        <Stack gap="md">
            <Title order={3} fw={700}>Заказы</Title>

            {/* Status filter */}
            <Stack gap="xs">
                <Text size="sm" fw={600} c="dimmed">Статус</Text>
                <Group gap="xs" wrap="wrap">
                    {STATUS_BUTTONS.map((btn) => (
                        <Button
                            key={btn.label}
                            size="xs"
                            radius="md"
                            variant={status === btn.value || (btn.value === null && status === null) ? 'filled' : 'default'}
                            color="miko"
                            onClick={() => setStatus(btn.value)}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </Group>
            </Stack>

            {/* Period filter */}
            <Stack gap="xs">
                <Text size="sm" fw={600} c="dimmed">Период</Text>
                <Group gap="xs" wrap="wrap">
                    {PERIOD_BUTTONS.map((btn) => (
                        <Button
                            key={btn.value}
                            size="xs"
                            radius="md"
                            variant={period === btn.value ? 'filled' : 'default'}
                            color="miko"
                            onClick={() => setPeriod(btn.value)}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </Group>
            </Stack>

            {/* Select filters */}
            <Group gap="sm" wrap="wrap">
                <Select
                    placeholder="Способ доставки"
                    value={deliveryMethod}
                    onChange={setDeliveryMethod}
                    clearable
                    data={[
                        { value: 'delivery', label: 'Доставка' },
                        { value: 'pickup', label: 'Самовывоз' },
                    ]}
                    w={200}
                    radius="md"
                    size="sm"
                />
                <Select
                    placeholder="Способ оплаты"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    clearable
                    data={[
                        { value: 'card', label: 'Карта' },
                        { value: 'cash', label: 'Наличные' },
                    ]}
                    w={200}
                    radius="md"
                    size="sm"
                />
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <>
                <Table striped highlightOnHover withTableBorder radius="md" style={{ overflowX: 'auto' }} visibleFrom="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Клиент</Table.Th>
                            <Table.Th>Телефон</Table.Th>
                            <Table.Th>Город</Table.Th>
                            <Table.Th>Сумма</Table.Th>
                            <Table.Th>Дата</Table.Th>
                            <Table.Th>Статус</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {orders.map((order) => (
                            <Table.Tr
                                key={order.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                                <Table.Td fw={600}>{order.customerName || 'Не указано'}</Table.Td>
                                <Table.Td>{order.customerPhone}</Table.Td>
                                <Table.Td>{order.city?.name || '—'}</Table.Td>
                                <Table.Td>{formatCurrency(order.totalAmount)}</Table.Td>
                                <Table.Td>{dayjs(order.createdAt).format('DD.MM.YYYY')}</Table.Td>
                                <Table.Td>
                                    <Badge color={statusColor(order.status)} variant="light" size="sm">
                                        {order.status || 'Новый'}
                                    </Badge>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                <Stack gap="sm" hiddenFrom="sm">
                    {orders.map((order) => (
                        <Card
                            key={order.id}
                            withBorder
                            radius="xl"
                            p="md"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Stack gap="xs">
                                <Text fw={700}>{order.customerName || 'Не указано'}</Text>
                                <Text size="sm">{order.customerPhone}</Text>
                                <Text size="sm" c="dimmed">{order.city?.name || '—'}</Text>
                                <Text size="sm">{formatCurrency(order.totalAmount)}</Text>
                                <Text size="sm" c="dimmed">{dayjs(order.createdAt).format('DD.MM.YYYY')}</Text>
                                <Badge color={statusColor(order.status)} variant="light" w="fit-content" size="sm">
                                    {order.status || 'Новый'}
                                </Badge>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
                </>
            )}
        </Stack>
    );
};

export default OrdersPage;
