import { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import api from '../../api/api';
import { CatalogProducts } from './CatalogProducts';
import { ProductGridSkeleton } from '../ui';
import { Link } from 'react-router-dom';

export const ProductsList = () => {
    const [productsByCategory, setProductsByCategory] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [city] = useState(() => JSON.parse(localStorage.getItem('selectedCity')));

    useEffect(() => {
        if (!city) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [categoriesRes, productsRes] = await Promise.all([
                    api.get('/categories'),
                    api.get(`/products/${city.id}/products`),
                ]);

                const categoriesData = categoriesRes.data;
                setCategories(categoriesData);

                const grouped = productsRes.data.reduce((acc, product) => {
                    const cid = product.categoryId;
                    if (!acc[cid]) acc[cid] = [];
                    acc[cid].push(product);
                    return acc;
                }, {});

                // Limit to 12 per category
                Object.keys(grouped).forEach((cid) => {
                    grouped[cid] = grouped[cid].slice(0, 12);
                });

                setProductsByCategory(grouped);
            } catch (err) {
                console.error('Ошибка при загрузке:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [city?.id]);

    const getCategoryName = (categoryId) => {
        const cat = categories.find((c) => c.id === Number(categoryId));
        return cat ? cat.name : `Категория ${categoryId}`;
    };

    if (loading) {
        return (
            <>
                <ProductGridSkeleton count={12} />
            </>
        );
    }

    return (
        <>
            {Object.keys(productsByCategory).map((categoryId) => (
                <div key={categoryId}>
                    <CatalogProducts
                        title={getCategoryName(categoryId)}
                        sub={false}
                        subcategories={[]}
                        products={productsByCategory[categoryId]}
                        loading={false}
                    />
                    <Button
                        component={Link}
                        to={`/catalog/${categoryId}`}
                        variant="outline"
                        color="miko"
                        fullWidth
                        radius="xl"
                        mt="sm"
                        mb="xl"
                        size="md"
                    >
                        Показать ещё
                    </Button>
                </div>
            ))}
        </>
    );
};
