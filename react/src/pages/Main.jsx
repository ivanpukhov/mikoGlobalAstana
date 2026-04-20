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
import { OrderGiftPromo } from '../components/OrderGiftPromo/OrderGiftPromo';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';

export const Main = () => {
    const [categories, setCategories] = useState([]);
    const [productsByCategory, setProductsByCategory] = useState({});
    const [orderGiftRules, setOrderGiftRules] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingGiftRules, setLoadingGiftRules] = useState(true);
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
        api.get('/order-gift-rules')
            .then(({ data }) => setOrderGiftRules(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Ошибка правил подарков:', error))
            .finally(() => setLoadingGiftRules(false));
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
                const grouped = (Array.isArray(data) ? data : []).reduce((acc, product) => {
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

            <OrderGiftPromo rules={orderGiftRules} loading={loadingGiftRules} />

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

            {loadingProducts ? (
                <Box mt="xl">
                    <ProductGrid loading skeletonCount={12} />
                </Box>
            ) : (
                categoryIds.map((categoryId) => (
                    <Box key={categoryId} mt="xl">
                        <SectionHeader
                            title={getCategoryName(categoryId)}
                            to={`/catalog/${categoryId}`}
                            linkLabel="Все товары"
                        />
                        <ProductGrid products={productsByCategory[categoryId]} />
                    </Box>
                    ))
            )}
        </Container>
    );
};
