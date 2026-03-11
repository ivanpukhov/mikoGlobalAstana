import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Form,
    Input,
    Row,
    Space,
    Spin,
    Typography,
    message,
} from 'antd';
import { CheckCircleOutlined, QrcodeOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/api';

const { Text, Title } = Typography;

const NotificationsPage = () => {
    const [form] = Form.useForm();
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
            message.error(error.response?.data?.error || 'Не удалось проверить состояние инстанса');
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

            form.setFieldsValue({
                apiUrl: settingsResp.data.apiUrl,
                mediaUrl: settingsResp.data.mediaUrl,
                idInstance: settingsResp.data.idInstance,
                apiTokenInstance: settingsResp.data.apiTokenInstance,
            });

            setTemplates(
                templatesResp.data.map((item) => ({
                    ...item,
                    draftText: item.text,
                }))
            );

            if (settingsResp.data.instanceState) {
                setInstanceState(settingsResp.data.instanceState);
                setIsAuthorized(Boolean(settingsResp.data.isAuthorized));
            }
        } catch (error) {
            message.error(error.response?.data?.error || 'Ошибка загрузки данных уведомлений');
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        loadData();
        return () => stopPolling();
    }, [loadData, stopPolling]);

    const saveSettings = async () => {
        const values = await form.validateFields();
        setSavingSettings(true);
        try {
            await api.put('/notifications/settings', values);
            message.success('Настройки Green API сохранены');
            return true;
        } catch (error) {
            message.error(error.response?.data?.error || 'Не удалось сохранить настройки');
            return false;
        } finally {
            setSavingSettings(false);
        }
    };

    const startAuthorization = async () => {
        const saved = await saveSettings();
        if (!saved) {
            return;
        }

        setQrLoading(true);
        try {
            const { data } = await api.post('/notifications/qr');
            if (data?.type === 'alreadyLogged' || data?.type === 'authorized') {
                setIsAuthorized(true);
                setInstanceState('authorized');
                setQrText('');
                stopPolling();
                message.success('Инстанс уже авторизован');
                return;
            }

            if (data?.type === 'qrCode') {
                const qrMessage = String(data?.message || data?.qrCode || '').trim();
                if (!qrMessage) {
                    message.warning('QR пока недоступен. Проверьте состояние инстанса.');
                    return;
                }

                setQrRenderMode('image');
                setQrText(`data:image/png;base64,${qrMessage.replace(/\s+/g, '')}`);
                setIsAuthorized(false);
                stopPolling();
                pollerRef.current = setInterval(() => {
                    checkState();
                }, 5000);
                return;
            }

            const qrValueRaw = String(data?.qrCode || data?.message || '').trim();

            if (!qrValueRaw) {
                message.warning('QR пока недоступен. Проверьте состояние инстанса.');
                return;
            }

            const normalized = qrValueRaw.replace(/\s+/g, '');
            const isDataImage = /^data:image\/[a-zA-Z+.-]+;base64,/.test(normalized);
            const isLongBase64 = normalized.length > 1200 && /^[A-Za-z0-9+/=]+$/.test(normalized);
            const isTooLongForQr = qrValueRaw.length > 1200;

            if (isDataImage) {
                setQrRenderMode('image');
                setQrText(normalized);
            } else if (isLongBase64 || isTooLongForQr) {
                setQrRenderMode('image');
                setQrText(`data:image/png;base64,${normalized}`);
            } else {
                setQrRenderMode('text');
                setQrText(qrValueRaw);
            }

            setIsAuthorized(false);

            stopPolling();
            pollerRef.current = setInterval(() => {
                checkState();
            }, 5000);
        } catch (error) {
            message.error(error.response?.data?.error || 'Не удалось получить QR код');
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
            message.success(`Шаблон «${template.name}» сохранён`);
        } catch (error) {
            message.error(error.response?.data?.error || 'Ошибка сохранения шаблона');
        } finally {
            setSavingTemplateKey('');
        }
    };

    const stateColor = isAuthorized ? 'green' : instanceState === 'notAuthorized' ? 'red' : 'gold';

    if (loading) {
        return <Spin size="large" />;
    }

    return (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Title level={4} style={{ margin: 0 }}>Уведомления и Green API</Title>
                    <Text type="secondary">Заполните параметры подключения, проверьте состояние инстанса и выполните авторизацию по QR.</Text>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Form form={form} layout="vertical">
                                <Form.Item name="apiUrl" label="apiUrl" rules={[{ required: true, message: 'Укажите apiUrl' }]}>
                                    <Input placeholder="https://api.green-api.com" />
                                </Form.Item>
                                <Form.Item name="mediaUrl" label="mediaUrl" rules={[{ required: true, message: 'Укажите mediaUrl' }]}>
                                    <Input placeholder="https://media.green-api.com" />
                                </Form.Item>
                                <Form.Item name="idInstance" label="idInstance" rules={[{ required: true, message: 'Укажите idInstance' }]}>
                                    <Input placeholder="7103..." />
                                </Form.Item>
                                <Form.Item name="apiTokenInstance" label="apiTokenInstance" rules={[{ required: true, message: 'Укажите apiTokenInstance' }]}>
                                    <Input.Password placeholder="api token" />
                                </Form.Item>

                                <Space wrap>
                                    <Button icon={<SaveOutlined />} type="primary" loading={savingSettings} onClick={saveSettings}>
                                        Сохранить
                                    </Button>
                                    <Button icon={<ReloadOutlined />} loading={checkingState} onClick={checkState}>
                                        Проверить состояние
                                    </Button>
                                    <Button icon={<QrcodeOutlined />} loading={qrLoading} onClick={startAuthorization}>
                                        Авторизация
                                    </Button>
                                </Space>
                            </Form>
                        </Col>

                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={16} style={{ width: '100%', alignItems: 'center' }}>
                                <Badge color={stateColor} text={`Состояние: ${instanceState || 'unknown'}`} />
                                {isAuthorized && (
                                    <Alert
                                        type="success"
                                        showIcon
                                        icon={<CheckCircleOutlined />}
                                        message="Инстанс авторизован"
                                    />
                                )}

                                {!isAuthorized && qrText && (
                                    <Card title="QR для WhatsApp" style={{ width: '100%', textAlign: 'center' }}>
                                        {qrRenderMode === 'image' ? (
                                            <img
                                                src={qrText}
                                                alt="QR code"
                                                style={{ maxWidth: '100%', width: 260, height: 260, objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <QRCodeSVG value={qrText} size={240} includeMargin />
                                        )}
                                        <Divider />
                                        <Text type="secondary">Статус проверяется каждые 5 секунд</Text>
                                    </Card>
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Card>

            <Card>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Title level={4} style={{ margin: 0 }}>Шаблоны сообщений</Title>
                    <Alert
                        type="info"
                        showIcon
                        message="Используйте переменные в формате {text}, например {customerName}, {orderId}, {status}."
                    />

                    {templates.length === 0 && <Empty description="Шаблоны пока не найдены" />}

                    <Row gutter={[16, 16]}>
                        {templates.map((template) => (
                            <Col xs={24} lg={12} key={template.key}>
                                <Card title={template.name} size="small" extra={<Text type="secondary">{template.key}</Text>}>
                                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                        <Input.TextArea
                                            value={template.draftText}
                                            onChange={(e) => updateDraft(template.key, e.target.value)}
                                            autoSize={{ minRows: 6, maxRows: 14 }}
                                        />
                                        <Button
                                            type="primary"
                                            loading={savingTemplateKey === template.key}
                                            onClick={() => saveTemplate(template)}
                                        >
                                            Сохранить шаблон
                                        </Button>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Space>
            </Card>
        </Space>
    );
};

export default NotificationsPage;
