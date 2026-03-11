import { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import Swal from "sweetalert2";
import { Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { CartList } from "./CartList";
import api from "../../api/api";
import money from "../../images/cart/money.svg";
import kaspi from "../../images/cart/kaspi.svg";
import shop from "../../images/cart/shop.svg";
import select from "../../images/cart/select.svg";
import delivery from "../../images/cart/delivery.svg";

export const Cart = () => {
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        paymentMethod: 'kaspi',
        deliveryMethod: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [cart, setCart] = useState({});
    const [promoCode, setPromoCode] = useState(""); // Введенный пользователем промокод
    const [promoData, setPromoData] = useState(null); // Данные о промокоде
    const [isCheckingPromo, setIsCheckingPromo] = useState(false); // Флаг проверки промокода
    const [giftData, setGiftData] = useState(null);

    const navigate = useNavigate();

    const getDiscountedPrice = (product) => {
        const priceWithoutDiscount = product.price || product.prices?.[0]?.price || 0;
        const discount = product.discount || product.prices?.[0]?.discount || 0;
        return priceWithoutDiscount - (priceWithoutDiscount * discount / 100);
    };

    const recalculateTotal = () => {
        const cartData = JSON.parse(localStorage.getItem("cart")) || {};
        const validCart = {};

        const newTotal = Object.values(cartData).reduce((sum, product) => {
            if (product.quantity < 1) {
                return sum;
            }

            const discountedPrice = getDiscountedPrice(product);
            validCart[product.id] = product;

            return sum + discountedPrice * (product.quantity || 1);
        }, 0);

        localStorage.setItem("cart", JSON.stringify(validCart));
        setCart(validCart);
        setTotalPrice(newTotal);
    };

    useEffect(() => {
        recalculateTotal();

        const gift = localStorage.getItem("gift");
        if (gift) {
            api.get(`/purchased-certificates/validate/${gift}`)
                .then(response => {
                    if (response.data.valid) {
                        setGiftData(response.data);
                    } else {
                        localStorage.removeItem("gift");
                        setGiftData(null);
                        Swal.fire("Ошибка", "Сертификат больше недействителен", "error");
                    }
                })
                .catch(() => {
                    localStorage.removeItem("gift");
                    setGiftData(null);
                    Swal.fire("Ошибка", "Не удалось проверить сертификат", "error");
                });
        }
    }, []);




    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Введите имя и фамилию";
        if (!form.address.trim()) newErrors.address = "Введите адрес";
        if (form.phone.replace(/[^0-9]/g, '').length !== 11) newErrors.phone = "Введите корректный номер телефона";
        if (!form.deliveryMethod) newErrors.deliveryMethod = "Выберите способ доставки";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckPromoCode = async () => {
        if (!promoCode.trim()) {
            Swal.fire("Ошибка", "Введите промокод", "error");
            return;
        }

        setIsCheckingPromo(true);
        try {
            const response = await api.get(`/promocodes/${promoCode}`);
            setPromoData(response.data);
            Swal.fire("Промокод активирован!", `Скидка: ${response.data.discountPercentage ? response.data.discountPercentage + "%" : response.data.discountAmount + "₸"}`, "success");
        } catch (error) {
            console.error("Ошибка при проверке промокода:", error);
            setPromoData(null);
            Swal.fire("Ошибка", "Промокод недействителен или истёк", "error");
        } finally {
            setIsCheckingPromo(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const items = Object.values(cart).map(product => ({
            productId: product.id,
            quantity: product.quantity || 1
        }));

        const selectedCity = JSON.parse(localStorage.getItem("selectedCity"));
        if (!selectedCity) {
            Swal.fire("Ошибка", "Пожалуйста, выберите город.", "error");
            return;
        }

        const orderData = {
            customerName: form.name,
            customerPhone: form.phone,
            customerAddress: form.address,
            deliveryMethod: form.deliveryMethod,
            paymentMethod: form.paymentMethod,
            cityId: selectedCity.id,
            items,
            totalAmount: totalPrice, // Промокод НЕ меняет totalPrice на фронте, только передается
            promoCodeName: promoData ? promoData.name : null, // Передаем промокод на бэкенд
            giftCertificateCode: giftData ? localStorage.getItem("gift") : null, // Если есть валидный сертификат, добавляем код
        };

        try {
            setIsSubmitting(true);
            await api.post('/orders', orderData);
            if (giftData) {
                localStorage.removeItem("gift");
                setGiftData(null);
            }

            Swal.fire({
                title: "Заказ успешно оформлен!",
                text: `Ваш заказ из города ${selectedCity.name} принят.`,
                icon: "success",
                confirmButtonText: "Ок"
            });
            localStorage.removeItem("cart");
            setForm({
                name: '',
                address: '',
                phone: '',
                paymentMethod: '',
                deliveryMethod: ''
            });
            setCart({});
            setTotalPrice(0);
        } catch (error) {
            console.error("Ошибка при отправке заказа:", error);
            Swal.fire("Ошибка", "Не удалось оформить заказ. Попробуйте снова.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="cart">
            {Object.keys(cart).length === 0 ? (
                <div className="cart__empty">
                    <Empty
                        description="Ваша корзина пуста"
                    >
                        <Button type="primary" onClick={() => navigate("/categories")}>Перейти в каталог</Button>
                    </Empty>
                </div>
            ) : (
                <>
                    <div className="cart__right">
                        <div className="cart__title">Заполните данные</div>
                        <form className="cart__form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Имя и фамилия"
                                value={form.name}
                                onChange={handleChange}
                            />
                            {errors.name && <div className="error">{errors.name}</div>}

                            <input
                                type="text"
                                name="address"
                                placeholder="Адрес"
                                value={form.address}
                                onChange={handleChange}
                            />
                            {errors.address && <div className="error">{errors.address}</div>}

                            <InputMask
                                mask="+7 999 999 99 99"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            >
                                {(inputProps) => <input {...inputProps} type="text" placeholder="Номер телефона" />}
                            </InputMask>
                            {errors.phone && <div className="error">{errors.phone}</div>}
                            {totalPrice > 5000 && !giftData && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Введите промокод"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                    />
                                    {!promoData && (
                                        <button type="button" onClick={handleCheckPromoCode} disabled={isCheckingPromo}>
                                            {isCheckingPromo ? "Проверка..." : "Активировать"}
                                        </button>
                                    )}
                                </>
                            )}







                            <div className='cart__select'>
                                <div className="cart__select--title">Способ доставки</div>
                                <div className="cart__select--block">
                                    <label className="cart__select--item">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="pickup"
                                            checked={form.deliveryMethod === "pickup"}
                                            onChange={handleChange}
                                        />
                                        <img src={shop} alt=""/>
                                        Самовывоз
                                        <div className='indicator'>
                                            <img src={select} alt=""/>
                                        </div>
                                    </label>
                                    <label className="cart__select--item">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="delivery"
                                            checked={form.deliveryMethod === "delivery"}
                                            onChange={handleChange}
                                        />
                                        <img src={delivery} alt=""/>
                                        Доставка
                                        <div className='indicator'>
                                            <img src={select} alt=""/>
                                        </div>
                                    </label>


                                </div>
                                {errors.deliveryMethod && <div className="error">{errors.deliveryMethod}</div>}
                            </div>

                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Отправка..." : "Купить"}
                            </button>
                        </form>
                    </div>

                    <div className="cart__right">
                        <div className="cart__products">
                            <CartList title={"Корзина"} onQuantityChange={recalculateTotal} />
                        </div>
                        <div className="cart__total">
                            <div className="cart__total--item">
                                Итоговая цена со скидкой:{" "}
                                {giftData
                                    ? Math.max(0, totalPrice - giftData.amount)
                                    : promoData
                                        ? (promoData.discountPercentage
                                            ? totalPrice * (1 - promoData.discountPercentage / 100)
                                            : totalPrice - promoData.discountAmount)
                                        : totalPrice}{" "}
                                ₸
                            </div>
                            {giftData && (
                                <div className="cart__discount">
                                    {totalPrice > giftData.amount ? (
                                        <b>
                                            <b style={{color: 'red'}}>{giftData.amount}₸</b> оплачено сертификатом.
                                            <br />
                                            Осталось доплатить:  <b style={{color: 'red'}}>{totalPrice - giftData.amount}₸</b>
                                        </b>
                                    ) : (
                                        <b>
                                            <b style={{color: 'red'}}>{totalPrice}₸</b> оплачено сертификатом.
                                            <br />
                                            Остаток на сертификате:  <b style={{color: 'red'}}>{giftData.amount - totalPrice}₸</b>
                                        </b>
                                    )}
                                </div>
                            )}

                            {promoData && (
                                <div className="cart__discount">
                                    Применен промокод.
                                    Скидка: {promoData.discountPercentage ? promoData.discountPercentage + "%" : promoData.discountAmount + "₸"}
                                </div>
                            )}

                            <div className="cart__total--sub">
                                Цена доставки по тарифу Яндекс.
                                Доставка бесплатно при заказе от 20 000 тенге
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
