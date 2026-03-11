import styles from './Product.module.scss';
import img from '../../images/products/12.webp';
import minus from '../../images/products/minus.svg';
import plus from '../../images/products/plus.svg';
import back from '../../images/products/back.svg';
import placeholder from "../../images/products/i.jpg";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { Modal, Button, QRCode } from 'antd';

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
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (error) {
                console.error("Ошибка загрузки продукта:", error);
            }
        };
        fetchProduct();
    }, [id]);

    const selectedCity = JSON.parse(localStorage.getItem("selectedCity"));
    const cityPrice = product?.prices.find(price => price.cityId === selectedCity?.id);
    const priceWithoutDiscount = cityPrice?.price || 0;
    const discount = cityPrice?.discount || 0;
    const discountedPrice = priceWithoutDiscount - (priceWithoutDiscount * discount / 100);

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem("cart")) || {};
        if (cart[id]) {
            setIsCart(true);
            setCartQ(cart[id].quantity);
        }
    }, [id]);

    const updateCart = (newQuantity) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || {};
        if (newQuantity > 0) {
            cart[id] = {
                ...product,
                quantity: newQuantity,
                price: cityPrice.price,
                discount: cityPrice.discount
            };
            setIsCart(true);
        } else {
            delete cart[id];
            setIsCart(false);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        setCartQ(newQuantity);
    };

    const toCart = () => {
        updateCart(cartQ + 1);
    };

    const fromCart = () => {
        if (cartQ > 1) {
            updateCart(cartQ - 1);
        } else {
            updateCart(0);
        }
    };

    const toFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    const goBack = () => {
        navigate(-1);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const downloadQR = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qr.png';
        link.click();
    };

    if (!product) {
        return <div>Загрузка...</div>;
    }

    const image = product.image ? `/api${product.image}` : placeholder;

    return (
        <div className={styles['product']}>
            <div className={styles['product__title']}>
                <span onClick={goBack}><img src={back} alt=""/></span>{product.name}
            </div>
            <div className={styles['product__block']}>
                <div className={styles['product__photo']}>
                    <img src={image} alt=""/>
                    <div className={styles['product__price']}>
                        <div className={styles['product__price--title']}>При покупке на сайте</div>
                        <div className={styles['product__price--block']}>
                            <span>{priceWithoutDiscount} ₸</span>
                            <span>-{discount}%</span>
                            <span>{discountedPrice} ₸</span>
                        </div>
                    </div>
                    <div className={styles['product__btns']}>
                        <div className={styles['favorite']} onClick={toFavorite}>
                            {isFavorite ? 'Удалить из избранного' : 'В избранное'}
                        </div>
                        {isCart ? null : (
                            <div className={styles['cart']} onClick={toCart}>В корзину</div>
                        )}
                    </div>
                    {isCart && (
                        <div className={styles['isCart']}>
                            <Link to={'/cart'} className={styles['toCart']}>Перейти в корзину</Link>
                            <div className={styles['form']}>
                                <div className={styles['minus']} onClick={fromCart}>
                                    <img src={minus} alt=""/>
                                </div>
                                {cartQ}
                                <div className={styles['plus']} onClick={toCart}>
                                    <img src={plus} alt=""/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles['product__description']}>
                    <span dangerouslySetInnerHTML={{__html: product.description}}/>
                    <ul>
                        {product.attributes.map(attr => (
                            <li key={attr.id}>{attr.name}: {attr.value}</li>
                        ))}
                    </ul>
                    <Button type='dashed' className={styles['qrButton']} onClick={openModal}>QR код</Button>

                </div>
            </div>
            <Modal open={isModalOpen} onCancel={closeModal} footer={null} title="QR код">
                <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                    <QRCode value={window.location.href} size={300} />
                </div>
                <Button onClick={downloadQR} style={{ display: 'block', margin: '0 auto' }}>Скачать PNG</Button>
            </Modal>
        </div>
    );
};
