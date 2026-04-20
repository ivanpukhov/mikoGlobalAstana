import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    Center,
    Loader,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import Swal from 'sweetalert2';
import api from '../../api/api';
import { formatCurrency } from '../../utils/formatters';

export const GiftValidate = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () =>
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);

        api.get(`/purchased-certificates/validate/${id}`)
            .then((res) => setCertificate(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Ошибка при проверке сертификата.'))
            .finally(() => setLoading(false));

        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    const handleActivate = () => {
        if (certificate?.valid) {
            localStorage.setItem('gift', id);
            Swal.fire({
                title: 'Сертификат активирован!',
                text: 'Приятного использования 🎉',
                icon: 'success',
                confirmButtonText: 'Перейти',
                showCancelButton: true,
                cancelButtonText: 'Закрыть',
                confirmButtonColor: '#0CE3CB',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/';
                }
            });
        }
    };

    return (
        <Center
            mih="100vh"
            style={{
                background: 'linear-gradient(135deg, #e6fffa 0%, #f0f9ff 100%)',
            }}
        >
            {loading ? (
                <Stack align="center" gap="md">
                    <Loader size="xl" color="miko" />
                    <Text c="dimmed">Проверяем сертификат…</Text>
                </Stack>
            ) : error ? (
                <Card radius="xl" shadow="md" p="xl" maw={420} ta="center">
                    <Stack align="center" gap="md">
                        <IconAlertCircle size={60} color="var(--mantine-color-red-6)" />
                        <Title order={3} c="red">Ошибка</Title>
                        <Text c="dimmed">{error}</Text>
                    </Stack>
                </Card>
            ) : (
                <>
                    {certificate?.valid && (
                        <Confetti
                            width={windowSize.width}
                            height={windowSize.height}
                            recycle={false}
                            numberOfPieces={300}
                        />
                    )}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card radius="xl" shadow="lg" p="xl" maw={480} ta="center">
                            <Stack align="center" gap="md">
                                {certificate?.giftCertificate?.imageUrl && (
                                    <Box
                                        component="img"
                                        src={certificate.giftCertificate.imageUrl}
                                        style={{
                                            maxWidth: 320,
                                            width: '100%',
                                            borderRadius: 12,
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}
                                <Title order={3} fw={800}>{certificate?.giftCertificate?.name}</Title>
                                <Text size="lg" c="dimmed">🎁 Вам подарили сертификат на сумму:</Text>
                                <Title order={1} fw={800} c="miko">
                                    {formatCurrency(certificate?.amount)}
                                </Title>
                                <Text c="dimmed">
                                    Отправитель: <Text span fw={700} c="dark">{certificate?.senderPhone}</Text>
                                </Text>
                                <motion.div whileHover={{ scale: 1.05 }} style={{ width: '100%' }}>
                                    <Button
                                        fullWidth
                                        size="xl"
                                        color="miko"
                                        radius="xl"
                                        leftSection={<IconCheck size={20} />}
                                        onClick={handleActivate}
                                        mt="md"
                                    >
                                        Активировать подарок 🎉
                                    </Button>
                                </motion.div>
                            </Stack>
                        </Card>
                    </motion.div>
                </>
            )}
        </Center>
    );
};
