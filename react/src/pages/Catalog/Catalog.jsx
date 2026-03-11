import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { CatalogProducts } from "../../components/Products/CatalogProducts";
import { useParams } from "react-router-dom";

export const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categoryName, setCategoryName] = useState(""); // Название категории
    const [loading, setLoading] = useState(true);

    const [city, setCity] = useState(() => JSON.parse(localStorage.getItem("selectedCity")));
    const { categoryId } = useParams(); // ID категории для загрузки

    useEffect(() => {
        if (!city) {
            console.error("Город не выбран!");
            setLoading(false);
            return;
        }

        const fetchProductsAndCategory = async () => {
            try {
                setLoading(true);

                // Запрос на получение товаров
                const response = await api.get(`/products/${city.id}/category/${categoryId}/products`);
                setProducts(response.data);

                const uniqueSubcategories = [
                    ...new Set(response.data.map((product) => product.subcategoryId)),
                ].filter((id) => id !== null);
                setSubcategories(uniqueSubcategories);

                // Запрос на получение всех категорий и поиск нужной
                const categoriesResponse = await api.get(`/categories`);
                const category = categoriesResponse.data.find((cat) => cat.id === parseInt(categoryId));
                if (category) {
                    setCategoryName(category.name);
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsAndCategory();
    }, [city?.id, categoryId]);

    return (
        <>
            <CatalogProducts
                title={categoryName || "Категория"}
                sub={true}
                subcategories={subcategories}
                products={products}
                loading={loading}
            />
        </>
    );
};
