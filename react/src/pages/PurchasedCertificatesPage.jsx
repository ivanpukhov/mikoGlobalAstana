import { useEffect, useState } from 'react';
import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Loader,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const statusColor = (status) => {
    if (status === 'активирован') return 'teal';
    if (status === 'ожидает оплаты') return 'orange';
    return 'gray';
};

const PurchasedCertificatesPage = () => {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchased-certificates');
            setCerts(data);
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка загрузки заказов на сертификаты' });
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async (id) => {
        try {
            await api.put(`/purchased-certificates/${id}/confirm-payment`);
            notifications.show({ color: 'teal', message: 'Оплата подтверждена, сертификат ожидает активации' });
            fetch();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при подтверждении оплаты' });
        }
    };

    const markAsUsed = async (id) => {
        try {
            await api.put(`/purchased-certificates/${id}/mark-used`);
            notifications.show({ color: 'teal', message: 'Сертификат отмечен как использованный' });
            fetch();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при обновлении статуса' });
        }
    };

    const confirmDelete = (id) => {
        modals.openConfirmModal({
            title: 'Удалить заказ?',
            children: <Text size="sm">Вы уверены, что хотите удалить этот заказ на сертификат?</Text>,
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/purchased-certificates/${id}`);
                    notifications.show({ color: 'teal', message: 'Заказ на сертификат удалён' });
                    fetch();
                } catch {
                    notifications.show({ color: 'red', message: 'Ошибка при удалении' });
                }
            },
        });
    };

    useEffect(() => { fetch(); }, []);

    return (
        <Stack gap="md">
            <Title order={3} fw={700}>📜 Купленные сертификаты</Title>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <Table striped highlightOnHover withTableBorder radius="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Отправитель</Table.Th>
                            <Table.Th>Получатель</Table.Th>
                            <Table.Th>Сумма</Table.Th>
                            <Table.Th>Сообщение</Table.Th>
                            <Table.Th>Код</Table.Th>
                            <Table.Th>Статус</Table.Th>
                            <Table.Th>Действия</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {certs.map((c) => (
                            <Table.Tr key={c.id}>
                                <Table.Td>{c.id}</Table.Td>
                                <Table.Td>{c.senderPhone}</Table.Td>
                                <Table.Td>{c.recipientPhone}</Table.Td>
                                <Table.Td>{formatCurrency(c.amount, 'KZT')}</Table.Td>
                                <Table.Td>{c.message}</Table.Td>
                                <Table.Td>{c.code}</Table.Td>
                                <Table.Td>
                                    <Badge color={statusColor(c.status)} variant="light">
                                        {c.status?.toUpperCase()}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {c.status === 'ожидает оплаты' && (
                                            <Button
                                                size="xs"
                                                color="miko"
                                                radius="md"
                                                variant="light"
                                                onClick={() => confirmPayment(c.id)}
                                            >
                                                Подтвердить оплату
                                            </Button>
                                        )}
                                        {c.status === 'активирован' && (
                                            <Button
                                                size="xs"
                                                radius="md"
                                                variant="default"
                                                onClick={() => markAsUsed(c.id)}
                                            >
                                                Отметить использованным
                                            </Button>
                                        )}
                                        <ActionIcon color="red" variant="light" radius="md" onClick={() => confirmDelete(c.id)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
};

export default PurchasedCertificatesPage;
