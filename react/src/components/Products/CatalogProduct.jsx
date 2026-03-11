import React, { useState, useEffect } from "react";
import { Image, InputNumber, Button } from "antd";
import styles from "./ProductItem.module.scss";
import { Link, useLocation } from "react-router-dom";
import favoriteIcon from "../../images/favorite.svg";
import placeholder from "../../images/products/i.jpg";

export const CatalogProduct = ({ product, onQuantityChange }) => {
    const { id, name, image, prices } = product;

    const originalPrice = prices[0]?.price || 0;
    const discount = prices[0]?.discount || 0;
    const discountedPrice = originalPrice - (originalPrice * discount / 100);
    const hasDiscount = discount > 0;

    const [isInCart, setIsInCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const location = useLocation();

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem("cart")) || {};
        if (cart[id]) {
            setIsInCart(true);
            setQuantity(cart[id].quantity);
        }
    }, [id]);

    const updateCartStorage = (cart) => {
        localStorage.setItem("cart", JSON.stringify(cart));
    };

    const handleCartClick = () => {
        const cart = JSON.parse(localStorage.getItem("cart")) || {};

        if (cart[id]) {
            cart[id].quantity += 1;
        } else {
            cart[id] = {
                ...product,
                quantity: 1,
            };
        }

        updateCartStorage(cart);
        setIsInCart(true);
        setQuantity(cart[id].quantity);

        if (onQuantityChange) {
            onQuantityChange(id, cart[id].quantity);
        }
    };

    const updateQuantity = (value) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || {};

        if (value < 1) {
            delete cart[id];
            setIsInCart(false);
            setQuantity(0);
        } else {
            cart[id].quantity = value;
            setQuantity(value);
        }

        updateCartStorage(cart);

        if (onQuantityChange) {
            onQuantityChange(id, value);
        }
    };

    const handleDecrement = () => {
        if (quantity === 1) {
            updateQuantity(0);
        } else {
            updateQuantity(quantity - 1);
        }
    };

    const handleIncrement = () => {
        updateQuantity(quantity + 1);
    };

    const handleFavoriteClick = () => {
        setIsFavorite(!isFavorite);
    };

    return (
        <div className={styles["products__item"]}>
            <div className={styles["products__item--img"]}>
                <Link to={`/product/${id}`}>
                    {/*<Image*/}
                    {/*    src={image ? `http://31.128.46.228:3000/${image}` : placeholder}*/}
                    {/*    alt={name}*/}
                    {/*    fallback={placeholder}*/}
                    {/*    preview={false}*/}
                    {/*/>*/}
                    <img src={`/api${image}`} alt=""/>
                </Link>
                <div
                    className={styles["favorite"]}
                    style={{ background: isFavorite ? "red" : "#0CE3CB" }}
                    onClick={handleFavoriteClick}
                >
                </div>
            </div>

            <Link to={`/product/${id}`} className={styles["products__item--name"]}>
                {name}
            </Link>

            <div className={styles["products__item--price"]}>
                <span className={styles["price"]}>{discountedPrice.toFixed(2)} ₸</span>
                {hasDiscount && (
                    <span className={styles["subprice"]}>
                        {originalPrice.toFixed(2)} ₸
                    </span>
                )}
            </div>

            {location.pathname === "/cart" && isInCart ? (
                <div className={styles["products__item--quantity"]}>
                    <Button type="default" onClick={handleDecrement}>
                        -
                    </Button>
                    <InputNumber
                        min={1}
                        value={quantity}
                        onChange={(value) => updateQuantity(value || 0)}
                        className={styles["quantity-input"]}
                    />
                    <Button type="default" onClick={handleIncrement}>
                        +
                    </Button>
                </div>
            ) : isInCart ? (
                <Link to="/cart" className={styles["products__item--btn"]}>
                    Оформить
                </Link>
            ) : (
                <div className={styles["products__item--btn"]} onClick={handleCartClick}>
                    В корзину
                </div>
            )}
        </div>
    );
};
