import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { CatalogProducts } from "../../components/Products/CatalogProducts";
import { useParams } from "react-router-dom";

export const Search = () => {
    const [products, setProducts] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);

    const [city, setCity] = useState(() => JSON.parse(localStorage.getItem("selectedCity")));
    const { query } = useParams();

    useEffect(() => {
        if (!city) {
            console.error("Город не выбран!");
            setLoading(false);
            return;
        }

        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Запрос на поиск товаров
                const response = await api.get(`/products/search/city`, {
                    params: {
                        query: query,
                        cityId: city.id,
                    },
                });
                setProducts(response.data);

                const uniqueSubcategories = [
                    ...new Set(response.data.map((product) => product.subcategoryId)),
                ].filter((id) => id !== null);
                setSubcategories(uniqueSubcategories);
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [city?.id, query]);

    return (
        <>
            <CatalogProducts
                title={`Результаты поиска: "${query}"`}
                sub={false}
                subcategories={subcategories}
                products={products}
                loading={loading}
            />
        </>
    );
};
