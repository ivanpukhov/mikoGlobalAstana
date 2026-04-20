import { useState } from 'react';
import {
    Box,
    Button,
    Card,
    Center,
    PasswordInput,
    Stack,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: { phoneNumber: '', password: '' },
        validate: {
            phoneNumber: (v) =>
                /^\+?\d{10,15}$/.test(v.trim()) ? null : 'Введите корректный номер телефона',
            password: (v) => (v.trim() ? null : 'Введите пароль'),
        },
    });

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const { data } = await api.post('/users/login', values);
            const city = data.user.cityId === null ? 'all' : data.user.cityId.toString();

            localStorage.setItem('token', data.token);
            localStorage.setItem('adminName', data.user.name);
            localStorage.setItem('phoneNumber', data.user.phoneNumber);
            localStorage.setItem('adminCity', city);

            notifications.show({ color: 'teal', message: data.message || 'Успешный вход' });
            navigate(`/admin/statistics?city=${city}`);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Ошибка входа. Проверьте данные.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Center mih="100vh" style={{ background: 'var(--mantine-color-gray-0)' }}>
            <Card radius="xl" shadow="md" p="xl" w="100%" maw={400}>
                <Stack gap="lg">
                    <Title order={3} ta="center" fw={700}>Вход в админку</Title>
                    <form onSubmit={form.onSubmit(handleLogin)}>
                        <Stack gap="md">
                            <TextInput
                                label="Номер телефона"
                                placeholder="+77012345678"
                                {...form.getInputProps('phoneNumber')}
                                radius="md"
                            />
                            <PasswordInput
                                label="Пароль"
                                {...form.getInputProps('password')}
                                radius="md"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                color="miko"
                                radius="md"
                                loading={loading}
                                mt="sm"
                            >
                                Войти
                            </Button>
                        </Stack>
                    </form>
                </Stack>
            </Card>
        </Center>
    );
};

export default LoginPage;
