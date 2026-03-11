import React, { useState, useEffect } from "react";
import { CatalogProducts } from "../../components/Products/CatalogProducts";

export const CartList = ({ onQuantityChange }) => {
    const [cartProducts, setCartProducts] = useState([]);

    useEffect(() => {
        const loadCart = () => {
            const cart = JSON.parse(localStorage.getItem("cart")) || {};
            const products = Object.values(cart);
            setCartProducts(products);
        };
        loadCart();
    }, []);

    const handleQuantityChange = (productId, newQuantity) => {
        const updatedCart = cartProducts.map(product =>
            product.id === productId ? { ...product, quantity: newQuantity } : product
        );
        setCartProducts(updatedCart);

        const cartObject = updatedCart.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
        localStorage.setItem("cart", JSON.stringify(cartObject));

        onQuantityChange();
    };

    return (
        <>
            {cartProducts.length > 0 ? (
                <CatalogProducts
                    title="Корзина"
                    sub={false}
                    subcategories={[]}
                    products={cartProducts}
                    onQuantityChange={handleQuantityChange}
                />
            ) : (
                <p>Корзина пуста</p>
            )}
        </>
    );
};
