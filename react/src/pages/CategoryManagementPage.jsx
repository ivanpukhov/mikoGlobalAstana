import { useEffect, useMemo, useState } from 'react';
import {
    ActionIcon,
    Button,
    Card,
    Group,
    Modal,
    ScrollArea,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCategory, IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import api from '../api/api';
import { findTablerIcon, TABLER_ICON_OPTIONS } from '../utils/tablerIcons';

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoryEdit, setCategoryEdit] = useState({ open: false, id: null, name: '', icon: '' });
    const [categoryDelete, setCategoryDelete] = useState({ open: false, id: null, targetCategoryId: null });
    const [subcategoryEdit, setSubcategoryEdit] = useState({ open: false, id: null, name: '' });
    const [subcategoryDelete, setSubcategoryDelete] = useState({ open: false, id: null, categoryId: null, targetSubcategoryId: null });
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/categories/admin/summary');
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            notifications.show({ color: 'red', message: 'Не удалось загрузить категории.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const categoryOptions = useMemo(
        () => categories.map((category) => ({ value: String(category.id), label: category.name })),
        [categories]
    );

    const selectedSubcategoryOptions = useMemo(() => {
        const category = categories.find((item) => item.id === subcategoryDelete.categoryId);
        return (category?.subcategories || [])
            .filter((subcategory) => subcategory.id !== subcategoryDelete.id)
            .map((subcategory) => ({
                value: String(subcategory.id),
                label: subcategory.name,
            }));
    }, [categories, subcategoryDelete.categoryId, subcategoryDelete.id]);

    const saveCategory = async () => {
        try {
            await api.patch(`/categories/${categoryEdit.id}`, {
                name: categoryEdit.name,
                icon: categoryEdit.icon || null,
            });
            notifications.show({ color: 'teal', message: 'Категория обновлена.' });
            setCategoryEdit({ open: false, id: null, name: '', icon: '' });
            fetchSummary();
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.message || 'Ошибка обновления категории.' });
        }
    };

    const removeCategory = async () => {
        try {
            await api.delete(`/categories/${categoryDelete.id}`, {
                data: { targetCategoryId: categoryDelete.targetCategoryId },
            });
            notifications.show({ color: 'teal', message: 'Категория удалена, товары перенесены.' });
            setCategoryDelete({ open: false, id: null, targetCategoryId: null });
            fetchSummary();
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.message || 'Ошибка удаления категории.' });
        }
    };

    const saveSubcategory = async () => {
        try {
            await api.patch(`/categories/subcategories/${subcategoryEdit.id}`, { name: subcategoryEdit.name });
            notifications.show({ color: 'teal', message: 'Подкатегория обновлена.' });
            setSubcategoryEdit({ open: false, id: null, name: '' });
            fetchSummary();
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.message || 'Ошибка обновления подкатегории.' });
        }
    };

    const removeSubcategory = async () => {
        try {
            await api.delete(`/categories/subcategories/${subcategoryDelete.id}`, {
                data: { targetSubcategoryId: subcategoryDelete.targetSubcategoryId },
            });
            notifications.show({ color: 'teal', message: 'Подкатегория удалена, товары перенесены.' });
            setSubcategoryDelete({ open: false, id: null, categoryId: null, targetSubcategoryId: null });
            fetchSummary();
        } catch (error) {
            notifications.show({ color: 'red', message: error.response?.data?.message || 'Ошибка удаления подкатегории.' });
        }
    };

    const filteredIcons = useMemo(() => {
        const query = iconSearch.trim().toLowerCase();

        if (!query) {
            return TABLER_ICON_OPTIONS;
        }

        return TABLER_ICON_OPTIONS.filter(([name]) => name.toLowerCase().includes(query));
    }, [iconSearch]);

    const SelectedCategoryIcon = findTablerIcon(categoryEdit.icon);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Категории и подкатегории</Title>
                <Button variant="light" color="miko" radius="md" onClick={fetchSummary} loading={loading}>
                    Обновить
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                {categories.map((category) => (
                    <Card key={category.id} withBorder radius="xl" p="lg">
                        <Stack gap="md">
                            <Group justify="space-between" align="flex-start">
                                <Stack gap={2}>
                                    <Group gap="sm" wrap="nowrap">
                                        {(() => {
                                            const CategoryIcon = findTablerIcon(category.icon);

                                            return CategoryIcon ? (
                                            <ActionIcon variant="light" color="miko" radius="xl" size="lg">
                                                <CategoryIcon size={18} />
                                            </ActionIcon>
                                            ) : null;
                                        })()}
                                        <Title order={4}>{category.name}</Title>
                                    </Group>
                                    <Text size="sm" c="dimmed">
                                        Товаров: {category.productCount}. Подкатегорий: {category.subcategoryCount}. Без подкатегории: {category.unassignedProductCount}
                                    </Text>
                                </Stack>
                                <Group gap="xs">
                                    <ActionIcon
                                        variant="light"
                                        color="miko"
                                        radius="md"
                                        onClick={() => setCategoryEdit({
                                            open: true,
                                            id: category.id,
                                            name: category.name,
                                            icon: category.icon || '',
                                        })}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        radius="md"
                                        onClick={() =>
                                            setCategoryDelete({
                                                open: true,
                                                id: category.id,
                                                targetCategoryId: categoryOptions.find((item) => item.value !== String(category.id))?.value || null,
                                            })
                                        }
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Group>

                            <Stack gap="xs">
                                {(category.subcategories || []).map((subcategory) => (
                                    <Card key={subcategory.id} radius="lg" withBorder p="md" bg="gray.0">
                                        <Group justify="space-between" align="center">
                                            <Stack gap={0}>
                                                <Text fw={700}>{subcategory.name}</Text>
                                                <Text size="sm" c="dimmed">Товаров: {subcategory.productCount}</Text>
                                            </Stack>
                                            <Group gap="xs">
                                                <ActionIcon
                                                    variant="light"
                                                    color="miko"
                                                    radius="md"
                                                    onClick={() =>
                                                        setSubcategoryEdit({
                                                            open: true,
                                                            id: subcategory.id,
                                                            name: subcategory.name,
                                                        })
                                                    }
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    radius="md"
                                                    disabled={(category.subcategories || []).length < 2}
                                                    onClick={() =>
                                                        setSubcategoryDelete({
                                                            open: true,
                                                            id: subcategory.id,
                                                            categoryId: category.id,
                                                            targetSubcategoryId:
                                                                (category.subcategories || []).find((item) => item.id !== subcategory.id)?.id?.toString() || null,
                                                        })
                                                    }
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            <Modal
                opened={categoryEdit.open}
                onClose={() => setCategoryEdit({ open: false, id: null, name: '', icon: '' })}
                title="Изменить категорию"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Название категории"
                        value={categoryEdit.name}
                        onChange={(event) => setCategoryEdit((prev) => ({ ...prev, name: event.currentTarget.value }))}
                        radius="md"
                    />
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>Иконка категории</Text>
                        <Group gap="sm" wrap="nowrap">
                            <ActionIcon variant="light" color="miko" radius="xl" size="xl">
                                {SelectedCategoryIcon ? (
                                    <SelectedCategoryIcon size={20} />
                                ) : (
                                    <IconCategory size={18} />
                                )}
                            </ActionIcon>
                            <Button
                                variant="light"
                                color="miko"
                                radius="md"
                                onClick={() => setIconPickerOpen(true)}
                            >
                                Выбрать иконку
                            </Button>
                            {categoryEdit.icon ? (
                                <Button
                                    variant="default"
                                    radius="md"
                                    onClick={() => setCategoryEdit((prev) => ({ ...prev, icon: '' }))}
                                >
                                    Сбросить
                                </Button>
                            ) : null}
                        </Group>
                        <Text size="xs" c="dimmed">
                            В каталоге будет отображаться выбранная иконка. Если не выбрать, останется автоопределение по названию.
                        </Text>
                    </Stack>
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setCategoryEdit({ open: false, id: null, name: '', icon: '' })}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={saveCategory}>Сохранить</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={categoryDelete.open}
                onClose={() => setCategoryDelete({ open: false, id: null, targetCategoryId: null })}
                title="Удалить категорию"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <Text size="sm">Выберите категорию, в которую нужно перенести товары перед удалением.</Text>
                    <Select
                        label="Перенести товары в категорию"
                        value={categoryDelete.targetCategoryId}
                        onChange={(value) => setCategoryDelete((prev) => ({ ...prev, targetCategoryId: value }))}
                        data={categoryOptions.filter((item) => item.value !== String(categoryDelete.id))}
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setCategoryDelete({ open: false, id: null, targetCategoryId: null })}>Отмена</Button>
                        <Button color="red" radius="md" onClick={removeCategory}>Удалить</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={subcategoryEdit.open}
                onClose={() => setSubcategoryEdit({ open: false, id: null, name: '' })}
                title="Изменить подкатегорию"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Название подкатегории"
                        value={subcategoryEdit.name}
                        onChange={(event) => setSubcategoryEdit((prev) => ({ ...prev, name: event.currentTarget.value }))}
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setSubcategoryEdit({ open: false, id: null, name: '' })}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={saveSubcategory}>Сохранить</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={subcategoryDelete.open}
                onClose={() => setSubcategoryDelete({ open: false, id: null, categoryId: null, targetSubcategoryId: null })}
                title="Удалить подкатегорию"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <Text size="sm">Выберите подкатегорию этой категории, в которую нужно перенести товары.</Text>
                    <Select
                        label="Перенести товары в подкатегорию"
                        value={subcategoryDelete.targetSubcategoryId}
                        onChange={(value) => setSubcategoryDelete((prev) => ({ ...prev, targetSubcategoryId: value }))}
                        data={selectedSubcategoryOptions}
                        radius="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setSubcategoryDelete({ open: false, id: null, categoryId: null, targetSubcategoryId: null })}>Отмена</Button>
                        <Button color="red" radius="md" onClick={removeSubcategory}>Удалить</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={iconPickerOpen}
                onClose={() => {
                    setIconPickerOpen(false);
                    setIconSearch('');
                }}
                title="Выберите иконку категории"
                centered
                radius="lg"
                size="xl"
            >
                <Stack gap="md">
                    <TextInput
                        placeholder="Поиск по названию иконки, например IconHome"
                        value={iconSearch}
                        onChange={(event) => setIconSearch(event.currentTarget.value)}
                        leftSection={<IconSearch size={16} />}
                        radius="md"
                    />

                    <ScrollArea h={420}>
                        {filteredIcons.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                По вашему запросу иконки не найдены.
                            </Text>
                        ) : (
                            <SimpleGrid cols={{ base: 3, xs: 4, sm: 5, md: 6, lg: 7 }} spacing="sm">
                                {filteredIcons.map(([iconName, Icon]) => (
                                    <Button
                                        key={iconName}
                                        variant={categoryEdit.icon === iconName ? 'filled' : 'light'}
                                        color="miko"
                                        radius="lg"
                                        h={86}
                                        p="xs"
                                        onClick={() => {
                                            setCategoryEdit((prev) => ({ ...prev, icon: iconName }));
                                            setIconPickerOpen(false);
                                            setIconSearch('');
                                        }}
                                    >
                                        <Stack gap={6} align="center">
                                            <Icon size={22} />
                                            <Text size="xs" ta="center" lineClamp={2}>
                                                {iconName}
                                            </Text>
                                        </Stack>
                                    </Button>
                                ))}
                            </SimpleGrid>
                        )}
                    </ScrollArea>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default CategoryManagementPage;
