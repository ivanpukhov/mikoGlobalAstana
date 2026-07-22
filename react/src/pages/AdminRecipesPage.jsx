import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionIcon, Badge, Button, Card, Group, Image, Loader, Menu, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconEdit, IconEye, IconPlus, IconTrash } from '@tabler/icons-react';
import api from '../api/api';
import { resolveImage } from '../utils/resolveImage';

export default function AdminRecipesPage() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = () => api.get('/recipes/admin').then(({ data }) => setRecipes(data || [])).catch(() => notifications.show({ color: 'red', message: 'Не удалось загрузить рецепты.' })).finally(() => setLoading(false));
    useEffect(load, []);

    const remove = async (recipe) => {
        if (!window.confirm(`Удалить рецепт «${recipe.title}»?`)) return;
        try { await api.delete(`/recipes/admin/${recipe.id}`); notifications.show({ color: 'teal', message: 'Рецепт удалён.' }); load(); }
        catch { notifications.show({ color: 'red', message: 'Не удалось удалить рецепт.' }); }
    };

    return <Stack gap="lg">
        <Group justify="space-between"><div><Title order={2}>Рецепты</Title><Text c="dimmed">Контент, ингредиенты и публикация</Text></div><Button component={Link} to="/admin/recipes/create" color="miko" leftSection={<IconPlus size={18} />}>Новый рецепт</Button></Group>
        {loading ? <Group justify="center" py={70}><Loader color="miko" /></Group> : recipes.length === 0 ? <Card p={40} withBorder><Stack align="center"><Title order={3}>Рецептов пока нет</Title><Text c="dimmed">Создайте первый рецепт и опубликуйте его на сайте.</Text><Button component={Link} to="/admin/recipes/create" color="miko">Создать рецепт</Button></Stack></Card> :
            <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
                {recipes.map((recipe) => <Card key={recipe.id} withBorder p="sm">
                    <Card.Section><Image src={resolveImage(recipe.image)} h={190} alt={recipe.title} /></Card.Section>
                    <Stack p="sm" gap="sm">
                        <Group justify="space-between" align="flex-start" wrap="nowrap"><div><Group gap="xs"><Badge color={recipe.isPublished ? 'teal' : 'gray'}>{recipe.isPublished ? 'Опубликован' : 'Черновик'}</Badge>{recipe.isFeatured && <Badge color="yellow">Избранный</Badge>}</Group><Title order={4} mt="xs" lineClamp={2}>{recipe.title}</Title><Text c="dimmed" size="sm">{recipe.category} · обновлён {new Date(recipe.updatedAt).toLocaleDateString('ru-RU')}</Text></div>
                            <Menu position="bottom-end"><Menu.Target><ActionIcon variant="subtle" color="gray"><IconDotsVertical /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item component={Link} to={`/admin/recipes/edit/${recipe.id}`} leftSection={<IconEdit size={16} />}>Редактировать</Menu.Item>{recipe.isPublished && <Menu.Item component={Link} to={`/recipes/${recipe.slug}`} target="_blank" leftSection={<IconEye size={16} />}>Открыть на сайте</Menu.Item>}<Menu.Divider/><Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => remove(recipe)}>Удалить</Menu.Item></Menu.Dropdown></Menu>
                        </Group>
                        <Button component={Link} to={`/admin/recipes/edit/${recipe.id}`} variant="light" color="miko">Открыть редактор</Button>
                    </Stack>
                </Card>)}
            </SimpleGrid>}
    </Stack>;
}
