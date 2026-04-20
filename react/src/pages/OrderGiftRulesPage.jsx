import { useEffect, useMemo, useState } from 'react';
import {
    ActionIcon,
    Button,
    Card,
    Group,
    Loader,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const INITIAL_FORM = {
    id: null,
    productId: null,
    minAmount: 0,
    maxAmount: null,
    sortOrder: 0,
};

const OrderGiftRulesPage = () => {
    const [rules, setRules] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);

    const loadData = async () => {
        setLoading(true);
        try {
            const [{ data: rulesData }, { data: productsData }] = await Promise.all([
                api.get('/order-gift-rules'),
                api.get('/products'),
            ]);

            setRules(Array.isArray(rulesData) ? rulesData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось загрузить правила подарков.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const productOptions = useMemo(
        () => products.map((product) => ({ value: String(product.id), label: product.name })),
        [products]
    );

    const openCreate = () => {
        setForm({ ...INITIAL_FORM, sortOrder: rules.length + 1 });
        setModalOpened(true);
    };

    const openEdit = (rule) => {
        setForm({
            id: rule.id,
            productId: String(rule.productId),
            minAmount: Number(rule.minAmount || 0),
            maxAmount: rule.maxAmount ?? null,
            sortOrder: Number(rule.sortOrder || 0),
        });
        setModalOpened(true);
    };

    const saveRule = async () => {
        try {
            const payload = { ...form, productId: Number(form.productId) };

            if (form.id) {
                await api.put(`/order-gift-rules/${form.id}`, payload);
                notifications.show({ color: 'teal', message: 'Правило обновлено.' });
            } else {
                await api.post('/order-gift-rules', payload);
                notifications.show({ color: 'teal', message: 'Правило добавлено.' });
            }

            setModalOpened(false);
            setForm(INITIAL_FORM);
            loadData();
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Ошибка сохранения правила.' });
        }
    };

    const removeRule = async (id) => {
        try {
            await api.delete(`/order-gift-rules/${id}`);
            notifications.show({ color: 'teal', message: 'Правило удалено.' });
            loadData();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка удаления правила.' });
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Подарки к заказу</Title>
                <Button color="miko" radius="md" leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Добавить правило
                </Button>
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <>
                    <Table striped highlightOnHover withTableBorder radius="md" visibleFrom="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>От суммы</Table.Th>
                                <Table.Th>До суммы</Table.Th>
                                <Table.Th>Подарок</Table.Th>
                                <Table.Th>Порядок</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rules.map((rule) => (
                                <Table.Tr key={rule.id}>
                                    <Table.Td>{formatCurrency(rule.minAmount)}</Table.Td>
                                    <Table.Td>{rule.maxAmount === null ? 'Без верхней границы' : formatCurrency(rule.maxAmount)}</Table.Td>
                                    <Table.Td>{rule.product?.name || '—'}</Table.Td>
                                    <Table.Td>{rule.sortOrder}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="miko" radius="md" onClick={() => openEdit(rule)}>
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" radius="md" onClick={() => removeRule(rule.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Stack gap="sm" hiddenFrom="sm">
                        {rules.map((rule) => (
                            <Card key={rule.id} withBorder radius="xl" p="md">
                                <Stack gap="xs">
                                    <Text fw={700}>{rule.product?.name || 'Подарок'}</Text>
                                    <Text size="sm" c="dimmed">
                                        От {formatCurrency(rule.minAmount)}
                                        {rule.maxAmount === null ? '' : ` до ${formatCurrency(rule.maxAmount)}`}
                                    </Text>
                                    <Text size="sm" c="dimmed">Порядок: {rule.sortOrder}</Text>
                                    <Group gap="xs">
                                        <Button size="xs" radius="md" color="miko" variant="light" onClick={() => openEdit(rule)}>
                                            Изменить
                                        </Button>
                                        <Button size="xs" radius="md" color="red" variant="light" onClick={() => removeRule(rule.id)}>
                                            Удалить
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                </>
            )}

            <Modal
                opened={modalOpened}
                onClose={() => {
                    setModalOpened(false);
                    setForm(INITIAL_FORM);
                }}
                title={form.id ? 'Изменить правило подарка' : 'Добавить правило подарка'}
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <Select
                        searchable
                        label="Товар-подарок"
                        data={productOptions}
                        value={form.productId}
                        onChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}
                        radius="md"
                    />
                    <NumberInput
                        label="Минимальная сумма заказа"
                        min={0}
                        step={100}
                        value={form.minAmount}
                        onChange={(value) => setForm((prev) => ({ ...prev, minAmount: Number(value) || 0 }))}
                        radius="md"
                    />
                    <NumberInput
                        label="Максимальная сумма заказа"
                        min={0}
                        step={100}
                        value={form.maxAmount}
                        onChange={(value) => setForm((prev) => ({ ...prev, maxAmount: value === '' ? null : value }))}
                        radius="md"
                        description="Оставьте пустым, если верхней границы нет"
                    />
                    <NumberInput
                        label="Порядок"
                        min={0}
                        value={form.sortOrder}
                        onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: Number(value) || 0 }))}
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setModalOpened(false)}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={saveRule}>Сохранить</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default OrderGiftRulesPage;
