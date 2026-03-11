import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductForm from "./ProductForm";
import api from "../api/api";

const ProductEditPage = () => {
    const { id } = useParams();
    const [initialValues, setInitialValues] = useState(null);

    const fetchProductDetails = async () => {
        try {
            const { data } = await api.get(`/products/${id}`);

            // Преобразуем данные в удобный формат для формы
            const transformedValues = {
                name: data.name,
                description: data.description,
                categoryName: data.category?.name,
                subcategoryName: data.subcategory?.name,
                defaultPrice: data.prices?.[0]?.price || 0,
                defaultDiscount: data.prices?.[0]?.discount || 0,
                cityPrices: data.prices?.map((price) => ({
                    cityId: price.cityId,
                    price: price.price,
                    discount: price.discount,
                    availability: price.availability,
                })) || [],
                imageUrl: `/api${data.image}`,
                attributes: data.attributes?.map(attr => ({
                    name: attr.name,
                    value: attr.value
                })) || [], // Добавил поддержку атрибутов
            };

            setInitialValues(transformedValues);
        } catch (error) {
            console.error("Ошибка загрузки деталей товара:", error);
        }
    };

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    return (
        <div>
            <h1>Изменить товар</h1>
            {initialValues && <ProductForm initialValues={initialValues} productId={id} />}
        </div>
    );
};

export default ProductEditPage;
