import { Link, useLocation } from 'react-router-dom';
import {
    ActionIcon,
    AspectRatio,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Image,
    NumberInput,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconHeart, IconHeartFilled, IconMinus, IconPlus } from '@tabler/icons-react';
import { PriceTag } from '../PriceTag/PriceTag';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../hooks/useCart';
import { resolveImage } from '../../utils/resolveImage';
import classes from './ProductCard.module.css';

const getPriceInfo = (product) => {
    const direct = product.prices?.[0];
    const price = direct?.price ?? product.price ?? 0;
    const discount = direct?.discount ?? product.discount ?? 0;
    const finalPrice = price - (price * discount) / 100;

    return {
        price: finalPrice,
        oldPrice: discount > 0 ? price : null,
        discountPercent: discount,
    };
};

const hasAttribute = (product, name, value) =>
    product?.attributes?.some((attribute) => attribute.name === name && attribute.value === value);

const isNewProduct = (product) => {
    if (product?.isNew) {
        return true;
    }

    if (!product?.createdAt) {
        return false;
    }

    const created = new Date(product.createdAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return created > thirtyDaysAgo;
};

export const ProductCard = ({ product, mode = 'default', onQuantityChange }) => {
    const { id, name, image } = product;
    const location = useLocation();
    const favorites = useFavorites();
    const cart = useCart();

    const { price, oldPrice, discountPercent } = getPriceInfo(product);
    const inCart = cart.has(id);
    const quantity = cart.quantity(id);
    const isFavorite = favorites.has(id);
    const isCartMode = mode === 'cart';
    const isAvailable = product.isAvailable ?? product.inStock ?? product.prices?.[0]?.availability ?? true;

    const scrollKey = `catalog-scroll:${location.pathname}${location.search}`;
    const handleProductClick = () => {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
    };

    const handleAddToCart = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();

        if (!isAvailable && !isCartMode) {
            return;
        }

        cart.add(product);
        onQuantityChange?.(id, quantity + 1);
    };

    const handleQuantity = (value) => {
        const nextValue = Number(value) || 0;
        if (nextValue <= 0) {
            cart.remove(id);
            onQuantityChange?.(id, 0);
            return;
        }

        cart.setQuantity(id, nextValue);
        onQuantityChange?.(id, nextValue);
    };

    return (
        <Card className={classes.card} padding={0}>
            <Box className={classes.imageWrap}>
                <Link
                    to={`/product/${id}`}
                    onClick={handleProductClick}
                    className={classes.imageLink}
                >
                    <AspectRatio ratio={1}>
                        <Image
                            src={resolveImage(image)}
                            alt={name}
                            fit="contain"
                            className={classes.image}
                            fallbackSrc={resolveImage(null)}
                        />
                    </AspectRatio>
                </Link>

                <Stack gap={4} className={classes.badges}>
                    {discountPercent > 0 && (
                        <Badge color="red" size="sm">
                            −{discountPercent}%
                        </Badge>
                    )}
                    {(product.isHit || hasAttribute(product, 'sale', 'bestseller')) && (
                        <Badge color="orange" size="sm">
                            Хит
                        </Badge>
                    )}
                    {(isNewProduct(product) || hasAttribute(product, 'sale', 'new')) && (
                        <Badge color="miko" size="sm">
                            Новинка
                        </Badge>
                    )}
                </Stack>

                <Tooltip
                    label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
                    withArrow
                    position="left"
                >
                    <ActionIcon
                        className={classes.favoriteBtn}
                        variant="white"
                        radius="xl"
                        size="lg"
                        aria-label="Избранное"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            favorites.toggle(id);
                        }}
                    >
                        {isFavorite ? (
                            <IconHeartFilled size={18} color="var(--mantine-color-red-6)" />
                        ) : (
                            <IconHeart size={18} />
                        )}
                    </ActionIcon>
                </Tooltip>

                {!isAvailable && (
                    <Box className={classes.outOfStock}>
                        <Badge color="gray" size="lg" variant="filled">
                            Нет в наличии
                        </Badge>
                    </Box>
                )}
            </Box>

            <Stack gap={8} className={classes.body}>
                <PriceTag price={price} oldPrice={oldPrice} discountPercent={discountPercent} />

                <Text
                    component={Link}
                    to={`/product/${id}`}
                    onClick={handleProductClick}
                    fz="sm"
                    fw={500}
                    c="dark"
                    lineClamp={2}
                    className={classes.name}
                >
                    {name}
                </Text>

                {isCartMode && inCart ? (
                    <Group gap={6} grow wrap="nowrap" className={classes.qtyRow}>
                        <ActionIcon
                            variant="light"
                            color="miko"
                            size="lg"
                            radius="md"
                            onClick={() => handleQuantity(quantity - 1)}
                            aria-label="Уменьшить"
                        >
                            <IconMinus size={16} />
                        </ActionIcon>
                        <NumberInput
                            value={quantity}
                            onChange={handleQuantity}
                            min={0}
                            hideControls
                            size="sm"
                            radius="md"
                            styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
                        />
                        <ActionIcon
                            variant="light"
                            color="miko"
                            size="lg"
                            radius="md"
                            onClick={() => handleQuantity(quantity + 1)}
                            aria-label="Увеличить"
                        >
                            <IconPlus size={16} />
                        </ActionIcon>
                    </Group>
                ) : inCart ? (
                    <Button
                        component={Link}
                        to="/cart"
                        fullWidth
                        radius="md"
                        variant="filled"
                        color="miko"
                    >
                        В корзине · {quantity}
                    </Button>
                ) : (
                    <Button
                        fullWidth
                        radius="md"
                        variant={isAvailable ? 'filled' : 'light'}
                        color={isAvailable ? 'miko' : 'gray'}
                        disabled={!isAvailable}
                        onClick={handleAddToCart}
                    >
                        {isAvailable ? 'В корзину' : 'Нет в наличии'}
                    </Button>
                )}
            </Stack>
        </Card>
    );
};
