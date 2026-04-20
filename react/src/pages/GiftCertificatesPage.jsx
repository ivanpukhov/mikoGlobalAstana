import { useEffect, useState } from 'react';
import {
    ActionIcon,
    Button,
    Group,
    Image,
    Loader,
    Modal,
    Stack,
    Table,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import api from '../api/api';

const GiftCertificatesPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);

    const form = useForm({
        initialValues: { name: '', imageUrl: '' },
        validate: {
            name: (v) => (v.trim() ? null : 'Введите название'),
            imageUrl: (v) => (v.trim() ? null : 'Введите URL изображения'),
        },
    });

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/gift-certificates');
            setCertificates(data);
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при загрузке сертификатов' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/gift-certificates/${id}`);
            notifications.show({ color: 'teal', message: 'Сертификат удалён' });
            fetchCertificates();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при удалении' });
        }
    };

    const handleAdd = async (values) => {
        try {
            await api.post('/gift-certificates', values);
            notifications.show({ color: 'teal', message: 'Сертификат добавлен' });
            setModalOpened(false);
            form.reset();
            fetchCertificates();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при добавлении' });
        }
    };

    useEffect(() => { fetchCertificates(); }, []);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Подарочные сертификаты</Title>
                <Button
                    color="miko"
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => { form.reset(); setModalOpened(true); }}
                >
                    Добавить сертификат
                </Button>
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <Table striped highlightOnHover withTableBorder radius="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Название</Table.Th>
                            <Table.Th>Изображение</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {certificates.map((cert) => (
                            <Table.Tr key={cert.id}>
                                <Table.Td>{cert.id}</Table.Td>
                                <Table.Td>{cert.name}</Table.Td>
                                <Table.Td>
                                    <Image src={cert.imageUrl} alt={cert.name} w={80} h={50} fit="cover" radius="sm" />
                                </Table.Td>
                                <Table.Td>
                                    <ActionIcon color="red" variant="light" radius="md" onClick={() => handleDelete(cert.id)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title="Добавить сертификат"
                centered
                radius="lg"
            >
                <form onSubmit={form.onSubmit(handleAdd)}>
                    <Stack gap="md">
                        <TextInput
                            label="Название"
                            placeholder="Сертификат на 5000 ₸"
                            {...form.getInputProps('name')}
                            radius="md"
                        />
                        <TextInput
                            label="URL изображения"
                            placeholder="https://..."
                            {...form.getInputProps('imageUrl')}
                            radius="md"
                        />
                        <Group justify="flex-end">
                            <Button variant="default" radius="md" onClick={() => setModalOpened(false)}>
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

export default GiftCertificatesPage;
