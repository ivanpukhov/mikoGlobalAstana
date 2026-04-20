import { Stack, Title } from '@mantine/core';
import ProductForm from './ProductForm';

const ProductCreatePage = () => (
    <Stack gap="md" maw={800} mx="auto">
        <Title order={3} fw={700}>Добавить товар</Title>
        <ProductForm />
    </Stack>
);

export default ProductCreatePage;
