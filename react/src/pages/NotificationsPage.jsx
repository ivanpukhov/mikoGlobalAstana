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
    PasswordInput,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconDeviceFloppy,
    IconQrcode,
    IconRefresh,
} from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/api';
import { EmptyState } from '../components/ui';

const NotificationsPage = () => {
    const form = useForm({
        initialValues: {
            apiUrl: '',
            mediaUrl: '',
            idInstance: '',
            apiTokenInstance: '',
        },
        validate: {
            apiUrl: (v) => (v.trim() ? null : 'Укажите apiUrl'),
            mediaUrl: (v) => (v.trim() ? null : 'Укажите mediaUrl'),
            idInstance: (v) => (v.trim() ? null : 'Укажите idInstance'),
            apiTokenInstance: (v) => (v.trim() ? null : 'Укажите apiTokenInstance'),
        },
    });

    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [checkingState, setCheckingState] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [instanceState, setInstanceState] = useState('unknown');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [qrText, setQrText] = useState('');
    const [templates, setTemplates] = useState([]);
    const [savingTemplateKey, setSavingTemplateKey] = useState('');
    const [qrRenderMode, setQrRenderMode] = useState('text');
    const pollerRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (pollerRef.current) {
            clearInterval(pollerRef.current);
            pollerRef.current = null;
        }
    }, []);

    const checkState = useCallback(async () => {
        setCheckingState(true);
        try {
            const { data } = await api.get('/notifications/state');
            const nextState = data?.stateInstance || 'unknown';
            const authorized = Boolean(data?.isAuthorized);
            setInstanceState(nextState);
            setIsAuthorized(authorized);
            if (authorized) {
                setQrText('');
                stopPolling();
            }
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось проверить состояние инстанса' });
        } finally {
            setCheckingState(false);
        }
    }, [stopPolling]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsResp, templatesResp] = await Promise.all([
                api.get('/notifications/settings'),
                api.get('/notifications/templates'),
            ]);

            form.setValues({
                apiUrl: settingsResp.data.apiUrl,
                mediaUrl: settingsResp.data.mediaUrl,
                idInstance: settingsResp.data.idInstance,
                apiTokenInstance: settingsResp.data.apiTokenInstance,
            });

            setTemplates(templatesResp.data.map((item) => ({ ...item, draftText: item.text })));

            if (settingsResp.data.instanceState) {
                setInstanceState(settingsResp.data.instanceState);
                setIsAuthorized(Boolean(settingsResp.data.isAuthorized));
            }
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Ошибка загрузки данных уведомлений' });
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadData();
        return () => stopPolling();
    }, [loadData, stopPolling]);

    const saveSettings = async () => {
        const validation = form.validate();
        if (validation.hasErrors) return false;
        setSavingSettings(true);
        try {
            await api.put('/notifications/settings', form.values);
            notifications.show({ color: 'teal', message: 'Настройки Green API сохранены' });
            return true;
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось сохранить настройки' });
            return false;
        } finally {
            setSavingSettings(false);
        }
    };

    const startAuthorization = async () => {
        const saved = await saveSettings();
        if (!saved) return;

        setQrLoading(true);
        try {
            const { data } = await api.post('/notifications/qr');

            if (data?.type === 'alreadyLogged' || data?.type === 'authorized') {
                setIsAuthorized(true);
                setInstanceState('authorized');
                setQrText('');
                stopPolling();
                notifications.show({ color: 'teal', message: 'Инстанс уже авторизован' });
                return;
            }

            if (data?.type === 'qrCode') {
                const qrMessage = String(data?.message || data?.qrCode || '').trim();
                if (!qrMessage) { notifications.show({ color: 'yellow', message: 'QR пока недоступен. Проверьте состояние инстанса.' }); return; }
                setQrRenderMode('image');
                setQrText(`data:image/png;base64,${qrMessage.replace(/\s+/g, '')}`);
                setIsAuthorized(false);
                stopPolling();
                pollerRef.current = setInterval(checkState, 5000);
                return;
            }

            const qrValueRaw = String(data?.qrCode || data?.message || '').trim();
            if (!qrValueRaw) { notifications.show({ color: 'yellow', message: 'QR пока недоступен. Проверьте состояние инстанса.' }); return; }

            const normalized = qrValueRaw.replace(/\s+/g, '');
            const isDataImage = /^data:image\/[a-zA-Z+.-]+;base64,/.test(normalized);
            const isLongBase64 = normalized.length > 1200 && /^[A-Za-z0-9+/=]+$/.test(normalized);

            if (isDataImage) {
                setQrRenderMode('image');
                setQrText(normalized);
            } else if (isLongBase64 || qrValueRaw.length > 1200) {
                setQrRenderMode('image');
                setQrText(`data:image/png;base64,${normalized}`);
            } else {
                setQrRenderMode('text');
                setQrText(qrValueRaw);
            }

            setIsAuthorized(false);
            stopPolling();
            pollerRef.current = setInterval(checkState, 5000);
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.error || 'Не удалось получить QR код' });
        } finally {
            setQrLoading(false);
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

    const stateColor = isAuthorized ? 'teal' : instanceState === 'notAuthorized' ? 'red' : 'yellow';

    if (loading) {
        return <Group justify="center" py="xl"><Loader size="lg" color="miko" /></Group>;
    }

    return (
        <Stack gap="lg">
            {/* Green API Settings */}
            <Card radius="xl" shadow="sm" p="xl" withBorder>
                <Stack gap="md">
                    <Title order={4} fw={700}>Уведомления и Green API</Title>
                    <Text c="dimmed" size="sm">
                        Заполните параметры подключения, проверьте состояние инстанса и выполните авторизацию по QR.
                    </Text>

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <form>
                                <Stack gap="sm">
                                    <TextInput label="apiUrl" placeholder="https://api.green-api.com" {...form.getInputProps('apiUrl')} radius="md" />
                                    <TextInput label="mediaUrl" placeholder="https://media.green-api.com" {...form.getInputProps('mediaUrl')} radius="md" />
                                    <TextInput label="idInstance" placeholder="7103..." {...form.getInputProps('idInstance')} radius="md" />
                                    <PasswordInput label="apiTokenInstance" placeholder="api token" {...form.getInputProps('apiTokenInstance')} radius="md" />

                                    <Group mt="sm" gap="sm" wrap="wrap">
                                        <Button
                                            leftSection={<IconDeviceFloppy size={16} />}
                                            color="miko"
                                            radius="md"
                                            loading={savingSettings}
                                            onClick={saveSettings}
                                        >
                                            Сохранить
                                        </Button>
                                        <Button
                                            leftSection={<IconRefresh size={16} />}
                                            variant="default"
                                            radius="md"
                                            loading={checkingState}
                                            onClick={checkState}
                                        >
                                            Проверить состояние
                                        </Button>
                                        <Button
                                            leftSection={<IconQrcode size={16} />}
                                            variant="default"
                                            radius="md"
                                            loading={qrLoading}
                                            onClick={startAuthorization}
                                        >
                                            Авторизация
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Stack align="center" gap="md">
                                <Badge color={stateColor} size="lg" variant="light">
                                    Состояние: {instanceState || 'unknown'}
                                </Badge>

                                {isAuthorized && (
                                    <Alert
                                        color="teal"
                                        radius="md"
                                        icon={<IconCheck size={16} />}
                                        title="Инстанс авторизован"
                                    />
                                )}

                                {!isAuthorized && qrText && (
                                    <Card withBorder radius="lg" p="md" ta="center">
                                        <Stack align="center" gap="sm">
                                            <Text fw={600}>QR для WhatsApp</Text>
                                            {qrRenderMode === 'image' ? (
                                                <img
                                                    src={qrText}
                                                    alt="QR code"
                                                    style={{ maxWidth: '100%', width: 260, height: 260, objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <QRCodeSVG value={qrText} size={240} includeMargin />
                                            )}
                                            <Divider w="100%" />
                                            <Text size="sm" c="dimmed">Статус проверяется каждые 5 секунд</Text>
                                        </Stack>
                                    </Card>
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
