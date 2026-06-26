import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { IconDiscount2, IconSortAscending } from '@tabler/icons-react';
import api from '../api/api';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { EmptyState } from '../components/ui';

const SORT_OPTIONS = [
    { value: 'expiry_asc', label: 'Сначала ближайший срок' },
    { value: 'discount_desc', label: 'Сначала большая скидка' },
    { value: 'price_asc', label: 'Цена: от низкой' },
    { value: 'price_desc', label: 'Цена: от высокой' },
];

const getPrice = (product) => {
    const price = product.prices?.[0]?.price || 0;
    const discount = product.prices?.[0]?.discount || 0;
    return price - (price * discount) / 100;
};

const getDiscount = (product) => product.prices?.[0]?.discount || 0;

const ExpiringProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('expiry_asc');
    const [city] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('selectedCity'));
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!city?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        api.get(`/products/${city.id}/expiring`)
            .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
            .catch((error) => {
                console.error('Ошибка загрузки уценки:', error);
                setProducts([]);
            })
            .finally(() => setLoading(false));
    }, [city?.id]);

    const visibleProducts = useMemo(() => {
        const sorted = [...products];

        switch (sort) {
            case 'discount_desc':
                sorted.sort((a, b) => getDiscount(b) - getDiscount(a));
                break;
            case 'price_asc':
                sorted.sort((a, b) => getPrice(a) - getPrice(b));
                break;
            case 'price_desc':
                sorted.sort((a, b) => getPrice(b) - getPrice(a));
                break;
            default:
                sorted.sort((a, b) => {
                    if (!a.expiresAt && !b.expiresAt) return 0;
                    if (!a.expiresAt) return 1;
                    if (!b.expiresAt) return -1;
                    return new Date(a.expiresAt) - new Date(b.expiresAt);
                });
        }

        return sorted;
    }, [products, sort]);

    return (
        <Box mt="xl" pb="xl">
            <Paper p={{ base: 'md', md: 'xl' }} radius="lg" withBorder bg="orange.0" mb="xl">
                <Group justify="space-between" align="flex-end" gap="md">
                    <Stack gap={8}>
                        <Badge color="orange" variant="filled" leftSection={<IconDiscount2 size={14} />}>
                            Уценка
                        </Badge>
                        <Title order={2} fw={800}>Товары с подходящими сроками</Title>
                        <Text c="dimmed" maw={680}>
                            Здесь собраны товары, которые администратор перевел в уценку по срокам.
                        </Text>
                    </Stack>

                    <Select
                        data={SORT_OPTIONS}
                        value={sort}
                        onChange={(value) => setSort(value || 'expiry_asc')}
                        leftSection={<IconSortAscending size={16} />}
                        w={{ base: '100%', sm: 260 }}
                        radius="md"
                    />
                </Group>
            </Paper>

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : visibleProducts.length > 0 ? (
                <ProductGrid products={visibleProducts} />
            ) : (
                <EmptyState
                    icon={IconDiscount2}
                    title="Сейчас нет товаров в уценке"
                    description="Как только появятся товары с подходящими сроками, они будут здесь."
                    minHeight="34vh"
                />
            )}
        </Box>
    );
};

export default ExpiringProductsPage;
