import { useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import api from '../api/api';

const { Text } = Typography;

const FloatingFeedback = () => {
    const [open, setOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [contact, setContact] = useState('');
    const [sending, setSending] = useState(false);

    const submitFeedback = async () => {
        if (!feedbackText.trim()) {
            message.warning('Введите текст обратной связи');
            return;
        }

        setSending(true);
        try {
            await api.post('/notifications/feedback', {
                feedbackText: feedbackText.trim(),
                contact: contact.trim(),
            });
            message.success('Спасибо! Обратная связь отправлена');
            setFeedbackText('');
            setContact('');
            setOpen(false);
        } catch (error) {
            message.error(error.response?.data?.error || 'Ошибка отправки обратной связи');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000 }}>
            {open && (
                <Card style={{ width: 320, marginBottom: 12, borderRadius: 14, boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Оставьте обратную связь</Text>
                        <Input.TextArea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Напишите ваше сообщение"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                        <Input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="Контакт (необязательно)"
                        />
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Button onClick={() => setOpen(false)}>Закрыть</Button>
                            <Button type="primary" loading={sending} onClick={submitFeedback}>Отправить</Button>
                        </Space>
                    </Space>
                </Card>
            )}

            <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<MessageOutlined />}
                onClick={() => setOpen((prev) => !prev)}
                style={{ width: 56, height: 56, boxShadow: '0 10px 24px rgba(24, 144, 255, 0.45)' }}
            />
        </div>
    );
};

export default FloatingFeedback;
