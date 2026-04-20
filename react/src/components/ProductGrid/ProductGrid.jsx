import { Center, SimpleGrid, Text } from '@mantine/core';
import { ProductCard } from '../ProductCard/ProductCard';
import { ProductCardSkeleton } from '../ui/skeletons';
import { PRODUCT_GRID_COLS } from '../../theme/tokens';

export const ProductGrid = ({
    products,
    loading = false,
    emptyText = 'Товары не найдены',
    skeletonCount = 12,
    mode = 'default',
    onQuantityChange,
}) => {
    if (loading) {
        return (
            <SimpleGrid cols={PRODUCT_GRID_COLS} spacing={{ base: 'sm', md: 'md' }}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
            </SimpleGrid>
        );
    }

    if (!products || products.length === 0) {
        return (
            <Center mih={200}>
                <Text c="dimmed">{emptyText}</Text>
            </Center>
        );
    }

    return (
        <SimpleGrid cols={PRODUCT_GRID_COLS} spacing={{ base: 'sm', md: 'md' }}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    mode={mode}
                    onQuantityChange={onQuantityChange}
                />
            ))}
        </SimpleGrid>
    );
};
