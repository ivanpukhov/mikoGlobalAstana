import './App.scss';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Main } from './pages/Main';
import NotFound from './pages/NotFound';
import { Product } from './pages/Product/Product';
import { Catalog } from './pages/Catalog/Catalog';
import { Cart } from './pages/Cart/Cart';
import { Categories } from './pages/Category/Categories';
import { Search } from './pages/Search/Search';
import AdminLayout from './components/AdminLayout';
import CitiesPage from './pages/CitiesPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import StatisticsPage from './pages/StatisticsPage';
import ProductListPage from './pages/ProductListPage';
import ProductCreatePage from './pages/ProductCreatePage';
import ProductEditPage from './pages/ProductEditPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import UserCreatePage from './pages/UserCreatePage';
import PromocodesPage from './pages/PromocodesPage';
import { GiftValidate } from './pages/Gift/GiftValedate';
import GiftCertificatesPage from './pages/GiftCertificatesPage';
import GiftCertificatesShop from './pages/GiftCertificatesShop';
import PurchasedCertificatesPage from './pages/PurchasedCertificatesPage';
import api from './api/api';
import { PageLoader } from './components/ui';
import SkinTypeTest from './pages/Test/Test';
import NotificationsPage from './pages/NotificationsPage';
import FloatingFeedback from './components/FloatingFeedback';
import { AppHeader } from './components/AppHeader/AppHeader';
import { DesktopFooter } from './components/DesktopFooter/DesktopFooter';
import { MobileBottomBar } from './components/MobileBottomBar/MobileBottomBar';
import { CityModal } from './components/CityModal/CityModal';

function App() {
    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        const savedCity = localStorage.getItem('selectedCity');

        if (savedCity) {
            setSelectedCity(JSON.parse(savedCity));
            setLoading(false);
        } else {
            const fetchCities = async () => {
                try {
                    const response = await api.get('/cities');
                    if (response.data && response.data.length > 0) {
                        const firstCity = response.data[0];
                        setSelectedCity(firstCity);
                        localStorage.setItem('selectedCity', JSON.stringify(firstCity));
                    } else {
                        console.error('Данные о городах отсутствуют.');
                    }
                } catch (error) {
                    console.error('Ошибка при получении городов:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchCities();
        }
    }, []);

    function isLocalStorageSupported() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    if (!isLocalStorageSupported()) {
        alert('Ваш браузер не поддерживает локальное хранилище. Обновите его или откройте наш сайт в другом браузере.');
    }

    const handleCitySelect = (city) => {
        localStorage.setItem('selectedCity', JSON.stringify(city));
        setSelectedCity(city);
        setIsCityModalOpen(false);
        window.location.reload();
    };

    if (loading) {
        return <PageLoader label="Загрузка данных…" minHeight="100vh" />;
    }

    return (
        <div className="App">
            {!isAdminRoute && (
                <AppHeader
                    selectedCity={selectedCity}
                    onOpenCityModal={() => setIsCityModalOpen(true)}
                />
            )}

            {!isAdminRoute ? (
                <main className="storeMain">
                    <div className="storeContainer">
                    <Routes>
                        <Route path="/" element={<Main />} />
                        <Route path="/product" element={<Product />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/gift/:id" element={<GiftValidate />} />
                        <Route path="/product/:id" element={<Product />} />
                        <Route path="/gift-certificates" element={<GiftCertificatesShop />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route path="/catalog/:categoryId" element={<Catalog />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/test" element={<SkinTypeTest />} />
                        <Route path="/search/:query" element={<Search />} />
                        <Route path="/*" element={<NotFound />} />
                    </Routes>
                    </div>
                </main>
            ) : (
                <Routes>
                    <Route path="/admin/*" element={<AdminLayout />}>
                        <Route path="products" element={<ProductListPage />} />
                        <Route path="products/create" element={<ProductCreatePage />} />
                        <Route path="products/view/:id" element={<ProductDetailsPage />} />
                        <Route path="products/edit/:id" element={<ProductEditPage />} />
                        <Route path="cities" element={<CitiesPage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="promocodes" element={<PromocodesPage />} />
                        <Route path="statistics" element={<StatisticsPage />} />
                        <Route path="orders/:orderId" element={<OrderDetailsPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="users/create" element={<UserCreatePage />} />
                        <Route path="gift-certificates" element={<GiftCertificatesPage />} />
                        <Route path="purchased-certificates" element={<PurchasedCertificatesPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                    </Route>
                    <Route path="/admin/login" element={<LoginPage />} />
                </Routes>
            )}

            {!isAdminRoute && <DesktopFooter selectedCity={selectedCity} />}
            {!isAdminRoute && <MobileBottomBar />}
            {!isAdminRoute && (
                <CityModal
                    open={isCityModalOpen}
                    onClose={() => setIsCityModalOpen(false)}
                    onCitySelect={handleCitySelect}
                />
            )}
            {!isAdminRoute && <FloatingFeedback />}
        </div>
    );
}

export default function RootApp() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
        </Router>
    );
}
