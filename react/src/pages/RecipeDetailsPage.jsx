import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Box, Breadcrumbs, Checkbox, Grid, Group, Image, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconChefHat, IconClock, IconFlame, IconToolsKitchen2, IconUsers } from '@tabler/icons-react';
import api from '../api/api';
import { resolveImage } from '../utils/resolveImage';
import classes from './RecipeDetails.module.css';

const difficulties = { easy: 'Легко', medium: 'Средняя сложность', hard: 'Для опытных' };

export default function RecipeDetailsPage() {
    const { slug } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
        api.get(`/recipes/${encodeURIComponent(slug)}`).then(({ data }) => setRecipe(data)).catch(() => setError(true));
    }, [slug]);

    useEffect(() => {
        if (recipe?.seoTitle || recipe?.title) document.title = recipe.seoTitle || `${recipe.title} — Miko`;
    }, [recipe]);

    if (error) return <Stack align="center" py={80}><Title order={2}>Рецепт не найден</Title><Text component={Link} to="/recipes" c="miko.8" fw={700}>Вернуться к рецептам</Text></Stack>;
    if (!recipe) return <Text ta="center" py={80}>Загружаем рецепт…</Text>;

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    return (
        <article className={classes.page}>
            <Breadcrumbs mb="lg"><Link to="/">Главная</Link><Link to="/recipes">Рецепты</Link><Text>{recipe.title}</Text></Breadcrumbs>
            <Grid gutter={{ base: 24, md: 48 }} align="center" className={classes.intro}>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Box className={classes.cover}><Image src={resolveImage(recipe.image)} alt={recipe.title} /></Box>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="lg">
                        <Group gap="xs"><Badge size="lg" color="miko">{recipe.category}</Badge>{recipe.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="light" color="gray">#{tag}</Badge>)}</Group>
                        <Title order={1}>{recipe.title}</Title>
                        <Text size="lg" c="dimmed">{recipe.excerpt}</Text>
                        <div className={classes.stats}>
                            <Stat icon={IconClock} label="Время" value={`${totalTime} мин`} />
                            <Stat icon={IconUsers} label="Порции" value={recipe.servings || '—'} />
                            <Stat icon={IconChefHat} label="Сложность" value={difficulties[recipe.difficulty]} />
                            {recipe.calories ? <Stat icon={IconFlame} label="Калорийность" value={`${recipe.calories} ккал`} /> : null}
                        </div>
                    </Stack>
                </Grid.Col>
            </Grid>

            <Grid gutter={{ base: 28, md: 52 }} mt={{ base: 36, md: 64 }} align="flex-start">
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper className={classes.ingredients} p="xl">
                        <Group mb="lg"><ThemeIcon color="miko" radius="xl" size="lg"><IconToolsKitchen2 size={20} /></ThemeIcon><Title order={2}>Ингредиенты</Title></Group>
                        <Stack gap={0}>
                            {recipe.ingredients?.map((item, index) => (
                                <div key={`${item.name}-${index}`}>
                                    {item.group && (index === 0 || recipe.ingredients[index - 1]?.group !== item.group) && <Text className={classes.group}>{item.group}</Text>}
                                    <label className={classes.ingredient}><Checkbox color="miko" /><Text>{item.name}</Text><Text fw={700} ml="auto">{item.amount}</Text></label>
                                </div>
                            ))}
                        </Stack>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="xl">
                        {recipe.content && <div className={classes.richText} dangerouslySetInnerHTML={{ __html: recipe.content }} />}
                        <Box>
                            <Title order={2} mb="xl">Как приготовить</Title>
                            <Stack gap="xl">
                                {recipe.steps?.map((step, index) => (
                                    <div className={classes.step} key={index}><div className={classes.stepNumber}>{index + 1}</div><div><Title order={3}>{step.title || `Шаг ${index + 1}`}</Title><Text mt="xs" size="lg" c="dimmed" className={classes.stepText}>{step.text}</Text></div></div>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </Grid.Col>
            </Grid>
        </article>
    );
}

function Stat({ icon: Icon, label, value }) {
    return <div className={classes.stat}><ThemeIcon variant="light" color="miko" size={42} radius="xl"><Icon size={20} /></ThemeIcon><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text><Text fw={700}>{value}</Text></div></div>;
}
