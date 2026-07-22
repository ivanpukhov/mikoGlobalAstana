import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Group,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import api from '../api/api';
import { MainTop } from '../components/MainTop/MainTop';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { RecipesPromo } from '../components/RecipesPromo/RecipesPromo';

export const Main = () => {
    const [categories, setCategories] = useState([]);
    const [productsByCategory, setProductsByCategory] = useState({});
    const [expiringProducts, setExpiringProducts] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [city] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('selectedCity'));
        } catch {
            return null;
        }
    });

    useEffect(() => {
        api.get('/categories')
            .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Ошибка категорий:', error))
            .finally(() => setLoadingCategories(false));
    }, []);

    useEffect(() => {
        if (!city?.id) {
            setLoadingProducts(false);
            return;
        }

        let cancelled = false;
        setLoadingProducts(true);

        api.get(`/products/${city.id}/products`)
            .then(({ data }) => {
                if (cancelled) return;
                const products = Array.isArray(data) ? data : [];
                setExpiringProducts(products.filter((product) => product.isExpiringSoon).slice(0, 12));

                const grouped = products.reduce((acc, product) => {
                    const categoryId = product.categoryId;
                    if (!acc[categoryId]) acc[categoryId] = [];
                    if (acc[categoryId].length < 12) acc[categoryId].push(product);
                    return acc;
                }, {});
                setProductsByCategory(grouped);
            })
            .catch((error) => console.error('Ошибка товаров:', error))
            .finally(() => {
                if (!cancelled) setLoadingProducts(false);
            });

        return () => { cancelled = true; };
    }, [city?.id]);

    const getCategoryName = (id) =>
        categories.find((c) => c.id === Number(id))?.name || `Категория ${id}`;

    const categoryIds = Object.keys(productsByCategory);

    return (
        <Container size="xl" py={{ base: 'sm', md: 'md' }} px={0}>
            <MainTop categories={categories} loading={loadingCategories} />

            <Stack gap={6} mt={{ base: 'lg', md: 'xl' }}>
                <Title order={1} fz={{ base: 28, sm: 36, md: 44 }} fw={850} lh={1.08}>
                    Корейская косметика и товары для дома в Астане
                </Title>
                <Text c="dimmed" fz={{ base: 15, sm: 17 }} maw={900} lh={1.6}>
                    В Miko легко найти уходовую косметику, посуду, товары для дома,
                    подарки и полезные новинки из Южной Кореи. Выбирайте товары по
                    категориям, проверяйте актуальное наличие и оформляйте заказ онлайн.
                </Text>
            </Stack>

            <Box
                mt="xl"
                p={{ base: 'md', md: 'xl' }}
                style={{
                    background:
                        'linear-gradient(135deg, var(--mantine-color-miko-5), var(--mantine-color-miko-7))',
                    borderRadius: 'var(--mantine-radius-xl)',
                    boxShadow: 'var(--mantine-shadow-md)',
                }}
            >
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Stack gap={4}>
                        <Title order={2} c="white" fz={{ base: 22, sm: 28 }} fw={800}>
                            Новинка! Подарочные сертификаты
                        </Title>
                        <Text c="white" fz={{ base: 14, sm: 16 }} fw={600}>
                            Выберите тематику и номинал — дарите радость легко!
                        </Text>
                    </Stack>
                    <Button
                        component={Link}
                        to="/gift-certificates"
                        variant="white"
                        color="miko"
                        size="md"
                        radius="md"
                    >
                        Перейти
                    </Button>
                </Group>
            </Box>

            <RecipesPromo />

            {loadingProducts ? (
                <Box mt="xl">
                    <ProductGrid loading skeletonCount={12} />
                </Box>
            ) : (
                <>
                    {expiringProducts.length > 0 && (
                        <Box mt="xl">
                            <SectionHeader
                                title="Уценка · подходящие сроки"
                                to="/sale"
                                linkLabel="Все товары"
                            />
                            <ProductGrid products={expiringProducts} />
                        </Box>
                    )}

                    {categoryIds.map((categoryId) => (
                        <Box key={categoryId} mt="xl">
                            <SectionHeader
                                title={getCategoryName(categoryId)}
                                to={`/catalog/${categoryId}`}
                                linkLabel="Все товары"
                            />
                            <ProductGrid products={productsByCategory[categoryId]} />
                        </Box>
                        ))}
                </>
            )}
        </Container>
    );
};
