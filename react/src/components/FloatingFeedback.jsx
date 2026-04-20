import { useState } from 'react';
import { ActionIcon, Box, Button, Group, Paper, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMessage, IconX } from '@tabler/icons-react';
import api from '../api/api';

const FloatingFeedback = () => {
    const [open, setOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [contact, setContact] = useState('');
    const [sending, setSending] = useState(false);

    const submitFeedback = async () => {
        if (!feedbackText.trim()) {
            notifications.show({ color: 'yellow', message: 'Введите текст обратной связи' });
            return;
        }
        setSending(true);
        try {
            await api.post('/notifications/feedback', {
                feedbackText: feedbackText.trim(),
                contact: contact.trim(),
            });
            notifications.show({ color: 'teal', message: 'Спасибо! Обратная связь отправлена' });
            setFeedbackText('');
            setContact('');
            setOpen(false);
        } catch (err) {
            notifications.show({
                color: 'red',
                message: err.response?.data?.error || 'Ошибка отправки обратной связи',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Box pos="fixed" right={20} bottom={20} style={{ zIndex: 1000 }}>
            {open && (
                <Paper
                    shadow="lg"
                    radius="lg"
                    p="md"
                    w={300}
                    mb="sm"
                    withBorder
                >
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={600} size="sm">Обратная связь</Text>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                onClick={() => setOpen(false)}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        </Group>
                        <Textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Напишите ваше сообщение"
                            minRows={3}
                            maxRows={6}
                            autosize
                        />
                        <TextInput
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="Контакт (необязательно)"
                        />
                        <Button fullWidth loading={sending} onClick={submitFeedback}>
                            Отправить
                        </Button>
                    </Stack>
                </Paper>
            )}

            <ActionIcon
                size={52}
                radius="xl"
                variant="filled"
                color="miko"
                onClick={() => setOpen((v) => !v)}
                style={{
                    boxShadow: '0 8px 20px rgba(12, 227, 203, 0.4)',
                    display: 'flex',
                    margin: '0 0 0 auto',
                }}
                aria-label="Обратная связь"
            >
                <IconMessage size={24} />
            </ActionIcon>
        </Box>
    );
};

export default FloatingFeedback;
