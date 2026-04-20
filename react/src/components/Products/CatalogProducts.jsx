import { useEffect, useState } from 'react';
import { Chip, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { CatalogProduct } from './CatalogProduct';
import { ProductGridSkeleton } from '../ui';
import { useParams } from 'react-router-dom';
import { EmptyState } from '../ui';

export const CatalogProducts = ({ title, sub, products, loading, onQuantityChange }) => {
    const [subcategories, setSubcategories] = useState([]);
    const [activeSub, setActiveSub] = useState(null);
    const { categoryId } = useParams();

    useEffect(() => {
        if (!categoryId) return;
        const fetchSubcategories = async () => {
            try {
                const res = await fetch(`/api/categories/${categoryId}/subcategories`);
                const data = await res.json();
                setSubcategories(data.subcategories || []);
            } catch {
                // silent
            }
        };
        fetchSubcategories();
    }, [categoryId]);

    const filteredProducts =
        activeSub === null
            ? products
            : products.filter((p) => p.subcategoryId === activeSub);

    return (
        <div>
            {title && (
                <Title order={2} fw={700} mb="md" mt="xl">
                    {title}
                </Title>
            )}

            {/* Subcategory filter chips */}
            {sub && subcategories.length > 0 && (
                <Group gap="xs" mb="md" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
                    <Chip
                        checked={activeSub === null}
                        onChange={() => setActiveSub(null)}
                        color="miko"
                        variant="filled"
                        size="sm"
                    >
                        Все
                    </Chip>
                    {subcategories.map((sub) => (
                        <Chip
                            key={sub.id}
                            checked={activeSub === sub.id}
                            onChange={() => setActiveSub(activeSub === sub.id ? null : sub.id)}
                            color="miko"
                            variant="filled"
                            size="sm"
                        >
                            {sub.name}
                        </Chip>
                    ))}
                </Group>
            )}

            {/* Products grid */}
            {loading ? (
                <ProductGridSkeleton count={10} />
            ) : filteredProducts.length > 0 ? (
                <SimpleGrid
                    cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                    spacing="md"
                >
                    {filteredProducts.map((product) => (
                        <CatalogProduct
                            key={product.id}
                            product={product}
                            onQuantityChange={onQuantityChange}
                        />
                    ))}
                </SimpleGrid>
            ) : (
                <EmptyState
                    title="Товары не найдены"
                    description="Попробуйте выбрать другую подкатегорию"
                    minHeight="20vh"
                />
            )}
        </div>
    );
};
