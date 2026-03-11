import React, { useState, useEffect } from "react";
import api from "../../api/api";
import {CatalogProducts} from "./CatalogProducts";
import {Link} from "react-router-dom";

export const ProductsList = () => {
    const [productsByCategory, setProductsByCategory] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState(() => JSON.parse(localStorage.getItem("selectedCity")));

    useEffect(() => {
        if (!city) {
            console.error("Город не выбран!");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                // Запрос категорий
                const categoriesResponse = await api.get("/categories");
                const categoriesData = categoriesResponse.data;

                setCategories(categoriesData);

                // Запрос продуктов
                const productsResponse = await api.get(`/products/${city.id}/products`);
                const productsData = productsResponse.data;

                // Группировка продуктов по categoryId
                const groupedProducts = productsData.reduce((acc, product) => {
                    const categoryId = product.categoryId;
                    if (!acc[categoryId]) acc[categoryId] = [];
                    acc[categoryId].push(product);
                    return acc;
                }, {});

                // Ограничение до 10 товаров в каждой категории
                Object.keys(groupedProducts).forEach((categoryId) => {
                    groupedProducts[categoryId] = groupedProducts[categoryId].slice(0, 12);
                });

                setProductsByCategory(groupedProducts);
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [city?.id]);

    // Функция для поиска названия категории по ID
    const getCategoryName = (categoryId) => {
        const category = categories.find((cat) => cat.id === Number(categoryId));
        return category ? category.name : `Категория ${categoryId}`;
    };

    return (
        <>
            {loading ? (
                <p>Загрузка...</p>
            ) : (
                Object.keys(productsByCategory).map((categoryId) => {
                    const products = productsByCategory[categoryId];
                    const title = getCategoryName(categoryId); // Название категории из списка
                    return (
                        <>
                            <CatalogProducts
                                key={categoryId}
                                title={title}
                                sub={false}
                                subcategories={[]}
                                products={products}
                                loading={false}
                            />
                            <Link to={`/catalog/${categoryId}`} className="show_more">
                                Показать ещё
                            </Link>
                        </>
                    );
                })
            )}
        </>
    );
};
