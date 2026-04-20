import { useEffect, useState } from 'react';
import { Loader, Group, Stack, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import ProductForm from './ProductForm';

const ProductEditPage = () => {
    const { id } = useParams();
    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        api.get(`/products/${id}`).then(({ data }) => {
            setInitialValues({
                name: data.name,
                description: data.description,
                categoryName: data.category?.name,
                subcategoryName: data.subcategory?.name,
                defaultPrice: data.prices?.[0]?.price || 0,
                defaultDiscount: data.prices?.[0]?.discount || 0,
                cityPrices: data.prices?.map((p) => ({
                    cityId: p.cityId,
                    price: p.price,
                    discount: p.discount,
                    availability: p.availability,
                })) || [],
                imageUrl: `/api${data.image}`,
                attributes: data.attributes?.map((a) => ({ name: a.name, value: a.value })) || [],
            });
        }).catch(console.error);
    }, [id]);

    if (!initialValues) {
        return <Group justify="center" py="xl"><Loader color="miko" /></Group>;
    }

    return (
        <Stack gap="md" maw={800} mx="auto">
            <Title order={3} fw={700}>Изменить товар</Title>
            <ProductForm initialValues={initialValues} productId={id} />
        </Stack>
    );
};

export default ProductEditPage;
