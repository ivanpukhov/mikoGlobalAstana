import { Link } from 'react-router-dom';
import { Badge, Box, Button, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowRight, IconChefHat, IconClock, IconToolsKitchen2 } from '@tabler/icons-react';
import classes from './RecipesPromo.module.css';

export const RecipesPromo = () => (
    <Box component="section" className={classes.root} mt="xl">
        <div className={classes.glow} />
        <div className={classes.plate}>
            <IconToolsKitchen2 size={84} stroke={1.3} />
            <span className={classes.leafOne} />
            <span className={classes.leafTwo} />
        </div>

        <Stack gap="md" className={classes.content}>
            <Badge variant="white" color="dark" size="lg" leftSection={<IconChefHat size={15} />}>
                Готовим с Miko
            </Badge>
            <Title order={2}>Идеи для вкусного дня</Title>
            <Text>
                Пошаговые рецепты, точные списки ингредиентов и блюда, которые легко
                повторить дома.
            </Text>
            <Group gap="md">
                <Button
                    component={Link}
                    to="/recipes"
                    variant="white"
                    color="miko"
                    radius="xl"
                    rightSection={<IconArrowRight size={18} />}
                >
                    Смотреть рецепты
                </Button>
                <Group gap={7} className={classes.detail}>
                    <ThemeIcon variant="transparent" color="white" size="sm">
                        <IconClock size={18} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>Просто и понятно</Text>
                </Group>
            </Group>
        </Stack>
    </Box>
);
