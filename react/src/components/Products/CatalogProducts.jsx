import React, { useState, useEffect } from "react";
import styles from "./ProductsList.module.scss";
import { CatalogProduct } from "./CatalogProduct";
import {useParams} from "react-router-dom"; // Компонент товара

export const CatalogProducts = ({ title, sub, products, loading, onQuantityChange }) => {
    const [subcategories, setSubcategories] = useState([]);
    const [activeSub, setActiveSub] = useState(null);
    const { categoryId } = useParams(); // Получаем categoryId из URL
    // Загружаем подкатегории при загрузке компонента
    useEffect(() => {
        const fetchSubcategories = async () => {
            try {
                const response = await fetch(`/api/categories/${categoryId}/subcategories`);
                const data = await response.json();
                setSubcategories(data.subcategories);
            } catch (error) {
                console.error("Ошибка загрузки подкатегорий:", error);
            }
        };

        fetchSubcategories();
    }, [categoryId]);

    // Фильтруем товары по выбранной подкатегории
    const filteredProducts = activeSub === null
        ? products
        : products.filter((product) => product.subcategoryId === activeSub);

    const handleSubClick = (subcategoryId) => {
        setActiveSub(subcategoryId);
    };

    const handleQuantityChange = (productId, newQuantity) => {
        if (onQuantityChange) {
            onQuantityChange(productId, newQuantity);
        }
    };

    return (
        <div className={styles.products}>
            <div className={styles.products__title}>{title}</div>

            {/* Блок фильтрации по подкатегориям */}
            {sub && subcategories.length > 0 && (
                <div className={styles.sub}>
                    <div
                        className={`${styles.sub__item} ${activeSub === null ? styles.active : ""}`}
                        onClick={() => handleSubClick(null)}
                    >
                        Все
                    </div>
                    {subcategories.map((subcategory) => (
                        <div
                            key={subcategory.id}
                            className={`${styles.sub__item} ${
                                activeSub === subcategory.id ? styles.active : ""
                            }`}
                            onClick={() => handleSubClick(subcategory.id)}
                        >
                            {subcategory.name}
                        </div>
                    ))}
                </div>
            )}

            {/* Список товаров */}
            <div className={styles.products__list}>
                {loading ? (
                    <p>Загрузка...</p>
                ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <CatalogProduct
                            key={product.id}
                            product={product}
                            onQuantityChange={handleQuantityChange}
                        />
                    ))
                ) : (
                    <p>Товары не найдены</p>
                )}
            </div>
        </div>
    );
};
