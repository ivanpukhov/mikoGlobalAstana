import { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Grid,
    Group,
    Paper,
    Radio,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconShoppingCartOff, IconTag, IconTruck } from '@tabler/icons-react';
import { CartList } from './CartList';
import api from '../../api/api';
import { EmptyState } from '../../components/ui';
import { formatCurrency } from '../../utils/formatters';
import { EVERY_ORDER_GIFT, getNextOrderGiftTier, getOrderGiftTier } from '../../utils/orderGifts';

export const Cart = () => {
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        paymentMethod: 'kaspi',
        deliveryMethod: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [cart, setCart] = useState({});
    const [promoCode, setPromoCode] = useState('');
    const [promoData, setPromoData] = useState(null);
    const [isCheckingPromo, setIsCheckingPromo] = useState(false);
    const [giftData, setGiftData] = useState(null);

    const navigate = useNavigate();

    const getDiscountedPrice = (product) => {
        const p = product.price || product.prices?.[0]?.price || 0;
        const d = product.discount || product.prices?.[0]?.discount || 0;
        return p - (p * d) / 100;
    };

    const recalculateTotal = () => {
        const cartData = JSON.parse(localStorage.getItem('cart')) || {};
        const validCart = {};
        const newTotal = Object.values(cartData).reduce((sum, product) => {
            if (!product || product.quantity < 1) return sum;
            validCart[product.id] = product;
            return sum + getDiscountedPrice(product) * (product.quantity || 1);
        }, 0);
        localStorage.setItem('cart', JSON.stringify(validCart));
        setCart(validCart);
        setTotalPrice(newTotal);
    };

    useEffect(() => {
        recalculateTotal();
        const gift = localStorage.getItem('gift');
        if (gift) {
            api.get(`/purchased-certificates/validate/${gift}`)
                .then((res) => {
                    if (res.data.valid) setGiftData(res.data);
                    else {
                        localStorage.removeItem('gift');
                        setGiftData(null);
                        Swal.fire('Ошибка', 'Сертификат больше недействителен', 'error');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('gift');
                    setGiftData(null);
                    Swal.fire('Ошибка', 'Не удалось проверить сертификат', 'error');
                });
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Введите имя и фамилию';
        if (!form.address.trim()) newErrors.address = 'Введите адрес';
        if (form.phone.replace(/[^0-9]/g, '').length !== 11) newErrors.phone = 'Введите корректный номер телефона';
        if (!form.deliveryMethod) newErrors.deliveryMethod = 'Выберите способ доставки';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckPromoCode = async () => {
        if (!promoCode.trim()) { Swal.fire('Ошибка', 'Введите промокод', 'error'); return; }
        setIsCheckingPromo(true);
        try {
            const res = await api.get(`/promocodes/${promoCode}`);
            setPromoData(res.data);
            Swal.fire(
                'Промокод активирован!',
                `Скидка: ${res.data.discountPercentage ? res.data.discountPercentage + '%' : formatCurrency(res.data.discountAmount)}`,
                'success'
            );
        } catch {
            setPromoData(null);
            Swal.fire('Ошибка', 'Промокод недействителен или истёк', 'error');
        } finally {
            setIsCheckingPromo(false);
        }
    };

    const finalPrice = giftData
        ? Math.max(0, totalPrice - giftData.amount)
        : promoData
        ? Math.max(
              0,
              promoData.discountPercentage
                  ? totalPrice * (1 - promoData.discountPercentage / 100)
                  : totalPrice - promoData.discountAmount
          )
        : totalPrice;

    const currentGiftTier = getOrderGiftTier(totalPrice);
    const nextGiftTier = getNextOrderGiftTier(totalPrice);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const items = Object.values(cart).filter(Boolean).map((product) => ({
            productId: product.id,
            quantity: product.quantity || 1,
        }));

        const selectedCity = JSON.parse(localStorage.getItem('selectedCity'));
        if (!selectedCity) { Swal.fire('Ошибка', 'Пожалуйста, выберите город.', 'error'); return; }

        const orderData = {
            customerName: form.name,
            customerPhone: form.phone,
            customerAddress: form.address,
            deliveryMethod: form.deliveryMethod,
            paymentMethod: form.paymentMethod,
            cityId: selectedCity.id,
            items,
            totalAmount: totalPrice,
            promoCodeName: promoData ? promoData.name : null,
            giftCertificateCode: giftData ? localStorage.getItem('gift') : null,
        };

        try {
            setIsSubmitting(true);
            await api.post('/orders', orderData);
            if (giftData) { localStorage.removeItem('gift'); setGiftData(null); }
            Swal.fire({ title: 'Заказ успешно оформлен!', text: `Ваш заказ из города ${selectedCity.name} принят.`, icon: 'success', confirmButtonText: 'Ок' });
            localStorage.removeItem('cart');
            setForm({ name: '', address: '', phone: '', paymentMethod: '', deliveryMethod: '' });
            setCart({});
            setTotalPrice(0);
        } catch {
            Swal.fire('Ошибка', 'Не удалось оформить заказ. Попробуйте снова.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (Object.keys(cart).length === 0) {
        return (
            <EmptyState
                icon={IconShoppingCartOff}
                title="Ваша корзина пуста"
                description="Добавьте товары из каталога, чтобы оформить заказ"
                action={
                    <Button color="miko" radius="xl" size="md" onClick={() => navigate('/categories')}>
                        Перейти в каталог
                    </Button>
                }
            />
        );
    }

    return (
        <Box mt="xl" pb="xl">
            <Grid gutter="xl" align="flex-start">
                {/* Left — order form */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Stack gap="lg">
                        <Title order={2} fw={700}>Заполните данные</Title>

                        <form onSubmit={handleSubmit}>
                            <Stack gap="md">
                                <TextInput
                                    label="Имя и фамилия"
                                    name="name"
                                    placeholder="Имя и фамилия"
                                    value={form.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    radius="md"
                                />
                                <TextInput
                                    label="Адрес"
                                    name="address"
                                    placeholder="Адрес доставки"
                                    value={form.address}
                                    onChange={handleChange}
                                    error={errors.address}
                                    radius="md"
                                />
                                <InputMask
                                    mask="+7 999 999 99 99"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                >
                                    {(inputProps) => (
                                        <TextInput
                                            {...inputProps}
                                            label="Номер телефона"
                                            placeholder="+7 777 777 77 77"
                                            error={errors.phone}
                                            radius="md"
                                        />
                                    )}
                                </InputMask>

                                {/* Promo code */}
                                {totalPrice > 5000 && !giftData && (
                                    <Group gap="sm" align="flex-end">
                                        <TextInput
                                            label="Промокод"
                                            placeholder="Введите промокод"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            radius="md"
                                            leftSection={<IconTag size={16} />}
                                            style={{ flex: 1 }}
                                            disabled={!!promoData}
                                        />
                                        {!promoData && (
                                            <Button
                                                variant="light"
                                                color="miko"
                                                onClick={handleCheckPromoCode}
                                                loading={isCheckingPromo}
                                                radius="md"
                                            >
                                                Активировать
                                            </Button>
                                        )}
                                    </Group>
                                )}

                                {/* Delivery method */}
                                <Box>
                                    <Text fw={600} mb="xs">Способ доставки</Text>
                                    <Radio.Group
                                        value={form.deliveryMethod}
                                        onChange={(v) => setForm({ ...form, deliveryMethod: v })}
                                        error={errors.deliveryMethod}
                                    >
                                        <Stack gap="sm">
                                            <Paper
                                                withBorder
                                                p="md"
                                                radius="md"
                                                style={{
                                                    borderColor: form.deliveryMethod === 'pickup' ? '#0CE3CB' : undefined,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => setForm({ ...form, deliveryMethod: 'pickup' })}
                                            >
                                                <Radio
                                                    value="pickup"
                                                    label={
                                                        <Group gap="xs">
                                                            <Text fw={500}>Самовывоз</Text>
                                                        </Group>
                                                    }
                                                    color="miko"
                                                />
                                            </Paper>
                                            <Paper
                                                withBorder
                                                p="md"
                                                radius="md"
                                                style={{
                                                    borderColor: form.deliveryMethod === 'delivery' ? '#0CE3CB' : undefined,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => setForm({ ...form, deliveryMethod: 'delivery' })}
                                            >
                                                <Radio
                                                    value="delivery"
                                                    label={
                                                        <Group gap="xs">
                                                            <IconTruck size={16} />
                                                            <Text fw={500}>Доставка</Text>
                                                        </Group>
                                                    }
                                                    color="miko"
                                                />
                                            </Paper>
                                        </Stack>
                                    </Radio.Group>
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    color="miko"
                                    radius="xl"
                                    loading={isSubmitting}
                                    mt="sm"
                                >
                                    Оформить заказ
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Grid.Col>

                {/* Right — cart contents + summary */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Stack gap="md">
                        <CartList onQuantityChange={recalculateTotal} />

                        {/* Summary */}
                        <Paper p="md" radius="lg" withBorder>
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text fw={700} size="lg">Итого со скидкой:</Text>
                                    <Text fw={700} size="xl" c="miko">{formatCurrency(finalPrice)}</Text>
                                </Group>

                                {giftData && (
                                    <Paper p="sm" radius="md" bg="green.0" style={{ border: '1px solid var(--mantine-color-green-3)' }}>
                                        {totalPrice > giftData.amount ? (
                                            <Text size="sm">
                                                <Text span c="red" fw={700}>{formatCurrency(giftData.amount)}</Text> оплачено сертификатом.
                                                Осталось доплатить: <Text span c="red" fw={700}>{formatCurrency(totalPrice - giftData.amount)}</Text>
                                            </Text>
                                        ) : (
                                            <Text size="sm">
                                                <Text span c="red" fw={700}>{formatCurrency(totalPrice)}</Text> оплачено сертификатом.
                                                Остаток: <Text span c="red" fw={700}>{formatCurrency(giftData.amount - totalPrice)}</Text>
                                            </Text>
                                        )}
                                    </Paper>
                                )}

                                {promoData && (
                                    <Text size="sm" c="green">
                                        Промокод: скидка {promoData.discountPercentage ? `${promoData.discountPercentage}%` : formatCurrency(promoData.discountAmount)}
                                    </Text>
                                )}

                                <Paper p="sm" radius="md" bg="yellow.0" style={{ border: '1px solid var(--mantine-color-yellow-3)' }}>
                                    <Text fw={600} size="sm">🎁 Подарок к заказу</Text>
                                    <Text size="sm">При каждом заказе: <Text span fw={700}>{EVERY_ORDER_GIFT}</Text></Text>
                                    {currentGiftTier ? (
                                        <Text size="sm" mt={4}>По вашей сумме: <Text span fw={700}>{currentGiftTier.gift}</Text></Text>
                                    ) : nextGiftTier ? (
                                        <Text size="sm" mt={4}>
                                            Добавьте ещё <Text span fw={700}>{formatCurrency(nextGiftTier.min - totalPrice)}</Text> и получите: <Text span fw={700}>{nextGiftTier.gift}</Text>
                                        </Text>
                                    ) : null}
                                </Paper>

                                <Text size="xs" c="dimmed">
                                    Доставка по тарифу Яндекс. Бесплатно при заказе от 20 000 ₸
                                </Text>
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Box>
    );
};
