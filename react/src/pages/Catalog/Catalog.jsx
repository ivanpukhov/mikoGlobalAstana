import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Drawer,
    Group,
    NumberInput,
    RangeSlider,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAdjustments, IconSortAscending } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import { CatalogProduct } from '../../components/Products/CatalogProduct';
import { EmptyState, ProductGridSkeleton } from '../../components/ui';

const SORT_OPTIONS = [
    { value: 'default', label: 'По умолчанию' },
    { value: 'price_asc', label: 'Цена: от низкой' },
    { value: 'price_desc', label: 'Цена: от высокой' },
    { value: 'new', label: 'Новинки' },
    { value: 'popular', label: 'Популярные' },
];

function getProductPrice(product) {
    return product.prices?.[0]?.price || 0;
}
function getDiscountedPrice(product) {
    const p = getProductPrice(product);
    const d = product.prices?.[0]?.discount || 0;
    return p - (p * d) / 100;
}

export const Catalog = () => {
    const { categoryId } = useParams();
    const isMobile = useMediaQuery('(max-width: 62em)');

    const [products, setProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filter state
    const [activeSub, setActiveSub] = useState(null);
    const [priceRange, setPriceRange] = useState([0, 999999]);
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(999999);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sort, setSort] = useState('default');

    const [city] = useState(() => JSON.parse(localStorage.getItem('selectedCity')));

    useEffect(() => {
        if (!city) { setLoading(false); return; }
        const fetch = async () => {
            try {
                setLoading(true);
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get(`/products/${city.id}/category/${categoryId}/products`),
                    api.get('/categories'),
                ]);
                const data = productsRes.data;
                setProducts(data);

                const subs = [...new Set(data.map((p) => p.subcategoryId))].filter(Boolean);
                setSubcategories(subs.map((sid) => {
                    const p = data.find((pr) => pr.subcategoryId === sid);
                    return { id: sid, name: p?.subcategory?.name || `Подкатегория ${sid}` };
                }));

                const prices = data.map((p) => getDiscountedPrice(p)).filter(Boolean);
                if (prices.length) {
                    const mn = Math.floor(Math.min(...prices));
                    const mx = Math.ceil(Math.max(...prices));
                    setPriceMin(mn);
                    setPriceMax(mx);
                    setPriceRange([mn, mx]);
                }

                const cat = categoriesRes.data.find((c) => c.id === parseInt(categoryId));
                if (cat) setCategoryName(cat.name);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [city?.id, categoryId]);

    const visibleProducts = useMemo(() => {
        let result = [...products];

        if (activeSub !== null) result = result.filter((p) => p.subcategoryId === activeSub);
        result = result.filter((p) => {
            const price = getDiscountedPrice(p);
            return price >= priceRange[0] && price <= priceRange[1];
        });
        if (inStockOnly) result = result.filter((p) => p.inStock !== false);

        switch (sort) {
            case 'price_asc': result.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b)); break;
            case 'price_desc': result.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a)); break;
            case 'new': result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
            default: break;
        }
        return result;
    }, [products, activeSub, priceRange, inStockOnly, sort]);

    const FiltersContent = () => (
        <Stack gap="lg">
            {/* Subcategory */}
            {subcategories.length > 0 && (
                <Box>
                    <Text fw={600} mb="xs">Подкатегории</Text>
                    <Stack gap={6}>
                        <Chip
                            checked={activeSub === null}
                            onChange={() => setActiveSub(null)}
                            color="miko" variant="filled" size="sm"
                        >Все</Chip>
                        {subcategories.map((s) => (
                            <Chip
                                key={s.id}
                                checked={activeSub === s.id}
                                onChange={() => setActiveSub(activeSub === s.id ? null : s.id)}
                                color="miko" variant="filled" size="sm"
                            >{s.name}</Chip>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Price range */}
            <Box>
                <Text fw={600} mb="sm">Цена</Text>
                <RangeSlider
                    min={priceMin}
                    max={priceMax}
                    value={priceRange}
                    onChange={setPriceRange}
                    color="miko"
                    mb="md"
                />
                <Group gap="xs">
                    <NumberInput
                        label="От"
                        value={priceRange[0]}
                        onChange={(v) => setPriceRange([Number(v) || priceMin, priceRange[1]])}
                        min={priceMin}
                        max={priceRange[1]}
                        size="xs"
                        hideControls
                        style={{ flex: 1 }}
                    />
                    <NumberInput
                        label="До"
                        value={priceRange[1]}
                        onChange={(v) => setPriceRange([priceRange[0], Number(v) || priceMax])}
                        min={priceRange[0]}
                        max={priceMax}
                        size="xs"
                        hideControls
                        style={{ flex: 1 }}
                    />
                </Group>
            </Box>

            {/* In stock */}
            <Switch
                label="Только в наличии"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.currentTarget.checked)}
                color="miko"
            />

            {isMobile && (
                <Button onClick={() => setDrawerOpen(false)} fullWidth>
                    Применить
                </Button>
            )}
        </Stack>
    );

    return (
        <Box mt="xl">
            <Title order={2} fw={700} mb="md">{categoryName || 'Каталог'}</Title>

            {/* Toolbar */}
            <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto', flex: 1 }}>
                    <Chip
                        checked={activeSub === null}
                        onChange={() => setActiveSub(null)}
                        color="miko" variant="filled" size="sm"
                    >Все</Chip>
                    {subcategories.slice(0, 6).map((s) => (
                        <Chip
                            key={s.id}
                            checked={activeSub === s.id}
                            onChange={() => setActiveSub(activeSub === s.id ? null : s.id)}
                            color="miko" variant="filled" size="sm"
                        >{s.name}</Chip>
                    ))}
                </Group>
                <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Select
                        data={SORT_OPTIONS}
                        value={sort}
                        onChange={(v) => setSort(v || 'default')}
                        leftSection={<IconSortAscending size={16} />}
                        size="sm"
                        w={200}
                        radius="md"
                    />
                    {isMobile && (
                        <Button
                            variant="light"
                            color="miko"
                            leftSection={<IconAdjustments size={16} />}
                            size="sm"
                            onClick={() => setDrawerOpen(true)}
                        >
                            Фильтры
                        </Button>
                    )}
                </Group>
            </Group>

            <Group align="flex-start" gap="xl" wrap="nowrap">
                {/* Desktop sidebar */}
                {!isMobile && (
                    <Box w={220} style={{ flexShrink: 0, position: 'sticky', top: 88 }}>
                        <FiltersContent />
                    </Box>
                )}

                {/* Products */}
                <Box style={{ flex: 1, minWidth: 0 }}>
                    {loading ? (
                        <ProductGridSkeleton count={12} />
                    ) : visibleProducts.length > 0 ? (
                        <SimpleGrid cols={{ base: 2, xs: 2, sm: 3, md: 3, lg: 4 }} spacing="md">
                            {visibleProducts.map((product) => (
                                <CatalogProduct key={product.id} product={product} />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <EmptyState
                            title="Товары не найдены"
                            description="Попробуйте изменить фильтры"
                            minHeight="30vh"
                        />
                    )}
                </Box>
            </Group>

            {/* Mobile filters drawer */}
            <Drawer
                opened={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Фильтры"
                position="bottom"
                size="auto"
            >
                <FiltersContent />
            </Drawer>
        </Box>
    );
};
