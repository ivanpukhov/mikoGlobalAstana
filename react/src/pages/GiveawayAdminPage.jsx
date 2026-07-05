import { useEffect, useMemo, useState } from 'react';
import {
    ActionIcon,
    AspectRatio,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Grid,
    Group,
    Image,
    Loader,
    Modal,
    Paper,
    ScrollArea,
    SegmentedControl,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Textarea,
    Title,
    Tooltip,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
    IconArrowDown,
    IconArrowUp,
    IconDownload,
    IconEdit,
    IconEye,
    IconFileSpreadsheet,
    IconFileTypePdf,
    IconPhoto,
    IconPlus,
    IconRefresh,
    IconTicket,
    IconTrash,
    IconUpload,
} from '@tabler/icons-react';
import api, { getApiErrorMessage } from '../api/api';
import {
    GIVEAWAY_FIELD_TYPES,
    GIVEAWAY_STATUS_COLORS,
    GIVEAWAY_STATUS_LABELS,
    GIVEAWAY_STATUS_OPTIONS,
    OPTION_FIELD_TYPES,
    createEmptyGiveawayField,
    formatGiveawayDateTime,
    formatGiveawayValue,
    getFieldTypeLabel,
    normalizeOptionsText,
    optionsToText,
    resolveGiveawayReceipt,
} from '../utils/giveaway';

const emptySettings = {
    title: 'Розыгрыш подарков MIKO',
    description: '',
    rulesText: '',
    successTitle: 'Заявка принята',
    successText: '',
    isActive: true,
    usePeriod: false,
    startsAt: null,
    endsAt: null,
    bannerImage: '',
    bannerLink: '',
    fields: [],
};

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getExportFilename = (extension) => {
    const date = new Date().toISOString().slice(0, 10);
    return `miko-giveaway-participants-${date}.${extension}`;
};

const GiveawayAdminPage = () => {
    const [settings, setSettings] = useState(emptySettings);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [participantDraft, setParticipantDraft] = useState({ status: 'new', adminNote: '' });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [{ data: settingsData }, { data: participantsData }] = await Promise.all([
                api.get('/giveaway/settings'),
                api.get('/giveaway/participants'),
            ]);

            setSettings({
                ...emptySettings,
                ...settingsData,
                startsAt: toDate(settingsData.startsAt),
                endsAt: toDate(settingsData.endsAt),
                bannerImage: settingsData.bannerImage || '',
                bannerLink: settingsData.bannerLink || '',
                fields: Array.isArray(settingsData.fields) ? settingsData.fields : [],
            });
            setBannerFile(null);
            setBannerPreview('');
            setParticipants(Array.isArray(participantsData) ? participantsData : []);
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось загрузить розыгрыш.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => () => {
        if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview);
        }
    }, [bannerPreview]);

    const visibleFields = useMemo(
        () => settings.fields.filter((field) => field.showInTable !== false),
        [settings.fields]
    );

    const filteredParticipants = useMemo(() => {
        const query = search.trim().toLowerCase();

        return participants.filter((participant) => {
            if (statusFilter !== 'all' && participant.status !== statusFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            const values = [
                participant.ticketNumber,
                participant.status,
                participant.adminNote,
                ...Object.values(participant.formData || {}),
            ]
                .flat()
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return values.includes(query);
        });
    }, [participants, search, statusFilter]);

    const stats = useMemo(() => ({
        total: participants.length,
        new: participants.filter((item) => item.status === 'new').length,
        approved: participants.filter((item) => item.status === 'approved').length,
        rejected: participants.filter((item) => item.status === 'rejected').length,
    }), [participants]);

    const updateSettings = (patch) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    };

    const updateField = (index, patch) => {
        setSettings((prev) => ({
            ...prev,
            fields: prev.fields.map((field, fieldIndex) => (
                fieldIndex === index ? { ...field, ...patch } : field
            )),
        }));
    };

    const addField = () => {
        setSettings((prev) => ({
            ...prev,
            fields: [...prev.fields, createEmptyGiveawayField(prev.fields.length)],
        }));
    };

    const removeField = (index) => {
        setSettings((prev) => ({
            ...prev,
            fields: prev.fields.filter((_, fieldIndex) => fieldIndex !== index),
        }));
    };

    const moveField = (index, direction) => {
        setSettings((prev) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= prev.fields.length) {
                return prev;
            }

            const fields = [...prev.fields];
            [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
            return { ...prev, fields };
        });
    };

    const handleBannerChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            notifications.show({ color: 'red', message: 'Загрузите баннер в формате JPG или PNG.' });
            return;
        }

        if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview);
        }

        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const removeBanner = () => {
        if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview);
        }

        setBannerFile(null);
        setBannerPreview('');
        updateSettings({ bannerImage: '', bannerLink: '' });
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const fields = settings.fields.map((field, index) => ({
                ...field,
                sortOrder: index + 1,
            }));
            const payload = new FormData();

            payload.append('title', settings.title || '');
            payload.append('description', settings.description || '');
            payload.append('rulesText', settings.rulesText || '');
            payload.append('successTitle', settings.successTitle || '');
            payload.append('successText', settings.successText || '');
            payload.append('isActive', String(Boolean(settings.isActive)));
            payload.append('usePeriod', String(Boolean(settings.usePeriod)));
            payload.append('startsAt', settings.usePeriod && settings.startsAt ? settings.startsAt.toISOString() : '');
            payload.append('endsAt', settings.usePeriod && settings.endsAt ? settings.endsAt.toISOString() : '');
            payload.append('bannerLink', settings.bannerLink || '');
            payload.append('removeBanner', String(!settings.bannerImage && !bannerFile));
            payload.append('fields', JSON.stringify(fields));

            if (bannerFile) {
                payload.append('bannerImage', bannerFile);
            }

            const { data } = await api.put('/giveaway/settings', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSettings({
                ...emptySettings,
                ...data,
                startsAt: toDate(data.startsAt),
                endsAt: toDate(data.endsAt),
                bannerImage: data.bannerImage || '',
                bannerLink: data.bannerLink || '',
                fields: Array.isArray(data.fields) ? data.fields : [],
            });
            setBannerFile(null);
            setBannerPreview('');
            notifications.show({ color: 'teal', message: 'Настройки розыгрыша сохранены.' });
        } catch (error) {
            notifications.show({
                color: 'red',
                message: getApiErrorMessage(error, 'Не удалось сохранить настройки.'),
            });
        } finally {
            setSavingSettings(false);
        }
    };

    const openParticipant = (participant) => {
        setSelectedParticipant(participant);
        setParticipantDraft({
            status: participant.status || 'new',
            adminNote: participant.adminNote || '',
        });
    };

    const saveParticipant = async () => {
        if (!selectedParticipant) return;

        try {
            const { data } = await api.patch(`/giveaway/participants/${selectedParticipant.id}`, participantDraft);
            setParticipants((prev) => prev.map((item) => (item.id === data.id ? data : item)));
            setSelectedParticipant(data);
            notifications.show({ color: 'teal', message: 'Участник обновлён.' });
        } catch (error) {
            notifications.show({
                color: 'red',
                message: getApiErrorMessage(error, 'Не удалось обновить участника.'),
            });
        }
    };

    const quickStatusUpdate = async (participant, status) => {
        try {
            const { data } = await api.patch(`/giveaway/participants/${participant.id}`, {
                status,
                adminNote: participant.adminNote || '',
            });
            setParticipants((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        } catch (error) {
            notifications.show({
                color: 'red',
                message: getApiErrorMessage(error, 'Не удалось изменить статус.'),
            });
        }
    };

    const confirmDeleteParticipant = (participant) => {
        modals.openConfirmModal({
            title: 'Удалить участника?',
            children: (
                <Text size="sm">
                    Заявка {participant.ticketNumber} будет удалена из списка.
                </Text>
            ),
            labels: { confirm: 'Удалить', cancel: 'Отмена' },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/giveaway/participants/${participant.id}`);
                    setParticipants((prev) => prev.filter((item) => item.id !== participant.id));
                    notifications.show({ color: 'teal', message: 'Участник удалён.' });
                } catch {
                    notifications.show({ color: 'red', message: 'Не удалось удалить участника.' });
                }
            },
        });
    };

    const buildExportRows = () => (
        filteredParticipants.map((participant) => {
            const row = {
                'Дата заявки': formatGiveawayDateTime(participant.createdAt),
                'Номер участника': participant.ticketNumber,
                'Статус': GIVEAWAY_STATUS_LABELS[participant.status] || participant.status,
            };

            settings.fields.forEach((field) => {
                row[field.label] = formatGiveawayValue(participant.formData?.[field.id], field);
            });

            row['Комментарий'] = participant.adminNote || '';
            row['Фото чека'] = resolveGiveawayReceipt(participant.receiptImage);

            return row;
        })
    );

    const exportXlsx = async () => {
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            const rows = buildExportRows();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Участники');
            XLSX.writeFile(workbook, getExportFilename('xlsx'));
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось экспортировать XLSX.' });
        } finally {
            setExporting(false);
        }
    };

    const exportPdf = async () => {
        setExporting(true);
        try {
            const pdfMakeModule = await import('pdfmake/build/pdfmake');
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
            const pdfMake = pdfMakeModule.default || pdfMakeModule;
            const fonts = pdfFontsModule.default || pdfFontsModule;
            pdfMake.vfs = fonts.pdfMake?.vfs || fonts.vfs;

            const rows = buildExportRows();
            const columns = Object.keys(rows[0] || {
                'Дата заявки': '',
                'Номер участника': '',
                'Статус': '',
            }).filter((column) => column !== 'Фото чека');
            const body = [
                columns.map((column) => ({ text: column, style: 'tableHeader' })),
                ...rows.map((row) => columns.map((column) => String(row[column] || ''))),
            ];

            pdfMake.createPdf({
                pageOrientation: 'landscape',
                pageMargins: [24, 28, 24, 28],
                defaultStyle: { font: 'Roboto', fontSize: 8 },
                content: [
                    { text: 'Участники розыгрыша MIKO', style: 'title' },
                    { text: `Экспорт: ${formatGiveawayDateTime(new Date())}`, style: 'meta' },
                    {
                        table: {
                            headerRows: 1,
                            widths: columns.map(() => 'auto'),
                            body,
                        },
                        layout: {
                            fillColor: (rowIndex) => (rowIndex === 0 ? '#0f172a' : null),
                            hLineColor: () => '#d1d5db',
                            vLineColor: () => '#d1d5db',
                            paddingLeft: () => 5,
                            paddingRight: () => 5,
                            paddingTop: () => 4,
                            paddingBottom: () => 4,
                        },
                    },
                ],
                styles: {
                    title: { fontSize: 16, bold: true, margin: [0, 0, 0, 6] },
                    meta: { color: '#64748b', margin: [0, 0, 0, 12] },
                    tableHeader: { color: '#ffffff', bold: true },
                },
            }).download(getExportFilename('pdf'));
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось экспортировать PDF.' });
        } finally {
            setExporting(false);
        }
    };

    const bannerSrc = bannerPreview || resolveGiveawayReceipt(settings.bannerImage);

    if (loading) {
        return (
            <Group justify="center" py="xl">
                <Loader color="miko" />
            </Group>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    <Title order={3} fw={800}>Розыгрыш</Title>
                    <Text size="sm" c="dimmed">
                        Приём чеков, форма участника и база заявок.
                    </Text>
                </Stack>
                <Group gap="xs">
                    <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={loadData}>
                        Обновить
                    </Button>
                    <Button color="miko" leftSection={<IconDownload size={16} />} onClick={saveSettings} loading={savingSettings}>
                        Сохранить настройки
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                <Paper withBorder p="md" radius="lg">
                    <Text size="xs" c="dimmed" fw={700}>Всего заявок</Text>
                    <Title order={2}>{stats.total}</Title>
                </Paper>
                <Paper withBorder p="md" radius="lg">
                    <Text size="xs" c="dimmed" fw={700}>Новые</Text>
                    <Title order={2}>{stats.new}</Title>
                </Paper>
                <Paper withBorder p="md" radius="lg">
                    <Text size="xs" c="dimmed" fw={700}>Подтверждённые</Text>
                    <Title order={2}>{stats.approved}</Title>
                </Paper>
                <Paper withBorder p="md" radius="lg">
                    <Text size="xs" c="dimmed" fw={700}>Отклонённые</Text>
                    <Title order={2}>{stats.rejected}</Title>
                </Paper>
            </SimpleGrid>

            <Tabs defaultValue="participants" color="miko" variant="pills" radius="md">
                <Tabs.List>
                    <Tabs.Tab value="participants" leftSection={<IconTicket size={16} />}>
                        Участники
                    </Tabs.Tab>
                    <Tabs.Tab value="settings" leftSection={<IconEdit size={16} />}>
                        Форма и период
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="participants" pt="md">
                    <Stack gap="md">
                        <Paper withBorder radius="lg" p="md">
                            <Group justify="space-between" align="flex-end" gap="md">
                                <Group grow align="flex-end" style={{ flex: 1 }}>
                                    <TextInput
                                        label="Поиск"
                                        placeholder="Номер, телефон, имя, комментарий"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        radius="md"
                                    />
                                    <Select
                                        label="Статус"
                                        data={GIVEAWAY_STATUS_OPTIONS}
                                        value={statusFilter}
                                        onChange={(value) => setStatusFilter(value || 'all')}
                                        radius="md"
                                    />
                                </Group>
                                <Group gap="xs">
                                    <Button
                                        variant="default"
                                        leftSection={<IconFileSpreadsheet size={16} />}
                                        onClick={exportXlsx}
                                        loading={exporting}
                                    >
                                        XLSX
                                    </Button>
                                    <Button
                                        variant="default"
                                        leftSection={<IconFileTypePdf size={16} />}
                                        onClick={exportPdf}
                                        loading={exporting}
                                    >
                                        PDF
                                    </Button>
                                </Group>
                            </Group>
                        </Paper>

                        <Paper withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
                            <ScrollArea>
                                <Table striped highlightOnHover withColumnBorders miw={980}>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Дата</Table.Th>
                                            <Table.Th>Номер</Table.Th>
                                            <Table.Th>Статус</Table.Th>
                                            {visibleFields.map((field) => (
                                                <Table.Th key={field.id}>{field.label}</Table.Th>
                                            ))}
                                            <Table.Th>Чек</Table.Th>
                                            <Table.Th />
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {filteredParticipants.map((participant) => (
                                            <Table.Tr key={participant.id}>
                                                <Table.Td>{formatGiveawayDateTime(participant.createdAt)}</Table.Td>
                                                <Table.Td>
                                                    <Text fw={700} size="sm">{participant.ticketNumber}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Select
                                                        data={GIVEAWAY_STATUS_OPTIONS.filter((item) => item.value !== 'all')}
                                                        value={participant.status}
                                                        onChange={(value) => quickStatusUpdate(participant, value || 'new')}
                                                        size="xs"
                                                        radius="md"
                                                        w={170}
                                                    />
                                                </Table.Td>
                                                {visibleFields.map((field) => (
                                                    <Table.Td key={field.id}>
                                                        <Text size="sm" lineClamp={2}>
                                                            {formatGiveawayValue(participant.formData?.[field.id], field)}
                                                        </Text>
                                                    </Table.Td>
                                                ))}
                                                <Table.Td>
                                                    <Button
                                                        component="a"
                                                        href={resolveGiveawayReceipt(participant.receiptImage)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        size="xs"
                                                        variant="light"
                                                        color="miko"
                                                    >
                                                        Открыть
                                                    </Button>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Tooltip label="Просмотр">
                                                            <ActionIcon variant="light" color="miko" onClick={() => openParticipant(participant)}>
                                                                <IconEye size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Удалить">
                                                            <ActionIcon variant="light" color="red" onClick={() => confirmDeleteParticipant(participant)}>
                                                                <IconTrash size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                            {filteredParticipants.length === 0 && (
                                <Stack align="center" p="xl" gap="xs">
                                    <Text fw={700}>Заявок не найдено</Text>
                                    <Text size="sm" c="dimmed">Измените фильтр или дождитесь новых чеков.</Text>
                                </Stack>
                            )}
                        </Paper>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="settings" pt="md">
                    <Grid align="flex-start">
                        <Grid.Col span={{ base: 12, lg: 5 }}>
                            <Paper withBorder radius="lg" p="md">
                                <Stack gap="md">
                                    <Title order={4}>Настройки страницы</Title>
                                    <TextInput
                                        label="Заголовок"
                                        value={settings.title}
                                        onChange={(event) => updateSettings({ title: event.target.value })}
                                    />
                                    <Textarea
                                        label="Описание"
                                        minRows={3}
                                        value={settings.description || ''}
                                        onChange={(event) => updateSettings({ description: event.target.value })}
                                    />
                                    <Textarea
                                        label="Условия участия"
                                        minRows={4}
                                        value={settings.rulesText || ''}
                                        onChange={(event) => updateSettings({ rulesText: event.target.value })}
                                    />

                                    <Divider />

                                    <Stack gap="sm">
                                        <Group justify="space-between" align="flex-start">
                                            <Stack gap={2}>
                                                <Text fw={700}>Баннер розыгрыша</Text>
                                                <Text size="sm" c="dimmed">
                                                    Горизонтальное изображение 16:9, показывается слева на ПК и сверху на мобильной.
                                                </Text>
                                            </Stack>
                                            {bannerSrc && (
                                                <Button variant="subtle" color="red" size="xs" onClick={removeBanner}>
                                                    Удалить
                                                </Button>
                                            )}
                                        </Group>

                                        <AspectRatio ratio={16 / 9}>
                                            {bannerSrc ? (
                                                <Image
                                                    src={bannerSrc}
                                                    alt="Баннер розыгрыша"
                                                    radius="md"
                                                    fit="cover"
                                                />
                                            ) : (
                                                <Box
                                                    style={{
                                                        border: '1px dashed var(--mantine-color-gray-4)',
                                                        borderRadius: 'var(--mantine-radius-md)',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        color: 'var(--mantine-color-gray-6)',
                                                        background: 'var(--mantine-color-gray-0)',
                                                    }}
                                                >
                                                    <Stack align="center" gap={6}>
                                                        <IconPhoto size={28} />
                                                        <Text size="sm">Баннер не загружен</Text>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </AspectRatio>

                                        <Group gap="xs" align="flex-end">
                                            <label>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg"
                                                    onChange={handleBannerChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <Button
                                                    component="span"
                                                    variant="default"
                                                    leftSection={<IconUpload size={16} />}
                                                >
                                                    Загрузить 16:9
                                                </Button>
                                            </label>
                                        </Group>

                                        <TextInput
                                            label="Ссылка при клике"
                                            placeholder="/catalog или https://..."
                                            value={settings.bannerLink || ''}
                                            onChange={(event) => updateSettings({ bannerLink: event.target.value })}
                                        />
                                    </Stack>

                                    <Divider />

                                    <Stack gap="sm">
                                        <Text fw={700}>Приём чеков</Text>
                                        <SegmentedControl
                                            value={settings.usePeriod ? 'period' : 'manual'}
                                            onChange={(value) => updateSettings({ usePeriod: value === 'period' })}
                                            data={[
                                                { value: 'manual', label: 'Без периода' },
                                                { value: 'period', label: 'По периоду' },
                                            ]}
                                            color="miko"
                                            radius="md"
                                        />

                                        {settings.usePeriod ? (
                                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                                <DateTimePicker
                                                    label="Начало"
                                                    value={settings.startsAt}
                                                    onChange={(value) => updateSettings({ startsAt: value })}
                                                    radius="md"
                                                    clearable
                                                />
                                                <DateTimePicker
                                                    label="Окончание"
                                                    value={settings.endsAt}
                                                    onChange={(value) => updateSettings({ endsAt: value })}
                                                    radius="md"
                                                    clearable
                                                />
                                            </SimpleGrid>
                                        ) : (
                                            <Checkbox
                                                label="Принимать чеки сейчас"
                                                checked={Boolean(settings.isActive)}
                                                onChange={(event) => updateSettings({ isActive: event.currentTarget.checked })}
                                            />
                                        )}
                                    </Stack>

                                    <Divider />

                                    <TextInput
                                        label="Заголовок после отправки"
                                        value={settings.successTitle}
                                        onChange={(event) => updateSettings({ successTitle: event.target.value })}
                                    />
                                    <Textarea
                                        label="Текст после отправки"
                                        minRows={3}
                                        value={settings.successText || ''}
                                        onChange={(event) => updateSettings({ successText: event.target.value })}
                                    />
                                </Stack>
                            </Paper>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, lg: 7 }}>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Stack gap={2}>
                                        <Title order={4}>Конструктор формы</Title>
                                        <Text size="sm" c="dimmed">
                                            Поля отображаются на странице розыгрыша в этом порядке.
                                        </Text>
                                    </Stack>
                                    <Button leftSection={<IconPlus size={16} />} color="miko" onClick={addField}>
                                        Поле
                                    </Button>
                                </Group>

                                {settings.fields.map((field, index) => {
                                    const usesOptions = OPTION_FIELD_TYPES.includes(field.type);

                                    return (
                                        <Card key={field.id || index} withBorder radius="lg" p="md">
                                            <Stack gap="md">
                                                <Group justify="space-between" align="center">
                                                    <Group gap="xs">
                                                        <Badge color="miko" variant="light">
                                                            {index + 1}
                                                        </Badge>
                                                        <Text fw={700}>{field.label || 'Новое поле'}</Text>
                                                        <Text size="sm" c="dimmed">{getFieldTypeLabel(field.type)}</Text>
                                                    </Group>
                                                    <Group gap="xs">
                                                        <ActionIcon variant="light" onClick={() => moveField(index, -1)} disabled={index === 0}>
                                                            <IconArrowUp size={16} />
                                                        </ActionIcon>
                                                        <ActionIcon variant="light" onClick={() => moveField(index, 1)} disabled={index === settings.fields.length - 1}>
                                                            <IconArrowDown size={16} />
                                                        </ActionIcon>
                                                        <ActionIcon variant="light" color="red" onClick={() => removeField(index)}>
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>

                                                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                                    <Select
                                                        label="Тип"
                                                        data={GIVEAWAY_FIELD_TYPES}
                                                        value={field.type}
                                                        onChange={(value) => updateField(index, {
                                                            type: value || 'text',
                                                            options: OPTION_FIELD_TYPES.includes(value) ? field.options : [],
                                                        })}
                                                    />
                                                    <TextInput
                                                        label="Название"
                                                        value={field.label}
                                                        onChange={(event) => updateField(index, { label: event.target.value })}
                                                    />
                                                </SimpleGrid>

                                                <TextInput
                                                    label="Подсказка"
                                                    value={field.placeholder || ''}
                                                    onChange={(event) => updateField(index, { placeholder: event.target.value })}
                                                />

                                                {usesOptions && (
                                                    <Textarea
                                                        label="Варианты ответа"
                                                        description="Каждый вариант с новой строки"
                                                        minRows={3}
                                                        value={optionsToText(field.options)}
                                                        onChange={(event) => updateField(index, {
                                                            options: normalizeOptionsText(event.target.value),
                                                        })}
                                                    />
                                                )}

                                                <Group gap="lg">
                                                    <Checkbox
                                                        label="Обязательное"
                                                        checked={Boolean(field.required)}
                                                        onChange={(event) => updateField(index, { required: event.currentTarget.checked })}
                                                    />
                                                    <Checkbox
                                                        label="Показывать в таблице"
                                                        checked={field.showInTable !== false}
                                                        onChange={(event) => updateField(index, { showInTable: event.currentTarget.checked })}
                                                    />
                                                </Group>
                                            </Stack>
                                        </Card>
                                    );
                                })}

                                {settings.fields.length === 0 && (
                                    <Paper withBorder radius="lg" p="xl">
                                        <Stack align="center" gap="xs">
                                            <Text fw={700}>Полей пока нет</Text>
                                            <Text size="sm" c="dimmed">Добавьте хотя бы имя и телефон участника.</Text>
                                            <Button color="miko" leftSection={<IconPlus size={16} />} onClick={addField}>
                                                Добавить поле
                                            </Button>
                                        </Stack>
                                    </Paper>
                                )}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>
            </Tabs>

            <Modal
                opened={Boolean(selectedParticipant)}
                onClose={() => setSelectedParticipant(null)}
                title={selectedParticipant?.ticketNumber || 'Участник'}
                size="xl"
                radius="lg"
            >
                {selectedParticipant && (
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <Stack gap="sm">
                                <Image
                                    src={resolveGiveawayReceipt(selectedParticipant.receiptImage)}
                                    alt="Чек участника"
                                    radius="md"
                                    fit="cover"
                                    mah={460}
                                />
                                <Button
                                    component="a"
                                    href={resolveGiveawayReceipt(selectedParticipant.receiptImage)}
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="default"
                                >
                                    Открыть оригинал
                                </Button>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Stack gap="md">
                                <Group gap="xs">
                                    <Badge color={GIVEAWAY_STATUS_COLORS[selectedParticipant.status] || 'gray'}>
                                        {GIVEAWAY_STATUS_LABELS[selectedParticipant.status] || selectedParticipant.status}
                                    </Badge>
                                    <Text size="sm" c="dimmed">
                                        {formatGiveawayDateTime(selectedParticipant.createdAt)}
                                    </Text>
                                </Group>

                                <Box>
                                    <Text size="sm" c="dimmed" fw={700}>Данные формы</Text>
                                    <Table mt="xs" withRowBorders={false}>
                                        <Table.Tbody>
                                            {settings.fields.map((field) => (
                                                <Table.Tr key={field.id}>
                                                    <Table.Td w={220}>
                                                        <Text size="sm" c="dimmed">{field.label}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" fw={600}>
                                                            {formatGiveawayValue(selectedParticipant.formData?.[field.id], field)}
                                                        </Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Box>

                                <Select
                                    label="Статус"
                                    data={GIVEAWAY_STATUS_OPTIONS.filter((item) => item.value !== 'all')}
                                    value={participantDraft.status}
                                    onChange={(value) => setParticipantDraft((prev) => ({ ...prev, status: value || 'new' }))}
                                />
                                <Textarea
                                    label="Комментарий администратора"
                                    minRows={4}
                                    value={participantDraft.adminNote}
                                    onChange={(event) => setParticipantDraft((prev) => ({ ...prev, adminNote: event.target.value }))}
                                />
                                <Group justify="flex-end">
                                    <Button variant="default" onClick={() => setSelectedParticipant(null)}>
                                        Закрыть
                                    </Button>
                                    <Button color="miko" onClick={saveParticipant}>
                                        Сохранить
                                    </Button>
                                </Group>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                )}
            </Modal>
        </Stack>
    );
};

export default GiveawayAdminPage;
