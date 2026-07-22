import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Group, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconChefHat, IconClock, IconToolsKitchen2 } from '@tabler/icons-react';
import api from '../api/api';
import { resolveImage } from '../utils/resolveImage';
import classes from './Recipes.module.css';

const difficulty = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };

export default function RecipesPage() {
    const [recipes, setRecipes] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Все');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/recipes').then(({ data }) => setRecipes(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
    }, []);

    const categories = useMemo(() => ['Все', ...new Set(recipes.map((item) => item.category).filter(Boolean))], [recipes]);
    const visible = activeCategory === 'Все' ? recipes : recipes.filter((item) => item.category === activeCategory);

    return (
        <Box className={classes.page}>
            <section className={classes.hero}>
                <div className={classes.heroGlow} />
                <Stack gap="md" className={classes.heroContent}>
                    <Badge variant="white" color="dark" size="lg" leftSection={<IconChefHat size={15} />}>Готовим с Miko</Badge>
                    <Title order={1}>Рецепты, которые хочется повторить</Title>
                    <Text>Понятные блюда на каждый день, красивые идеи для гостей и точные списки ингредиентов.</Text>
                </Stack>
            </section>

            <Group gap="sm" className={classes.filters}>
                {categories.map((category) => (
                    <Button key={category} radius="xl" variant={category === activeCategory ? 'filled' : 'white'} color="miko" onClick={() => setActiveCategory(category)}>
                        {category}
                    </Button>
                ))}
            </Group>

            {loading ? <Text ta="center" py={60}>Загружаем рецепты…</Text> : visible.length === 0 ? (
                <Stack align="center" py={70}><IconToolsKitchen2 size={48} color="#0bc3af" /><Title order={3}>Скоро здесь появятся рецепты</Title></Stack>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                    {visible.map((recipe) => (
                        <Link to={`/recipes/${recipe.slug}`} key={recipe.id} className={classes.card}>
                            <Box className={classes.imageWrap}>
                                <Image src={resolveImage(recipe.image)} alt={recipe.title} className={classes.image} />
                                <Badge className={classes.category} variant="white" color="dark">{recipe.category}</Badge>
                                {recipe.isFeatured && <Badge className={classes.featured} color="yellow">Выбор Miko</Badge>}
                            </Box>
                            <Stack gap="sm" p="lg">
                                <Group gap="xs">
                                    <Badge variant="light" color="miko">{difficulty[recipe.difficulty]}</Badge>
                                    <Group gap={4}><IconClock size={15} /><Text size="sm" c="dimmed">{(recipe.prepTime || 0) + (recipe.cookTime || 0)} мин</Text></Group>
                                </Group>
                                <Title order={3}>{recipe.title}</Title>
                                <Text c="dimmed" lineClamp={2}>{recipe.excerpt}</Text>
                                <Group justify="space-between" mt="auto"><Text fw={700} c="miko.8">Смотреть рецепт</Text><IconArrowRight size={19} /></Group>
                            </Stack>
                        </Link>
                    ))}
                </SimpleGrid>
            )}
        </Box>
    );
}
