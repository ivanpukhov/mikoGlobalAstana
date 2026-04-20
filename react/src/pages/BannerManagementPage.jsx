import { useEffect, useMemo, useState } from 'react';
import {
    ActionIcon,
    AspectRatio,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Image,
    Loader,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Textarea,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPhoto, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import api from '../api/api';
import {
    BANNER_TYPE_OPTIONS,
    TEXT_BANNER_BACKGROUNDS,
    getBannerBackgroundStyle,
} from '../utils/bannerPresets';

const INITIAL_FORM = {
    id: null,
    type: 'text',
    title: '',
    description: '',
    linkUrl: '',
    buttonText: '',
    buttonLink: '',
    background: 'sunset',
    sortOrder: 0,
};

const resolveBannerImage = (image) => {
    if (!image) {
        return '';
    }

    if (image.startsWith('http')) {
        return image;
    }

    return `/api${image}`;
};

const TYPE_LABELS = {
    image: 'Изображение',
    image_link: 'Изображение со ссылкой',
    text: 'Текстовый',
};

const BannerManagementPage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const backgroundOptions = useMemo(
        () => TEXT_BANNER_BACKGROUNDS.map((item) => ({ value: item.value, label: item.label })),
        []
    );

    const loadBanners = async () => {
        setLoading(true);

        try {
            const { data } = await api.get('/banners');
            setBanners(Array.isArray(data) ? data : []);
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось загрузить баннеры.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setImageFile(null);
        setImagePreview('');
    };

    const openCreate = () => {
        setForm({ ...INITIAL_FORM, sortOrder: banners.length });
        setImageFile(null);
        setImagePreview('');
        setModalOpened(true);
    };

    const openEdit = (banner) => {
        setForm({
            id: banner.id,
            type: banner.type || 'text',
            title: banner.title || '',
            description: banner.description || '',
            linkUrl: banner.linkUrl || '',
            buttonText: banner.buttonText || '',
            buttonLink: banner.buttonLink || '',
            background: banner.background || 'sunset',
            sortOrder: Number(banner.sortOrder || 0),
        });
        setImageFile(null);
        setImagePreview(resolveBannerImage(banner.image));
        setModalOpened(true);
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const saveBanner = async () => {
        const formData = new FormData();
        formData.append('type', form.type);
        formData.append('title', form.title || '');
        formData.append('description', form.description || '');
        formData.append('linkUrl', form.linkUrl || '');
        formData.append('buttonText', form.buttonText || '');
        formData.append('buttonLink', form.buttonLink || '');
        formData.append('background', form.background || 'sunset');
        formData.append('sortOrder', String(form.sortOrder || 0));

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (form.id) {
                await api.put(`/banners/${form.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                notifications.show({ color: 'teal', message: 'Баннер обновлён.' });
            } else {
                await api.post('/banners', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                notifications.show({ color: 'teal', message: 'Баннер добавлен.' });
            }

            setModalOpened(false);
            resetForm();
            loadBanners();
        } catch (error) {
            notifications.show({
                color: 'red',
                message: error.response?.data?.error || 'Не удалось сохранить баннер.',
            });
        }
    };

    const removeBanner = async (id) => {
        try {
            await api.delete(`/banners/${id}`);
            notifications.show({ color: 'teal', message: 'Баннер удалён.' });
            loadBanners();
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось удалить баннер.' });
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Баннеры на главной</Title>
                <Button
                    color="miko"
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={openCreate}
                >
                    Добавить баннер
                </Button>
            </Group>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : banners.length === 0 ? (
                <Card withBorder radius="xl" p="xl">
                    <Stack gap="xs" align="flex-start">
                        <Badge radius="xl" variant="light" color="miko">Пока пусто</Badge>
                        <Title order={4}>Баннеров ещё нет</Title>
                        <Text c="dimmed">
                            Добавьте первый баннер для главной страницы. Если список пуст,
                            на сайте автоматически покажется текстовая приветственная заглушка.
                        </Text>
                        <Button
                            color="miko"
                            radius="md"
                            leftSection={<IconPlus size={16} />}
                            onClick={openCreate}
                            mt="sm"
                        >
                            Создать баннер
                        </Button>
                    </Stack>
                </Card>
            ) : (
                <>
                    <Table striped highlightOnHover withTableBorder radius="md" visibleFrom="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Порядок</Table.Th>
                                <Table.Th>Тип</Table.Th>
                                <Table.Th>Содержимое</Table.Th>
                                <Table.Th>Превью</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {banners.map((banner) => (
                                <Table.Tr key={banner.id}>
                                    <Table.Td>{banner.sortOrder}</Table.Td>
                                    <Table.Td>
                                        <Badge radius="xl" variant="light" color="miko">
                                            {TYPE_LABELS[banner.type] || banner.type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Text fw={700}>{banner.title || 'Без названия'}</Text>
                                            <Text size="sm" c="dimmed" lineClamp={2}>
                                                {banner.type === 'text'
                                                    ? banner.description || 'Текстовый баннер без описания'
                                                    : banner.linkUrl || 'Без ссылки'}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Box w={180}>
                                            <AspectRatio ratio={2.08}>
                                                {banner.type === 'text' ? (
                                                    <Box
                                                        style={{
                                                            background: getBannerBackgroundStyle(banner.background),
                                                            borderRadius: 12,
                                                            color: '#fff',
                                                            padding: 12,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'flex-end',
                                                        }}
                                                    >
                                                        <Text fw={700} lineClamp={2}>{banner.title}</Text>
                                                    </Box>
                                                ) : (
                                                    <Image
                                                        src={resolveBannerImage(banner.image)}
                                                        alt={banner.title || 'Баннер'}
                                                        radius="md"
                                                        fit="cover"
                                                    />
                                                )}
                                            </AspectRatio>
                                        </Box>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="miko" radius="md" onClick={() => openEdit(banner)}>
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" radius="md" onClick={() => removeBanner(banner.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Stack gap="sm" hiddenFrom="sm">
                        {banners.map((banner) => (
                            <Card key={banner.id} withBorder radius="xl" p="md">
                                <Stack gap="sm">
                                    <AspectRatio ratio={2.08}>
                                        {banner.type === 'text' ? (
                                            <Box
                                                style={{
                                                    background: getBannerBackgroundStyle(banner.background),
                                                    borderRadius: 18,
                                                    color: '#fff',
                                                    padding: 16,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Text fw={700}>{banner.title}</Text>
                                                {!!banner.description && (
                                                    <Text size="sm" mt={4} lineClamp={2}>
                                                        {banner.description}
                                                    </Text>
                                                )}
                                            </Box>
                                        ) : (
                                            <Image
                                                src={resolveBannerImage(banner.image)}
                                                alt={banner.title || 'Баннер'}
                                                radius="xl"
                                                fit="cover"
                                            />
                                        )}
                                    </AspectRatio>

                                    <Group justify="space-between" align="flex-start">
                                        <Stack gap={2}>
                                            <Badge radius="xl" variant="light" color="miko" w="fit-content">
                                                {TYPE_LABELS[banner.type] || banner.type}
                                            </Badge>
                                            <Text fw={700}>{banner.title || 'Без названия'}</Text>
                                            <Text size="sm" c="dimmed">
                                                Порядок: {banner.sortOrder}
                                            </Text>
                                        </Stack>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="miko" radius="md" onClick={() => openEdit(banner)}>
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" radius="md" onClick={() => removeBanner(banner.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                </>
            )}

            <Modal
                opened={modalOpened}
                onClose={() => {
                    setModalOpened(false);
                    resetForm();
                }}
                title={form.id ? 'Изменить баннер' : 'Добавить баннер'}
                centered
                radius="lg"
                size="lg"
            >
                <Stack gap="md">
                    <Select
                        label="Тип баннера"
                        data={BANNER_TYPE_OPTIONS}
                        value={form.type}
                        onChange={(value) => setForm((prev) => ({ ...prev, type: value || 'text' }))}
                        radius="md"
                    />

                    <TextInput
                        label={form.type === 'text' ? 'Заголовок' : 'Название в админке'}
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        radius="md"
                    />

                    <NumberInput
                        label="Порядок показа"
                        min={0}
                        value={form.sortOrder}
                        onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: Number(value) || 0 }))}
                        radius="md"
                    />

                    {form.type === 'text' ? (
                        <>
                            <Select
                                label="Фон"
                                data={backgroundOptions}
                                value={form.background}
                                onChange={(value) => setForm((prev) => ({ ...prev, background: value || 'sunset' }))}
                                radius="md"
                            />
                            <Textarea
                                label="Описание"
                                minRows={3}
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                radius="md"
                            />
                            <Group grow>
                                <TextInput
                                    label="Текст кнопки"
                                    value={form.buttonText}
                                    onChange={(event) => setForm((prev) => ({ ...prev, buttonText: event.target.value }))}
                                    radius="md"
                                />
                                <TextInput
                                    label="Ссылка кнопки"
                                    placeholder="/categories или https://..."
                                    value={form.buttonLink}
                                    onChange={(event) => setForm((prev) => ({ ...prev, buttonLink: event.target.value }))}
                                    radius="md"
                                />
                            </Group>
                        </>
                    ) : (
                        <>
                            <Stack gap={4}>
                                <Text size="sm" fw={500}>Изображение</Text>
                                <label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleImageChange}
                                    />
                                    <Button
                                        component="span"
                                        leftSection={<IconUpload size={16} />}
                                        variant="default"
                                        radius="md"
                                    >
                                        Загрузить изображение
                                    </Button>
                                </label>
                                <Text size="xs" c="dimmed">
                                    Рекомендуется широкое изображение с пропорцией как у текущего слайдера.
                                </Text>
                            </Stack>

                            {form.type === 'image_link' && (
                                <TextInput
                                    label="Ссылка при клике"
                                    placeholder="/gift-certificates или https://..."
                                    value={form.linkUrl}
                                    onChange={(event) => setForm((prev) => ({ ...prev, linkUrl: event.target.value }))}
                                    radius="md"
                                />
                            )}
                        </>
                    )}

                    <Stack gap="xs">
                        <Text size="sm" fw={500}>Предпросмотр</Text>
                        <AspectRatio ratio={2.08}>
                            {form.type === 'text' ? (
                                <Box
                                    style={{
                                        background: getBannerBackgroundStyle(form.background),
                                        borderRadius: 18,
                                        padding: 20,
                                        color: '#fff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Stack gap={8} maw="80%">
                                        <Badge radius="xl" color="white" variant="filled" w="fit-content" c="dark">
                                            Текстовый баннер
                                        </Badge>
                                        <Text fw={800} fz={24}>{form.title || 'Заголовок баннера'}</Text>
                                        <Text size="sm">
                                            {form.description || 'Здесь будет описание текстового слайда.'}
                                        </Text>
                                    </Stack>
                                    {!!form.buttonText && (
                                        <Box
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 'fit-content',
                                                padding: '10px 16px',
                                                borderRadius: 12,
                                                background: 'rgba(255, 255, 255, 0.92)',
                                                color: '#111827',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {form.buttonText}
                                        </Box>
                                    )}
                                </Box>
                            ) : imagePreview ? (
                                <Image src={imagePreview} alt="Предпросмотр баннера" radius="xl" fit="cover" />
                            ) : (
                                <Box
                                    style={{
                                        borderRadius: 18,
                                        background: 'var(--mantine-color-gray-1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--mantine-color-gray-6)',
                                        flexDirection: 'column',
                                        gap: 8,
                                    }}
                                >
                                    <IconPhoto size={28} />
                                    <Text size="sm">Предпросмотр появится после загрузки</Text>
                                </Box>
                            )}
                        </AspectRatio>
                    </Stack>

                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            radius="md"
                            onClick={() => {
                                setModalOpened(false);
                                resetForm();
                            }}
                        >
                            Отмена
                        </Button>
                        <Button color="miko" radius="md" onClick={saveBanner}>
                            Сохранить
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default BannerManagementPage;
