import React from 'react';
import {
    ActionIcon,
    Badge,
    Card,
    Group,
    Image,
    NumberInput,
    Stack,
    Text,
} from '@mantine/core';
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';
import { resolveImage } from '../../utils/resolveImage';
import styles from './CartList.module.css';

export const CartList = ({ onQuantityChange }) => {
    const cart = useCart();
    const cartProducts = cart.items;

    const getPriceInfo = (product) => {
        const direct = product.prices?.[0];
        const basePrice = direct?.price ?? product.price ?? 0;
        const discount = direct?.discount ?? product.discount ?? 0;
        const finalPrice = basePrice - (basePrice * discount) / 100;

        return {
            price: finalPrice,
            oldPrice: discount > 0 ? basePrice : null,
            discount,
        };
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            cart.remove(productId);
            onQuantityChange?.(productId, 0);
            return;
        }

        cart.setQuantity(productId, quantity);
        onQuantityChange?.(productId, quantity);
    };

    return cartProducts.length > 0 ? (
        <Stack gap="md">
            <Text fw={800} size="xl">Корзина</Text>

            {cartProducts.map((product) => {
                const { price, oldPrice, discount } = getPriceInfo(product);
                const quantity = cart.quantity(product.id);
                const total = price * quantity;

                return (
                    <Card key={product.id} className={styles.card} radius="xl" withBorder>
                        <div className={styles.layout}>
                            <Link to={`/product/${product.id}`} className={styles.imageLink}>
                                <Image
                                    src={resolveImage(product.image)}
                                    alt={product.name}
                                    className={styles.image}
                                    fallbackSrc={resolveImage(null)}
                                />
                            </Link>

                            <Stack gap="sm" className={styles.content}>
                                <Group justify="space-between" align="flex-start" wrap="nowrap">
                                    <Stack gap={6} className={styles.info}>
                                        <Text
                                            component={Link}
                                            to={`/product/${product.id}`}
                                            fw={700}
                                            className={styles.name}
                                        >
                                            {product.name}
                                        </Text>
                                        <Group gap="xs">
                                            <Text fw={800} size="xl">
                                                {formatCurrency(price)}
                                            </Text>
                                            {oldPrice && (
                                                <Text c="dimmed" td="line-through" size="sm">
                                                    {formatCurrency(oldPrice)}
                                                </Text>
                                            )}
                                            {discount > 0 && (
                                                <Badge color="red" variant="light">
                                                    -{discount}%
                                                </Badge>
                                            )}
                                        </Group>
                                    </Stack>

                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        radius="xl"
                                        onClick={() => updateQuantity(product.id, 0)}
                                        aria-label="Удалить"
                                    >
                                        <IconTrash size={18} />
                                    </ActionIcon>
                                </Group>

                                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                                    <Group gap="8" wrap="nowrap" className={styles.qtyControls}>
                                        <ActionIcon
                                            variant="light"
                                            color="miko"
                                            size="lg"
                                            radius="md"
                                            onClick={() => updateQuantity(product.id, quantity - 1)}
                                        >
                                            <IconMinus size={16} />
                                        </ActionIcon>
                                        <NumberInput
                                            value={quantity}
                                            onChange={(value) => updateQuantity(product.id, Number(value) || 0)}
                                            min={1}
                                            hideControls
                                            radius="md"
                                            className={styles.input}
                                            styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
                                        />
                                        <ActionIcon
                                            variant="light"
                                            color="miko"
                                            size="lg"
                                            radius="md"
                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                        >
                                            <IconPlus size={16} />
                                        </ActionIcon>
                                    </Group>

                                    <Text fw={800} size="lg">
                                        Итого: {formatCurrency(total)}
                                    </Text>
                                </Group>
                            </Stack>
                        </div>
                    </Card>
                );
            })}
        </Stack>
    ) : null;
};
