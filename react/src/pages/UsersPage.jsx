import { useEffect, useState } from 'react';
import {
    ActionIcon,
    Button,
    Card,
    Group,
    Loader,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось загрузить список пользователей.' });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        modals.openConfirmModal({
            title: 'Удалить пользователя?',
            children: <Text size="sm">Это действие нельзя отменить.</Text>,
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    setUsers((prev) => prev.filter((u) => u.id !== id));
                    notifications.show({ color: 'teal', message: 'Пользователь успешно удалён.' });
                } catch {
                    notifications.show({ color: 'red', message: 'Не удалось удалить пользователя.' });
                }
            },
        });
    };

    useEffect(() => { fetchUsers(); }, []);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Пользователи</Title>
                <Button
                    color="miko"
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('/admin/users/create')}
                >
                    Добавить пользователя
                </Button>
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <>
                <Table striped highlightOnHover withTableBorder radius="md" visibleFrom="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Имя</Table.Th>
                            <Table.Th>Телефон</Table.Th>
                            <Table.Th>Город</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {users.map((user) => (
                            <Table.Tr key={user.id}>
                                <Table.Td>{user.name}</Table.Td>
                                <Table.Td>{user.phoneNumber}</Table.Td>
                                <Table.Td>{user.city?.name || '—'}</Table.Td>
                                <Table.Td>
                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        radius="md"
                                        onClick={() => confirmDelete(user.id)}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                <Stack gap="sm" hiddenFrom="sm">
                    {users.map((user) => (
                        <Card key={user.id} withBorder radius="xl" p="md">
                            <Group justify="space-between" align="flex-start">
                                <Stack gap={2}>
                                    <Text fw={700}>{user.name}</Text>
                                    <Text size="sm" c="dimmed">{user.phoneNumber}</Text>
                                    <Text size="sm" c="dimmed">{user.city?.name || '—'}</Text>
                                </Stack>
                                <ActionIcon
                                    color="red"
                                    variant="light"
                                    radius="md"
                                    onClick={() => confirmDelete(user.id)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>
                        </Card>
                    ))}
                </Stack>
                </>
            )}
        </Stack>
    );
};

export default UsersPage;
