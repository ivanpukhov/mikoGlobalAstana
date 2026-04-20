import { useLocation } from 'react-router-dom';
import { ProductCard } from '../ProductCard/ProductCard';

export const CatalogProduct = ({ product, onQuantityChange }) => {
    const location = useLocation();
    const isCartPage = location.pathname === '/cart';

    return (
        <ProductCard
            product={product}
            mode={isCartPage ? 'cart' : 'default'}
            onQuantityChange={onQuantityChange}
        />
    );
};
