import { useEffect, useState } from 'react';
import {
    ActionIcon,
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
    Title,
    TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const PromocodesPage = () => {
    const [promocodes, setPromocodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);
    const [currentPromo, setCurrentPromo] = useState(null);

    const form = useForm({
        initialValues: {
            name: '',
            discountPercentage: null,
            discountAmount: null,
            usageLimit: null,
            expirationDate: null,
        },
        validate: {
            name: (v) => (v.trim() ? null : 'Введите название'),
        },
    });

    const fetchPromocodes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/promocodes');
            setPromocodes(data);
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка загрузки промокодов' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (name) => {
        modals.openConfirmModal({
            title: 'Удалить промокод?',
            children: <Text size="sm">Промокод «{name}» будет удалён навсегда.</Text>,
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/promocodes/${name}`);
                    notifications.show({ color: 'teal', message: 'Промокод удалён' });
                    fetchPromocodes();
                } catch {
                    notifications.show({ color: 'red', message: 'Ошибка при удалении' });
                }
            },
        });
    };

    const openEdit = (promo) => {
        setCurrentPromo(promo);
        form.setValues({
            name: promo.name,
            discountPercentage: promo.discountPercentage ?? null,
            discountAmount: promo.discountAmount ?? null,
            usageLimit: promo.usageLimit ?? null,
            expirationDate: promo.expirationDate ? new Date(promo.expirationDate) : null,
        });
        setModalOpened(true);
    };

    const openAdd = () => {
        setCurrentPromo(null);
        form.reset();
        setModalOpened(true);
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                ...values,
                expirationDate: values.expirationDate
                    ? new Date(values.expirationDate).toISOString()
                    : null,
            };
            if (currentPromo) {
                await api.put(`/promocodes/${currentPromo.name}`, payload);
                notifications.show({ color: 'teal', message: 'Промокод обновлён' });
            } else {
                await api.post('/promocodes', payload);
                notifications.show({ color: 'teal', message: 'Промокод добавлен' });
            }
            setModalOpened(false);
            fetchPromocodes();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка сохранения' });
        }
    };

    useEffect(() => { fetchPromocodes(); }, []);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Промокоды</Title>
                <Button color="miko" radius="md" leftSection={<IconPlus size={16} />} onClick={openAdd}>
                    Добавить промокод
                </Button>
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <>
                <Table striped highlightOnHover withTableBorder radius="md" visibleFrom="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Название</Table.Th>
                            <Table.Th>Скидка (%)</Table.Th>
                            <Table.Th>Сумма скидки</Table.Th>
                            <Table.Th>Лимит</Table.Th>
                            <Table.Th>Использовано</Table.Th>
                            <Table.Th>Срок действия</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {promocodes.map((p) => (
                            <Table.Tr key={p.id}>
                                <Table.Td><Badge color="miko" variant="light">{p.name}</Badge></Table.Td>
                                <Table.Td>{p.discountPercentage ?? '—'}</Table.Td>
                                <Table.Td>{p.discountAmount ? formatCurrency(p.discountAmount) : '—'}</Table.Td>
                                <Table.Td>{p.usageLimit ?? '∞'}</Table.Td>
                                <Table.Td>{p.usageCount ?? 0}</Table.Td>
                                <Table.Td>{p.expirationDate ? dayjs(p.expirationDate).format('YYYY-MM-DD') : '—'}</Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon variant="light" color="miko" radius="md" onClick={() => openEdit(p)}>
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                        <ActionIcon variant="light" color="red" radius="md" onClick={() => handleDelete(p.name)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                <Stack gap="sm" hiddenFrom="sm">
                    {promocodes.map((p) => (
                        <Card key={p.id} withBorder radius="xl" p="md">
                            <Stack gap="xs">
                                <Badge color="miko" variant="light" w="fit-content">{p.name}</Badge>
                                <Text size="sm">Скидка: {p.discountPercentage ?? '—'}%</Text>
                                <Text size="sm">Сумма скидки: {p.discountAmount ? formatCurrency(p.discountAmount) : '—'}</Text>
                                <Text size="sm">Лимит: {p.usageLimit ?? '∞'}</Text>
                                <Text size="sm">Использовано: {p.usageCount ?? 0}</Text>
                                <Text size="sm">Срок: {p.expirationDate ? dayjs(p.expirationDate).format('YYYY-MM-DD') : '—'}</Text>
                                <Group gap="xs">
                                    <ActionIcon variant="light" color="miko" radius="md" onClick={() => openEdit(p)}>
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="light" color="red" radius="md" onClick={() => handleDelete(p.name)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
                </>
            )}

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={currentPromo ? 'Редактировать промокод' : 'Добавить промокод'}
                centered
                radius="lg"
            >
                <form onSubmit={form.onSubmit(handleSave)}>
                    <Stack gap="md">
                        <TextInput
                            label="Название"
                            placeholder="SUMMER2025"
                            {...form.getInputProps('name')}
                            radius="md"
                            disabled={!!currentPromo}
                        />
                        <NumberInput
                            label="Скидка (%)"
                            min={0}
                            max={100}
                            placeholder="10"
                            {...form.getInputProps('discountPercentage')}
                            radius="md"
                        />
                        <NumberInput
                            label="Сумма скидки"
                            min={0}
                            step={100}
                            placeholder="500"
                            {...form.getInputProps('discountAmount')}
                            radius="md"
                        />
                        <NumberInput
                            label="Лимит использования"
                            min={1}
                            placeholder="100"
                            {...form.getInputProps('usageLimit')}
                            radius="md"
                        />
                        <DatePickerInput
                            label="Дата окончания"
                            placeholder="Выберите дату"
                            valueFormat="DD.MM.YYYY"
                            {...form.getInputProps('expirationDate')}
                            radius="md"
                        />
                        <Group justify="flex-end">
                            <Button variant="default" radius="md" onClick={() => setModalOpened(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" color="miko" radius="md">
                                Сохранить
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
};

export default PromocodesPage;
