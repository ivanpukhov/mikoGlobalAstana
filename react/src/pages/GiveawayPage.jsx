import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Checkbox,
    Group,
    Loader,
    MultiSelect,
    NumberInput,
    Radio,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCalendarEvent,
    IconCheck,
    IconClockPause,
    IconReceipt,
    IconUpload,
} from '@tabler/icons-react';
import api, { getApiErrorMessage } from '../api/api';
import {
    formatGiveawayDateTime,
    getInitialFieldValue,
    resolveGiveawayReceipt,
} from '../utils/giveaway';
import styles from './GiveawayPage.module.css';

const buildInitialFormData = (fields = []) => (
    fields.reduce((acc, field) => {
        acc[field.id] = getInitialFieldValue(field);
        return acc;
    }, {})
);

const getFieldInputMode = (field) => {
    if (field.type === 'phone') return 'tel';
    if (field.type === 'email') return 'email';
    return 'text';
};

const isExternalLink = (value = '') => value.startsWith('http://') || value.startsWith('https://');

const GiveawayPage = () => {
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState({});
    const [receipt, setReceipt] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let cancelled = false;

        api.get('/giveaway/form')
            .then(({ data }) => {
                if (cancelled) return;
                const fields = Array.isArray(data.fields) ? data.fields : [];
                setSettings(data);
                setFormData(buildInitialFormData(fields));
            })
            .catch(() => {
                if (!cancelled) {
                    notifications.show({ color: 'red', message: 'Не удалось загрузить форму розыгрыша.' });
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => () => {
        if (receiptPreview) {
            URL.revokeObjectURL(receiptPreview);
        }
    }, [receiptPreview]);

    const sortedFields = useMemo(
        () => [...(settings?.fields || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
        [settings?.fields]
    );

    const bannerImage = resolveGiveawayReceipt(settings?.bannerImage);
    const bannerLink = settings?.bannerLink || '';

    const updateField = (fieldId, value) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleReceiptChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            notifications.show({ color: 'red', message: 'Загрузите фото чека в формате JPG или PNG.' });
            return;
        }

        if (receiptPreview) {
            URL.revokeObjectURL(receiptPreview);
        }

        setReceipt(file);
        setReceiptPreview(URL.createObjectURL(file));
    };

    const renderField = (field) => {
        const value = formData[field.id];
        const commonProps = {
            label: field.label,
            placeholder: field.placeholder || undefined,
            required: field.required,
            radius: 'md',
        };
        const options = (field.options || []).map((option) => ({
            value: option.value,
            label: option.label,
        }));
        const isWide = ['textarea', 'checkbox', 'checkbox_group', 'radio', 'multiselect'].includes(field.type);
        const className = isWide ? styles.wide : undefined;

        if (field.type === 'textarea') {
            return (
                <Textarea
                    key={field.id}
                    className={className}
                    {...commonProps}
                    minRows={3}
                    value={value || ''}
                    onChange={(event) => updateField(field.id, event.target.value)}
                />
            );
        }

        if (field.type === 'number') {
            return (
                <NumberInput
                    key={field.id}
                    className={className}
                    {...commonProps}
                    value={value}
                    onChange={(nextValue) => updateField(field.id, nextValue)}
                />
            );
        }

        if (field.type === 'date') {
            return (
                <TextInput
                    key={field.id}
                    className={className}
                    {...commonProps}
                    type="date"
                    value={value || ''}
                    onChange={(event) => updateField(field.id, event.target.value)}
                />
            );
        }

        if (field.type === 'select') {
            return (
                <Select
                    key={field.id}
                    className={className}
                    {...commonProps}
                    data={options}
                    value={value || null}
                    onChange={(nextValue) => updateField(field.id, nextValue || '')}
                />
            );
        }

        if (field.type === 'multiselect') {
            return (
                <MultiSelect
                    key={field.id}
                    className={className}
                    {...commonProps}
                    data={options}
                    value={Array.isArray(value) ? value : []}
                    onChange={(nextValue) => updateField(field.id, nextValue)}
                />
            );
        }

        if (field.type === 'radio') {
            return (
                <Radio.Group
                    key={field.id}
                    className={className}
                    {...commonProps}
                    value={value || ''}
                    onChange={(nextValue) => updateField(field.id, nextValue)}
                >
                    <Group mt="xs" gap="sm">
                        {options.map((option) => (
                            <Radio key={option.value} value={option.value} label={option.label} />
                        ))}
                    </Group>
                </Radio.Group>
            );
        }

        if (field.type === 'checkbox') {
            return (
                <Checkbox
                    key={field.id}
                    className={className}
                    label={field.label}
                    checked={Boolean(value)}
                    onChange={(event) => updateField(field.id, event.currentTarget.checked)}
                />
            );
        }

        if (field.type === 'checkbox_group') {
            return (
                <Checkbox.Group
                    key={field.id}
                    className={className}
                    {...commonProps}
                    value={Array.isArray(value) ? value : []}
                    onChange={(nextValue) => updateField(field.id, nextValue)}
                >
                    <Group mt="xs" gap="sm">
                        {options.map((option) => (
                            <Checkbox key={option.value} value={option.value} label={option.label} />
                        ))}
                    </Group>
                </Checkbox.Group>
            );
        }

        return (
            <TextInput
                key={field.id}
                className={className}
                {...commonProps}
                type={field.type === 'email' ? 'email' : 'text'}
                inputMode={getFieldInputMode(field)}
                value={value || ''}
                onChange={(event) => updateField(field.id, event.target.value)}
            />
        );
    };

    const submitForm = async (event) => {
        event.preventDefault();

        if (!receipt) {
            notifications.show({ color: 'red', message: 'Прикрепите фото чека.' });
            return;
        }

        const payload = new FormData();
        payload.append('receipt', receipt);
        payload.append('formData', JSON.stringify(formData));

        setSubmitting(true);
        try {
            const { data } = await api.post('/giveaway/participants', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(data);
        } catch (error) {
            notifications.show({
                color: 'red',
                message: getApiErrorMessage(error, 'Не удалось отправить заявку.'),
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Group justify="center" py="xl">
                <Loader color="miko" />
            </Group>
        );
    }

    return (
        <Box className={styles.page}>
            <div className={styles.shell}>
                <aside className={styles.sideColumn}>
                    {!!bannerImage && (
                        bannerLink ? (
                            <a
                                className={styles.banner}
                                href={bannerLink}
                                target={isExternalLink(bannerLink) ? '_blank' : undefined}
                                rel={isExternalLink(bannerLink) ? 'noreferrer' : undefined}
                            >
                                <img src={bannerImage} alt="Баннер розыгрыша" />
                            </a>
                        ) : (
                            <div className={styles.banner}>
                                <img src={bannerImage} alt="Баннер розыгрыша" />
                            </div>
                        )
                    )}

                    <div className={styles.intro}>
                        <div className={styles.badge}>
                            <IconReceipt size={16} />
                            Розыгрыш MIKO
                        </div>
                        <h1 className={styles.title}>{settings?.title || 'Розыгрыш подарков MIKO'}</h1>
                        {!!settings?.description && (
                            <p className={styles.description}>{settings.description}</p>
                        )}

                        {settings?.usePeriod && (
                            <Stack gap={6} mt="xl">
                                <Group gap={8}>
                                    <IconCalendarEvent size={18} color="#06776c" />
                                    <Text size="sm" fw={700}>Период приёма чеков</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {formatGiveawayDateTime(settings.startsAt)} — {formatGiveawayDateTime(settings.endsAt)}
                                </Text>
                            </Stack>
                        )}

                        {!!settings?.rulesText && (
                            <div className={styles.rules}>{settings.rulesText}</div>
                        )}
                    </div>
                </aside>

                {result ? (
                    <section className={styles.resultPanel}>
                        <Stack gap="md">
                            <Badge color="teal" size="lg" radius="md" leftSection={<IconCheck size={16} />}>
                                Готово
                            </Badge>
                            <Title order={2}>{result.successTitle || 'Заявка принята'}</Title>
                            <Text c="dimmed" fz="md">
                                {result.successText || 'Мы сохранили вашу заявку на участие.'}
                            </Text>
                            <div className={styles.ticket}>{result.ticketNumber}</div>
                        </Stack>
                    </section>
                ) : !settings?.isAcceptingReceipts ? (
                    <section className={styles.closedPanel}>
                        <Stack gap="sm">
                            <Badge color="gray" size="lg" radius="md" leftSection={<IconClockPause size={16} />}>
                                Приём закрыт
                            </Badge>
                            <Title order={2}>Сейчас нельзя загрузить чек</Title>
                            <Text c="dimmed" fz="md">
                                {settings?.closedReason || 'Приём чеков временно выключен.'}
                            </Text>
                        </Stack>
                    </section>
                ) : (
                    <form className={styles.formPanel} onSubmit={submitForm}>
                        <Stack gap="lg">
                            <Stack gap={6}>
                                <h2 className={styles.sectionTitle}>Данные участника</h2>
                                <Text size="sm" c="dimmed">
                                    Номер участника появится сразу после отправки.
                                </Text>
                            </Stack>

                            <Stack gap="xs">
                                <Text size="sm" fw={600}>Фото чека</Text>
                                <label className={styles.receiptBox}>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleReceiptChange}
                                        style={{ display: 'none' }}
                                    />
                                    {receiptPreview ? (
                                        <img className={styles.receiptPreview} src={receiptPreview} alt="Чек" />
                                    ) : (
                                        <div className={styles.receiptEmpty}>
                                            <span className={styles.receiptIcon}>
                                                <IconUpload size={24} />
                                            </span>
                                            <Text fw={700}>Прикрепить фото чека</Text>
                                            <Text size="sm" c="dimmed">JPG или PNG</Text>
                                        </div>
                                    )}
                                </label>
                            </Stack>

                            <div className={styles.formGrid}>
                                {sortedFields.map(renderField)}
                            </div>

                            <Button
                                type="submit"
                                color="miko"
                                size="lg"
                                radius="md"
                                loading={submitting}
                                leftSection={<IconCheck size={18} />}
                            >
                                Отправить заявку
                            </Button>
                        </Stack>
                    </form>
                )}
            </div>
        </Box>
    );
};

export default GiveawayPage;
