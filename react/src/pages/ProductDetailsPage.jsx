import { useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Group,
    Loader,
    Modal,
    NumberInput,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCityActions, setLoadingCityActions] = useState({});
    const [priceModal, setPriceModal] = useState({ open: false, cityId: null, value: '' });
    const [discountModal, setDiscountModal] = useState({ open: false, cityId: null, value: '' });

    const fetchProductDetails = async () => {
        try {
            const { data } = await api.get(`/products/${id}`);
            setProduct({ ...data, imageUrl: `/api${data.image}` });
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка загрузки товара' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
        api.get('/cities').then(({ data }) => setCities(data)).catch(console.error);
    }, [id]);

    const getCityName = (cityId) => cities.find((c) => c.id === cityId)?.name || 'Неизвестный город';

    const handleDelete = () => {
        modals.openConfirmModal({
            title: 'Удалить товар?',
            children: <Text size="sm">Это действие нельзя отменить.</Text>,
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/products/${id}`);
                    notifications.show({ color: 'teal', message: 'Товар удалён!' });
                    navigate(-1);
                } catch {
                    notifications.show({ color: 'red', message: 'Не удалось удалить товар.' });
                }
            },
        });
    };

    const handleToggleAvailability = async (cityId, availability) => {
        setLoadingCityActions((prev) => ({ ...prev, [cityId]: true }));
        try {
            await api.patch(`/products/${cityId}/products/${id}/availability`, { availability });
            notifications.show({ color: 'teal', message: availability ? 'Товар доступен' : 'Товар снят с продажи' });
            fetchProductDetails();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка обновления доступности' });
        } finally {
            setLoadingCityActions((prev) => ({ ...prev, [cityId]: false }));
        }
    };

    const handlePriceUpdate = async () => {
        if (!priceModal.value || priceModal.value <= 0) {
            notifications.show({ color: 'red', message: 'Введите корректную цену.' });
            return;
        }
        try {
            await api.patch(`/products/${priceModal.cityId}/products/${id}/price`, { price: priceModal.value });
            notifications.show({ color: 'teal', message: 'Цена обновлена!' });
            fetchProductDetails();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка обновления цены.' });
        } finally {
            setPriceModal({ open: false, cityId: null, value: '' });
        }
    };

    const handleDiscountUpdate = async () => {
        if (discountModal.value < 0) {
            notifications.show({ color: 'red', message: 'Введите корректную скидку.' });
            return;
        }
        try {
            await api.patch(`/products/${discountModal.cityId}/products/${id}/discount`, { discount: discountModal.value });
            notifications.show({ color: 'teal', message: 'Скидка обновлена!' });
            fetchProductDetails();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка обновления скидки.' });
        } finally {
            setDiscountModal({ open: false, cityId: null, value: '' });
        }
    };

    if (loading) {
        return <Group justify="center" py="xl"><Loader size="lg" color="miko" /></Group>;
    }

    return (
        <Stack gap="md" maw={900} mx="auto">
            <Group>
                <Button
                    leftSection={<IconArrowLeft size={16} />}
                    variant="default"
                    radius="md"
                    onClick={() => navigate(-1)}
                >
                    Назад
                </Button>
            </Group>

            <Card radius="xl" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                />
                <Stack p="xl" gap="md">
                    <Title order={3} ta="center">{product.name}</Title>
                    <div
                        dangerouslySetInnerHTML={{ __html: product.description }}
                        style={{ color: 'var(--mantine-color-dimmed)' }}
                    />

                    <Title order={4}>Цены и доступность</Title>
                    <Table withTableBorder style={{ overflowX: 'auto' }}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Город</Table.Th>
                                <Table.Th>Цена (₸)</Table.Th>
                                <Table.Th>Скидка (%)</Table.Th>
                                <Table.Th>В наличии</Table.Th>
                                <Table.Th>Действие</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {product.prices.map((row) => (
                                <Table.Tr key={row.cityId}>
                                    <Table.Td>{getCityName(row.cityId)}</Table.Td>
                                    <Table.Td>{formatCurrency(row.price)}</Table.Td>
                                    <Table.Td>{row.discount}%</Table.Td>
                                    <Table.Td>
                                        <Badge color={row.availability ? 'teal' : 'red'} variant="light">
                                            {row.availability ? 'Да' : 'Нет'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap="xs">
                                            <Button
                                                size="xs"
                                                radius="md"
                                                color={row.availability ? 'red' : 'teal'}
                                                variant="light"
                                                loading={loadingCityActions[row.cityId]}
                                                onClick={() => handleToggleAvailability(row.cityId, !row.availability)}
                                            >
                                                {row.availability ? 'Снять с продажи' : 'Вернуть в продажу'}
                                            </Button>
                                            <Button
                                                size="xs"
                                                radius="md"
                                                variant="default"
                                                onClick={() => setPriceModal({ open: true, cityId: row.cityId, value: row.price })}
                                            >
                                                Изменить цену
                                            </Button>
                                            <Button
                                                size="xs"
                                                radius="md"
                                                variant="default"
                                                onClick={() => setDiscountModal({ open: true, cityId: row.cityId, value: row.discount })}
                                            >
                                                Изменить скидку
                                            </Button>
                                        </Stack>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Group justify="space-between" mt="sm">
                        <Button
                            leftSection={<IconEdit size={16} />}
                            color="miko"
                            radius="md"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        >
                            Изменить
                        </Button>
                        <Button
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            variant="light"
                            radius="md"
                            onClick={handleDelete}
                        >
                            Удалить
                        </Button>
                    </Group>
                </Stack>
            </Card>

            {/* Price modal */}
            <Modal
                opened={priceModal.open}
                onClose={() => setPriceModal({ open: false, cityId: null, value: '' })}
                title="Изменение цены"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <NumberInput
                        min={0}
                        step={100}
                        value={priceModal.value}
                        onChange={(v) => setPriceModal((prev) => ({ ...prev, value: v }))}
                        label="Новая цена"
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setPriceModal({ open: false, cityId: null, value: '' })}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={handlePriceUpdate}>Сохранить</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Discount modal */}
            <Modal
                opened={discountModal.open}
                onClose={() => setDiscountModal({ open: false, cityId: null, value: '' })}
                title="Изменение скидки"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <NumberInput
                        min={0}
                        max={100}
                        value={discountModal.value}
                        onChange={(v) => setDiscountModal((prev) => ({ ...prev, value: v }))}
                        label="Процент скидки"
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setDiscountModal({ open: false, cityId: null, value: '' })}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={handleDiscountUpdate}>Сохранить</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default ProductDetailsPage;
