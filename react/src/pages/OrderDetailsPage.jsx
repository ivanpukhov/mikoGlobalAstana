import { useEffect, useRef, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Group,
    Image,
    Loader,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPrinter, IconTrash } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import logo from '../images/logo-admin.svg';
import { formatCurrency } from '../utils/formatters';

const statusColor = (s) => {
    if (s === 'выполнен') return 'teal';
    if (s === 'в обработке') return 'blue';
    if (s === 'отклонен') return 'red';
    return 'gray';
};

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const printRef = useRef();
    const navigate = useNavigate();

    const fetchOrderDetails = async () => {
        try {
            const { data } = await api.get(`/orders/${orderId}`);
            const updatedItems = await Promise.all(
                data.items.map(async (item) => {
                    const { data: productData } = await api.get(`/products/${item.productId}`);
                    const priceInfo = productData.prices.find((p) => p.cityId === data.cityId);
                    const productPrice = priceInfo?.price ?? 0;
                    const productDiscount = priceInfo?.discount ?? 0;
                    const productTotal = productPrice - productPrice * (productDiscount / 100);
                    return { ...item, productPrice, productDiscount, productTotal, productFull: productData };
                })
            );
            setOrder({ ...data, items: updatedItems });
        } catch (error) {
            console.error('Ошибка загрузки деталей заказа:', error);
        }
    };

    useEffect(() => { fetchOrderDetails(); }, [orderId]);

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/orders/${order.id}/status`, { status: newStatus });
            notifications.show({ color: 'teal', message: `Статус заказа обновлён: ${newStatus}` });
            fetchOrderDetails();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при изменении статуса' });
        }
    };

    const handleDelete = () => {
        modals.openConfirmModal({
            title: 'Удалить заказ?',
            children: <Text size="sm">Это действие нельзя отменить.</Text>,
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                setLoading(true);
                try {
                    await api.delete(`/orders/${orderId}`);
                    navigate(-1);
                } catch {
                    notifications.show({ color: 'red', message: 'Ошибка при удалении заказа' });
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(printContent.outerHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    if (!order) {
        return <Group justify="center" py="xl"><Loader color="miko" /></Group>;
    }

    const infoRows = [
        { label: 'Имя клиента', value: order.customerName },
        { label: 'Телефон', value: order.customerPhone },
        { label: 'Город', value: order.city?.name },
        { label: 'Адрес', value: order.customerAddress },
        { label: 'Метод оплаты', value: order.paymentMethod },
        { label: 'Метод доставки', value: order.deliveryMethod },
        { label: 'Общая сумма', value: formatCurrency(order.totalAmount) },
        { label: 'Дата создания', value: new Date(order.createdAt).toLocaleString('ru-RU') },
        ...(order.promoCode ? [{ label: 'Промокод', value: `${order.promoCode.name} (${order.promoCode.discountPercentage}% скидка)` }] : []),
        ...(order.giftCertificateCode ? [{ label: 'Сертификат', value: order.giftCertificateCode }] : []),
    ];

    return (
        <Stack gap="md">
            <Group>
                <Button
                    leftSection={<IconArrowLeft size={16} />}
                    variant="default"
                    radius="md"
                    onClick={() => navigate(-1)}
                >
                    Назад
                </Button>
                <Button
                    leftSection={<IconPrinter size={16} />}
                    color="miko"
                    radius="md"
                    onClick={handlePrint}
                >
                    Распечатать накладную
                </Button>
                <Button
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    variant="light"
                    radius="md"
                    loading={loading}
                    onClick={handleDelete}
                >
                    Удалить заказ
                </Button>
            </Group>

            {/* Status control */}
            <Group align="center" gap="sm">
                <Text fw={500}>Статус заказа:</Text>
                <Badge color={statusColor(order.status)} variant="light" size="lg">
                    {order.status || 'не установлен'}
                </Badge>
                <Select
                    value={order.status || undefined}
                    onChange={handleStatusChange}
                    placeholder="Выберите статус"
                    w={200}
                    radius="md"
                    size="sm"
                    data={[
                        { value: 'в обработке', label: 'В обработке' },
                        { value: 'выполнен', label: 'Выполнен' },
                        { value: 'отклонен', label: 'Отклонен' },
                    ]}
                />
            </Group>

            {/* Printable invoice */}
            <div
                ref={printRef}
                style={{ padding: 24, background: 'white', border: '1px solid #e5e5e5', borderRadius: 12 }}
            >
                <Stack align="center" mb="md">
                    <img src={logo} alt="Логотип" style={{ width: 150 }} />
                    <Title order={3} ta="center">Накладная на заказ #{order.id}</Title>
                </Stack>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mb="lg">
                    {infoRows.map(({ label, value }) => (
                        <Group key={label} gap="xs" wrap="nowrap">
                            <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>{label}:</Text>
                            <Text size="sm" fw={500}>{value}</Text>
                        </Group>
                    ))}
                </SimpleGrid>

                <Title order={4} mb="sm">Список товаров</Title>
                <Table withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>№</Table.Th>
                            <Table.Th>Название</Table.Th>
                            <Table.Th>Кол-во</Table.Th>
                            <Table.Th>Цена</Table.Th>
                            <Table.Th>Скидка</Table.Th>
                            <Table.Th>Цена/шт</Table.Th>
                            <Table.Th>Итого</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {order.items.map((item, idx) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>{idx + 1}</Table.Td>
                                <Table.Td>{item.product?.name}</Table.Td>
                                <Table.Td>{item.quantity}</Table.Td>
                                <Table.Td>{formatCurrency(item.productPrice)}</Table.Td>
                                <Table.Td>{item.productDiscount}%</Table.Td>
                                <Table.Td>{formatCurrency(item.productTotal)}</Table.Td>
                                <Table.Td>{formatCurrency(item.productTotal * item.quantity)}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                <Group justify="flex-end" mt="md">
                    <Text fw={700}>Итоговая сумма: {formatCurrency(order.totalAmount)}</Text>
                </Group>
            </div>
        </Stack>
    );
};

export default OrderDetailsPage;
