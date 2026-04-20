import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    Grid,
    Modal,
    NumberInput,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import api from '../api/api';

const GiftCertificatesShop = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            senderPhone: '',
            recipientPhone: '',
            amount: 10000,
            message: '',
        },
        validate: {
            senderPhone: (v) => (v.trim() ? null : 'Введите ваш номер телефона'),
            recipientPhone: (v) => (v.trim() ? null : 'Введите номер получателя'),
            amount: (v) => (v >= 1000 ? null : 'Минимальная сумма 1 000 ₸'),
            message: (v) => (v.trim() ? null : 'Введите сообщение'),
        },
    });

    useEffect(() => {
        setLoading(true);
        api.get('/gift-certificates')
            .then((res) => setCertificates(res.data))
            .catch(() => notifications.show({ color: 'red', message: 'Ошибка загрузки сертификатов' }))
            .finally(() => setLoading(false));
    }, []);

    const handleGift = (cert) => {
        setSelectedCertificate(cert);
        form.setValues({ senderPhone: '', recipientPhone: '', amount: 10000, message: '' });
        setModalVisible(true);
    };

    const handleSend = async (values) => {
        if (!selectedCertificate) return;
        setSubmitting(true);
        try {
            await api.post('/purchased-certificates', {
                giftCertificateId: selectedCertificate.id,
                ...values,
            });
            notifications.show({ color: 'teal', message: 'Сертификат успешно отправлен!' });
            setModalVisible(false);
            form.reset();
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка при отправке подарка' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box mt="xl" pb="xl">
            <Title order={2} fw={700} mb="xl">Подарочные сертификаты</Title>

            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
                {certificates.map((cert) => (
                    <Card key={cert.id} radius="lg" p={0} shadow="sm" style={{ overflow: 'hidden' }}>
                        <Card.Section>
                            <img
                                src={cert.imageUrl}
                                alt={cert.name}
                                style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                            />
                        </Card.Section>
                        <Stack p="md" gap="sm">
                            <Text fw={700} ta="center">{cert.name}</Text>
                            <Button
                                fullWidth
                                color="miko"
                                radius="md"
                                onClick={() => handleGift(cert)}
                            >
                                🎁 Подарить
                            </Button>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            <Modal
                opened={modalVisible}
                onClose={() => setModalVisible(false)}
                title="🎁 Отправить сертификат"
                size="sm"
            >
                <form onSubmit={form.onSubmit(handleSend)}>
                    <Stack gap="md">
                        <TextInput
                            label="Ваш телефон"
                            placeholder="+77005553311"
                            {...form.getInputProps('senderPhone')}
                            radius="md"
                        />
                        <TextInput
                            label="Телефон получателя"
                            placeholder="+77001234567"
                            {...form.getInputProps('recipientPhone')}
                            radius="md"
                        />
                        <NumberInput
                            label="Сумма"
                            min={1000}
                            max={100000}
                            step={1000}
                            {...form.getInputProps('amount')}
                            radius="md"
                        />
                        <Textarea
                            label="Сообщение"
                            placeholder="Поздравляю тебя с праздником!"
                            minRows={3}
                            {...form.getInputProps('message')}
                            radius="md"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            color="miko"
                            radius="xl"
                            loading={submitting}
                        >
                            ✨ Отправить сертификат
                        </Button>
                    </Stack>
                </form>
            </Modal>
        </Box>
    );
};

export default GiftCertificatesShop;
