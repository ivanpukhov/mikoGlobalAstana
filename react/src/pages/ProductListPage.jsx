import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Checkbox,
    Group,
    Loader,
    Modal,
    NumberInput,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { formatCurrency } from '../utils/formatters';

const defaultCityId = 1;
const PAGE_SIZE = 12;

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [saleStatusFilter, setSaleStatusFilter] = useState('all');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [discountModal, setDiscountModal] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState('');
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        setSelectedCategory(searchParams.get('category') || '');
        setSearchValue(searchParams.get('search') || '');
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/products');
            const transformed = data.map((p) => ({
                ...p,
                categoryName: p.category?.name,
                categoryId: p.category?.id,
                subcategoryName: p.subcategory?.name,
                defaultPrice: p.prices[0]?.price || 0,
                imageUrl: `/api${p.image}`,
                isOffSale: Array.isArray(p.prices) && p.prices.length > 0 && p.prices.every((price) => price.availability === false),
            }));
            setProducts(transformed);
            const uniqueCategories = Array.from(
                new Map(transformed.map((p) => [p.categoryId, { id: p.categoryId, name: p.categoryName }])).values()
            ).filter((c) => c.id);
            setCategories(uniqueCategories);
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка загрузки товаров' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const filteredProducts = useMemo(() => {
        const q = searchValue.toLowerCase();

        return products.filter(
            (p) => {
                const matchesSearch = q
                    ? (
                        p.name.toLowerCase().includes(q) ||
                        p.subcategoryName?.toLowerCase().includes(q) ||
                        p.categoryName?.toLowerCase().includes(q)
                    )
                    : true;
                const matchesCategory = selectedCategory ? p.categoryId?.toString() === selectedCategory : true;
                const matchesSaleStatus = saleStatusFilter === 'off-sale' ? p.isOffSale : true;

                return matchesSearch && matchesCategory && matchesSaleStatus;
            }
        );
    }, [products, saleStatusFilter, searchValue, selectedCategory]);

    useEffect(() => {
        setPage(1);
    }, [saleStatusFilter, searchValue, selectedCategory]);

    const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedIds((prev) =>
            paginatedProducts.every((p) => prev.includes(p.id))
                ? prev.filter((id) => !paginatedProducts.some((product) => product.id === id))
                : Array.from(new Set([...prev, ...paginatedProducts.map((p) => p.id)]))
        );
    };

    const handleDiscountUpdate = async () => {
        try {
            if (discountType === 'selected') {
                await api.patch(`/${defaultCityId}/multiple/discount`, {
                    discount: discountValue,
                    productIds: selectedIds,
                });
                setSelectedIds([]);
            } else if (discountType === 'category') {
                await api.patch(`/${defaultCityId}/category/${selectedCategory}/discount`, {
                    discount: discountValue,
                });
            }
            setDiscountModal(false);
            setDiscountValue(0);
            setDiscountType('');
            fetchProducts();
            notifications.show({ color: 'teal', message: 'Скидка обновлена' });
        } catch {
            notifications.show({ color: 'red', message: 'Ошибка обновления скидки' });
        }
    };

    const allSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id));
    const someSelected = selectedIds.length > 0 && !allSelected;

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={3} fw={700}>Список товаров</Title>
                <Button
                    color="miko"
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('/admin/products/create')}
                >
                    Добавить товар
                </Button>
            </Group>

            <Group gap="sm" wrap="wrap">
                <TextInput
                    placeholder="Поиск по названию или подкатегории"
                    leftSection={<IconSearch size={16} />}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    w={320}
                    radius="md"
                />
                <Select
                    placeholder="Все категории"
                    value={selectedCategory || null}
                    onChange={(v) => setSelectedCategory(v || '')}
                    clearable
                    data={categories.map((c) => ({ value: c.id.toString(), label: c.name }))}
                    w={220}
                    radius="md"
                />
                <Select
                    value={saleStatusFilter}
                    onChange={(value) => setSaleStatusFilter(value || 'all')}
                    data={[
                        { value: 'all', label: 'Все товары' },
                        { value: 'off-sale', label: 'Снятые с продажи' },
                    ]}
                    w={240}
                    radius="md"
                />
            </Group>

            {selectedIds.length > 0 && (
                <Group gap="sm">
                    <Button
                        size="sm"
                        color="miko"
                        radius="md"
                        variant="light"
                        onClick={() => { setDiscountType('selected'); setDiscountModal(true); }}
                    >
                        Скидка для {selectedIds.length} выбранных
                    </Button>
                </Group>
            )}
            {selectedCategory && (
                <Group>
                    <Button
                        size="sm"
                        color="miko"
                        radius="md"
                        variant="light"
                        onClick={() => { setDiscountType('category'); setDiscountModal(true); }}
                    >
                        Скидка для категории
                    </Button>
                </Group>
            )}

            {loading ? (
                <Group justify="center" py="xl"><Loader color="miko" /></Group>
            ) : (
                <>
                    <Table striped highlightOnHover withTableBorder radius="md" style={{ overflowX: 'auto' }} visibleFrom="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        onChange={toggleAll}
                                    />
                                </Table.Th>
                                <Table.Th>Название</Table.Th>
                                <Table.Th>Категория</Table.Th>
                                <Table.Th>Подкатегория</Table.Th>
                                <Table.Th>Цена</Table.Th>
                                <Table.Th>Действия</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {paginatedProducts.map((p) => (
                                <Table.Tr
                                    key={p.id}
                                    bg={selectedIds.includes(p.id) ? 'var(--mantine-color-miko-0)' : undefined}
                                >
                                    <Table.Td>
                                        <Checkbox
                                            checked={selectedIds.includes(p.id)}
                                            onChange={() => toggleRow(p.id)}
                                        />
                                    </Table.Td>
                                    <Table.Td fw={600}>{p.name}</Table.Td>
                                    <Table.Td>{p.categoryName || '—'}</Table.Td>
                                    <Table.Td>{p.subcategoryName || '—'}</Table.Td>
                                    <Table.Td>{formatCurrency(p.defaultPrice)}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                color="miko"
                                                radius="md"
                                                onClick={() => navigate(`/admin/products/view/${p.id}`)}
                                            >
                                                Подробно
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="default"
                                                radius="md"
                                                onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                                            >
                                                Изменить
                                            </Button>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Stack gap="sm" hiddenFrom="sm">
                        {paginatedProducts.map((p) => (
                            <Card key={p.id} withBorder radius="xl" p="md">
                                <Stack gap="xs">
                                    <Group justify="space-between" align="flex-start">
                                        <Stack gap={0}>
                                            <Text fw={700}>{p.name}</Text>
                                            <Text size="sm" c="dimmed">{p.categoryName || '—'} · {p.subcategoryName || '—'}</Text>
                                            <Text size="sm" fw={600}>{formatCurrency(p.defaultPrice)}</Text>
                                        </Stack>
                                        <Checkbox
                                            checked={selectedIds.includes(p.id)}
                                            onChange={() => toggleRow(p.id)}
                                        />
                                    </Group>
                                    <Group gap="xs">
                                        <Button size="xs" color="miko" radius="md" onClick={() => navigate(`/admin/products/view/${p.id}`)}>
                                            Подробно
                                        </Button>
                                        <Button size="xs" variant="default" radius="md" onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                                            Изменить
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>

                    <Group justify="center" mt="md">
                        <Pagination value={page} onChange={setPage} total={pageCount} radius="xl" color="miko" />
                    </Group>
                </>
            )}

            <Modal
                opened={discountModal}
                onClose={() => setDiscountModal(false)}
                title="Установить скидку (%)"
                centered
                radius="lg"
            >
                <Stack gap="md">
                    <NumberInput
                        min={0}
                        max={100}
                        value={discountValue}
                        onChange={setDiscountValue}
                        radius="md"
                        label="Процент скидки"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" radius="md" onClick={() => setDiscountModal(false)}>Отмена</Button>
                        <Button color="miko" radius="md" onClick={handleDiscountUpdate}>Применить</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default ProductListPage;
