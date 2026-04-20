import { useEffect, useState } from 'react';
import {
    Button,
    Card,
    Select,
    Stack,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const UserCreatePage = () => {
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: { name: '', phoneNumber: '', cityId: '' },
        validate: {
            name: (v) => (v.trim() ? null : 'Введите имя пользователя.'),
            phoneNumber: (v) =>
                /^\+?\d{10,15}$/.test(v.trim()) ? null : 'Введите корректный номер телефона.',
            cityId: (v) => (v ? null : 'Выберите город.'),
        },
    });

    useEffect(() => {
        api.get('/cities')
            .then(({ data }) => setCities(data))
            .catch(() => notifications.show({ color: 'red', message: 'Не удалось загрузить список городов.' }));
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                cityId: values.cityId === 'all' ? null : values.cityId,
            };
            await api.post('/users/create', payload);
            notifications.show({ color: 'teal', message: 'Пользователь успешно добавлен.' });
            navigate('/admin/users');
        } catch (error) {
            notifications.show({
                color: 'red',
                message: error.response?.data?.message || 'Не удалось добавить пользователя.',
            });
        } finally {
            setLoading(false);
        }
    };

    const cityOptions = [
        { value: 'all', label: 'Все города' },
        ...cities.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    return (
        <Card radius="xl" shadow="sm" p="xl" maw={600} mx="auto">
            <Stack gap="lg">
                <Title order={3} fw={700}>Добавить нового пользователя</Title>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            label="Имя"
                            placeholder="Иван"
                            {...form.getInputProps('name')}
                            radius="md"
                        />
                        <TextInput
                            label="Номер телефона"
                            placeholder="+77012345678"
                            {...form.getInputProps('phoneNumber')}
                            radius="md"
                        />
                        <Select
                            label="Город"
                            placeholder="Выберите город"
                            data={cityOptions}
                            {...form.getInputProps('cityId')}
                            radius="md"
                        />
                        <Button type="submit" color="miko" radius="md" loading={loading}>
                            Добавить
                        </Button>
                    </Stack>
                </form>
            </Stack>
        </Card>
    );
};

export default UserCreatePage;
