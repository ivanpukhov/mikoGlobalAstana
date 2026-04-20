import { useEffect, useState } from 'react';
import {
    Button,
    Card,
    Group,
    Modal,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import api from '../api/api';

const CitiesPage = () => {
    const [cities, setCities] = useState([]);
    const [opened, setOpened] = useState(false);

    const form = useForm({
        initialValues: { name: '' },
        validate: { name: (v) => (v.trim() ? null : 'Введите название города') },
    });

    const fetchCities = async () => {
        try {
            const { data } = await api.get('/cities');
            setCities(data);
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка загрузки городов' });
        }
    };

    const handleAdd = async (values) => {
        try {
            await api.post('/cities', values);
            fetchCities();
            setOpened(false);
            form.reset();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка добавления города' });
        }
    };

    useEffect(() => { fetchCities(); }, []);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Города</Title>
                <Button color="miko" radius="md" onClick={() => setOpened(true)}>
                    Добавить город
                </Button>
            </Group>

            <Table striped highlightOnHover withTableBorder radius="md" visibleFrom="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Название</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {cities.map((city) => (
                        <Table.Tr key={city.id}>
                            <Table.Td>{city.id}</Table.Td>
                            <Table.Td>{city.name}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Stack gap="sm" hiddenFrom="sm">
                {cities.map((city) => (
                    <Card key={city.id} withBorder radius="xl" p="md">
                        <Text fw={700}>{city.name}</Text>
                        <Text size="sm" c="dimmed">ID: {city.id}</Text>
                    </Card>
                ))}
            </Stack>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title="Добавить город"
                centered
                radius="lg"
            >
                <form onSubmit={form.onSubmit(handleAdd)}>
                    <Stack gap="md">
                        <TextInput
                            label="Название города"
                            placeholder="Астана"
                            {...form.getInputProps('name')}
                            radius="md"
                        />
                        <Group justify="flex-end">
                            <Button variant="default" radius="md" onClick={() => setOpened(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" color="miko" radius="md">
                                Добавить
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
};

export default CitiesPage;
