import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Grid,
    Group,
    Loader,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconPower,
    IconQrcode,
    IconRefresh,
} from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/api';
import { EmptyState } from '../components/ui';

const NotificationsPage = () => {
    const [loading, setLoading] = useState(true);
    const [checkingState, setCheckingState] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [instanceState, setInstanceState] = useState('unknown');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [qrText, setQrText] = useState('');
    const [templates, setTemplates] = useState([]);
    const [savingTemplateKey, setSavingTemplateKey] = useState('');
    const pollerRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (pollerRef.current) {
            clearInterval(pollerRef.current);
            pollerRef.current = null;
        }
    }, []);

    const applyConnectionState = useCallback((data) => {
        const nextState = data?.stateInstance || 'unknown';
        const authorized = Boolean(data?.isAuthorized);
        const nextQr = String(data?.qrCode || data?.message || '').trim();

        setInstanceState(nextState);
        setIsAuthorized(authorized);

        if (authorized) {
            setQrText('');
            stopPolling();
            return;
        }

        if (nextQr) {
            setQrText(nextQr);
        }
    }, [stopPolling]);

    const checkState = useCallback(async () => {
        setCheckingState(true);
        try {
            const { data } = await api.get('/notifications/state');
            applyConnectionState(data);
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось проверить состояние WhatsApp' });
        } finally {
            setCheckingState(false);
        }
    }, [applyConnectionState]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsResp, templatesResp, stateResp] = await Promise.all([
                api.get('/notifications/settings'),
                api.get('/notifications/templates'),
                api.get('/notifications/state'),
            ]);

            setTemplates(templatesResp.data.map((item) => ({ ...item, draftText: item.text })));

            if (settingsResp.data.instanceState) {
                setInstanceState(settingsResp.data.instanceState);
                setIsAuthorized(Boolean(settingsResp.data.isAuthorized));
            }
            applyConnectionState(stateResp.data);
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Ошибка загрузки данных уведомлений' });
        } finally {
            setLoading(false);
        }
    }, [applyConnectionState]);

    useEffect(() => {
        loadData();
        return () => stopPolling();
    }, [loadData, stopPolling]);

    const startAuthorization = async () => {
        setQrLoading(true);
        try {
            const { data } = await api.post('/notifications/qr');

            if (data?.type === 'alreadyLogged' || data?.type === 'authorized') {
                applyConnectionState({ ...data, stateInstance: 'authorized', isAuthorized: true });
                stopPolling();
                notifications.show({ color: 'teal', message: 'WhatsApp уже подключён' });
                return;
            }

            const qrValueRaw = String(data?.qrCode || data?.message || '').trim();
            if (!qrValueRaw) { notifications.show({ color: 'yellow', message: 'QR пока недоступен. Проверьте состояние WhatsApp.' }); return; }

            setQrText(qrValueRaw);
            setInstanceState(data?.stateInstance || 'qr');
            setIsAuthorized(false);
            stopPolling();
            pollerRef.current = setInterval(checkState, 5000);
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось получить QR код' });
        } finally {
            setQrLoading(false);
        }
    };

    const logoutWhatsApp = async () => {
        setLogoutLoading(true);
        try {
            const { data } = await api.post('/notifications/logout');
            applyConnectionState(data);
            setQrText('');
            stopPolling();
            notifications.show({ color: 'teal', message: 'WhatsApp отключён' });
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось отключить WhatsApp' });
        } finally {
            setLogoutLoading(false);
        }
    };

    const updateDraft = (key, value) => {
        setTemplates((prev) => prev.map((item) => (item.key === key ? { ...item, draftText: value } : item)));
    };

    const saveTemplate = async (template) => {
        setSavingTemplateKey(template.key);
        try {
            const { data } = await api.put(`/notifications/templates/${template.key}`, { text: template.draftText });
            setTemplates((prev) =>
                prev.map((item) => (item.key === template.key ? { ...item, text: data.text, draftText: data.text } : item))
            );
            notifications.show({ color: 'teal', message: `Шаблон «${template.name}» сохранён` });
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Ошибка сохранения шаблона' });
        } finally {
            setSavingTemplateKey('');
        }
    };

    const stateColor = isAuthorized ? 'teal' : instanceState === 'qr' ? 'blue' : ['loggedOut', 'notAuthorized', 'error'].includes(instanceState) ? 'red' : 'yellow';

    if (loading) {
        return <Group justify="center" py="xl"><Loader size="lg" color="miko" /></Group>;
    }

    return (
        <Stack gap="lg">
            <Card radius="xl" shadow="sm" p="xl" withBorder>
                <Stack gap="md">
                    <Title order={4} fw={700}>Подключение WhatsApp</Title>
                    <Text c="dimmed" size="sm">
                        Авторизация выполняется через Baileys. После сканирования QR уведомления будут отправляться с подключённого номера.
                    </Text>

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack gap="md">
                                <Group gap="sm" wrap="wrap">
                                    <Badge color={stateColor} size="lg" variant="light">
                                        Состояние: {instanceState || 'unknown'}
                                    </Badge>
                                    {isAuthorized && (
                                        <Badge color="teal" size="lg" variant="filled">
                                            Подключено
                                        </Badge>
                                    )}
                                </Group>

                                <Group gap="sm" wrap="wrap">
                                    <Button
                                        leftSection={<IconQrcode size={16} />}
                                        color="miko"
                                        radius="md"
                                        loading={qrLoading}
                                        onClick={startAuthorization}
                                    >
                                        Получить QR
                                    </Button>
                                    <Button
                                        leftSection={<IconRefresh size={16} />}
                                        variant="default"
                                        radius="md"
                                        loading={checkingState}
                                        onClick={checkState}
                                    >
                                        Проверить
                                    </Button>
                                    <Button
                                        leftSection={<IconPower size={16} />}
                                        variant="light"
                                        color="red"
                                        radius="md"
                                        loading={logoutLoading}
                                        onClick={logoutWhatsApp}
                                    >
                                        Отключить
                                    </Button>
                                </Group>

                                {isAuthorized ? (
                                    <Alert
                                        color="teal"
                                        radius="md"
                                        icon={<IconCheck size={16} />}
                                        title="WhatsApp подключён"
                                    />
                                ) : (
                                    <Alert color="blue" radius="md" title="Ожидает авторизацию">
                                        Нажмите «Получить QR» и отсканируйте код в WhatsApp.
                                    </Alert>
                                )}
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack align="center" gap="md">
                                {!isAuthorized && qrText ? (
                                    <Card withBorder radius="lg" p="md" ta="center">
                                        <Stack align="center" gap="sm">
                                            <Text fw={600}>QR для авторизации WhatsApp</Text>
                                            <QRCodeSVG value={qrText} size={240} includeMargin />
                                            <Divider w="100%" />
                                            <Text size="sm" c="dimmed">Статус проверяется каждые 5 секунд</Text>
                                        </Stack>
                                    </Card>
                                ) : (
                                    <EmptyState title={isAuthorized ? 'QR не требуется' : 'QR ещё не запрошен'} />
                                )}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Card>

            {/* Message Templates */}
            <Card radius="xl" shadow="sm" p="xl" withBorder>
                <Stack gap="md">
                    <Title order={4} fw={700}>Шаблоны сообщений</Title>
                    <Alert color="blue" radius="md">
                        Используйте переменные в формате {'{text}'}, например {'{customerName}'}, {'{orderId}'}, {'{status}'}.
                    </Alert>

                    {templates.length === 0 ? (
                        <EmptyState title="Шаблоны пока не найдены" />
                    ) : (
                        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                            {templates.map((template) => (
                                <Card key={template.key} withBorder radius="lg" p="md">
                                    <Stack gap="sm">
                                        <Group justify="space-between">
                                            <Text fw={600}>{template.name}</Text>
                                            <Text size="xs" c="dimmed">{template.key}</Text>
                                        </Group>
                                        <Textarea
                                            value={template.draftText}
                                            onChange={(e) => updateDraft(template.key, e.target.value)}
                                            minRows={6}
                                            maxRows={14}
                                            radius="md"
                                            autosize
                                        />
                                        <Button
                                            color="miko"
                                            radius="md"
                                            size="sm"
                                            loading={savingTemplateKey === template.key}
                                            onClick={() => saveTemplate(template)}
                                        >
                                            Сохранить шаблон
                                        </Button>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </Stack>
            </Card>
        </Stack>
    );
};

export default NotificationsPage;
