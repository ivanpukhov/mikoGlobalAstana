import { useEffect, useState } from 'react';
import { Box, Loader, SimpleGrid, Stack } from '@mantine/core';
import { IconCategory } from '@tabler/icons-react';
import api from '../../api/api';
import { EmptyState } from '../../components/ui';
import { CategoryTile } from '../../components/CategoryTile/CategoryTile';
import { SectionHeader } from '../../components/SectionHeader/SectionHeader';

export const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/categories')
            .then((res) => setCategories(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Stack align="center" justify="center" mih="50vh">
                <Loader size="lg" />
            </Stack>
        );
    }

    return (
        <Box mt="xl" pb="xl">
            <SectionHeader title="Категории" />

            {categories.length === 0 ? (
                <EmptyState
                    icon={IconCategory}
                    title="Категории не найдены"
                    description="Пока что категорий нет. Загляните позже!"
                />
            ) : (
                <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="md">
                    {categories.map((category) => (
                        <CategoryTile
                            key={category.id}
                            to={`/catalog/${category.id}`}
                            name={category.name}
                        />
                    ))}
                </SimpleGrid>
            )}
        </Box>
    );
};
