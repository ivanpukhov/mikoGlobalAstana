import { useEffect, useRef, useState } from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    List,
    Modal,
    Paper,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
    UnstyledButton,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconDownload,
    IconHeart,
    IconHeartFilled,
    IconMinus,
    IconPlus,
    IconQrcode,
    IconShoppingCart,
} from '@tabler/icons-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import { formatCurrency } from '../../utils/formatters';
import placeholder from '../../images/products/i.jpg';
import styles from './Product.module.scss';

export const Product = () => {
    const [product, setProduct] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isCart, setIsCart] = useState(false);
    const [cartQ, setCartQ] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const qrRef = useRef(null);

    useEffect(() => {
        api.get(`/products/${id}`)
            .then((res) => setProduct(res.data))
            .catch((err) => console.error('Ошибка загрузки продукта:', err));
    }, [id]);

    const selectedCity = JSON.parse(localStorage.getItem('selectedCity'));
    const cityPrice = product?.prices.find((p) => p.cityId === selectedCity?.id);
    const priceWithoutDiscount = cityPrice?.price || 0;
    const discount = cityPrice?.discount || 0;
    const discountedPrice = priceWithoutDiscount - (priceWithoutDiscount * discount) / 100;

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        if (cart[id]) { setIsCart(true); setCartQ(cart[id].quantity); }
    }, [id]);

    const updateCart = (newQuantity) => {
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        if (newQuantity > 0) {
            cart[id] = { ...product, quantity: newQuantity, price: cityPrice?.price, discount: cityPrice?.discount };
            setIsCart(true);
        } else {
            delete cart[id];
            setIsCart(false);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        setCartQ(newQuantity);
    };

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qr.png';
        link.click();
    };

    if (!product) {
        return (
            <Box mt="xl">
                <Skeleton height={40} width="60%" mb="xl" radius="md" />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                    <Skeleton height={400} radius="lg" />
                    <Stack gap="md">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} height={20} radius="sm" />)}
                    </Stack>
                </SimpleGrid>
            </Box>
        );
    }

    const image = product.image ? `/api${product.image}` : placeholder;

    return (
        <Box mt="xl" pb="xl">
            {/* Back + title */}
            <Group mb="lg" gap="sm" wrap="nowrap">
                <ActionIcon variant="light" radius="lg" size="lg" onClick={() => navigate(-1)}>
                    <IconArrowLeft size={18} />
                </ActionIcon>
                <Title order={2} fw={700} style={{ lineHeight: 1.3 }}>
                    {product.name}
                </Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                {/* Left — image + cart controls */}
                <Card radius="lg" p="md">
                    <Box pos="relative">
                        <img
                            src={image}
                            alt={product.name}
                            style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: 420, objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = placeholder; }}
                        />
                        {discount > 0 && (
                            <Badge color="red" pos="absolute" top={10} left={10} size="lg">
                                -{discount}%
                            </Badge>
                        )}
                    </Box>

                    {/* Price block */}
                    <Paper p="md" radius="md" bg="gray.0" mt="md">
                        <Text size="sm" c="dimmed" mb={4}>При покупке на сайте</Text>
                        <Group gap="sm" align="baseline">
                            {discount > 0 && (
                                <Text c="dimmed" td="line-through" size="lg">
                                    {formatCurrency(priceWithoutDiscount)}
                                </Text>
                            )}
                            <Text fw={800} size="2rem" c="miko">
                                {formatCurrency(discountedPrice)}
                            </Text>
                        </Group>
                    </Paper>

                    {/* Cart controls */}
                    <Stack gap="sm" mt="md">
                        {isCart ? (
                            <>
                                <Button
                                    component={Link}
                                    to="/cart"
                                    fullWidth
                                    color="miko"
                                    radius="xl"
                                    size="md"
                                    leftSection={<IconShoppingCart size={18} />}
                                >
                                    Перейти в корзину
                                </Button>
                                <Group gap={8} justify="center">
                                    <ActionIcon variant="default" radius="md" size="lg" onClick={() => updateCart(cartQ - 1)}>
                                        <IconMinus size={16} />
                                    </ActionIcon>
                                    <Text fw={700} size="xl" maw={60} ta="center">{cartQ}</Text>
                                    <ActionIcon variant="default" radius="md" size="lg" onClick={() => updateCart(cartQ + 1)}>
                                        <IconPlus size={16} />
                                    </ActionIcon>
                                </Group>
                            </>
                        ) : (
                            <Button
                                fullWidth
                                color="miko"
                                radius="xl"
                                size="md"
                                leftSection={<IconShoppingCart size={18} />}
                                onClick={() => updateCart(1)}
                            >
                                В корзину
                            </Button>
                        )}
                        <Group gap="sm">
                            <Button
                                flex={1}
                                variant="light"
                                color={isFavorite ? 'red' : 'miko'}
                                radius="xl"
                                leftSection={isFavorite ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                                onClick={() => setIsFavorite((v) => !v)}
                            >
                                {isFavorite ? 'В избранном' : 'В избранное'}
                            </Button>
                            <Button
                                variant="light"
                                color="gray"
                                radius="xl"
                                leftSection={<IconQrcode size={16} />}
                                onClick={() => setIsModalOpen(true)}
                            >
                                QR
                            </Button>
                        </Group>
                    </Stack>
                </Card>

                {/* Right — description + attributes */}
                <Card radius="lg" p="md">
                    <Stack gap="md">
                        <Box>
                            <Text fw={600} mb="xs">Описание</Text>
                            <div
                                className={styles.description}
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </Box>

                        {product.attributes?.length > 0 && (
                            <>
                                <Divider />
                                <Box>
                                    <Text fw={600} mb="sm">Характеристики</Text>
                                    <SimpleGrid cols={2} spacing="xs">
                                        {product.attributes.map((attr) => (
                                            <Paper key={attr.id} p="xs" radius="md" bg="gray.0">
                                                <Text size="xs" c="dimmed">{attr.name}</Text>
                                                <Text size="sm" fw={500}>{attr.value}</Text>
                                            </Paper>
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            </>
                        )}
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* QR Modal */}
            <Modal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="QR-код товара"
                size="sm"
            >
                <Stack align="center" gap="md">
                    <div ref={qrRef}>
                        <QRCodeCanvas value={window.location.href} size={260} />
                    </div>
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={downloadQR}
                        radius="md"
                    >
                        Скачать PNG
                    </Button>
                </Stack>
            </Modal>
        </Box>
    );
};
