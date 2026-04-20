import { Group, Stack, Text } from '@mantine/core';

const formatPrice = (value) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value));

export const PriceTag = ({ price, oldPrice, discountPercent, size = 'md', align = 'left' }) => {
    const hasDiscount = Boolean(oldPrice && oldPrice > price);
    const currentSize = size === 'lg' ? 28 : size === 'sm' ? 16 : 20;
    const oldSize = size === 'lg' ? 16 : size === 'sm' ? 12 : 13;

    return (
        <Stack gap={2} align={align === 'center' ? 'center' : 'flex-start'}>
            <Group gap={8} align="baseline">
                <Text fw={800} style={{ fontSize: currentSize, lineHeight: 1, color: '#0f172a' }}>
                    {formatPrice(price)} ₸
                </Text>
                {hasDiscount && (
                    <Text td="line-through" c="dimmed" style={{ fontSize: oldSize, lineHeight: 1 }}>
                        {formatPrice(oldPrice)} ₸
                    </Text>
                )}
            </Group>
            {hasDiscount && discountPercent ? (
                <Text fz="xs" fw={700} c="red.6">
                    −{discountPercent}%
                </Text>
            ) : null}
        </Stack>
    );
};
