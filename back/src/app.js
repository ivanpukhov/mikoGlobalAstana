const express = require('express');
const cors = require('cors');
const app = express();
const cityRoutes = require('./routes/cityRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const promocodeRoutes = require('./routes/promoCodeRoutes');
const { sequelize } = require('./models');
const { indexProducts } = require("./utils/meilisearch");
const userRoutes = require('./routes/userRoutes');
const giftCertificateRoutes = require('./routes/giftCertificateRoutes');

const purchasedCertificateRoutes = require('./routes/purchasedCertificateRoutes');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use('/api/uploads', express.static(process.env.UPLOADS_DIR));

// Подключение маршрутов
app.use('/api/orders', orderRoutes);
app.use('/api/promocodes', promocodeRoutes);
app.use('/api/gift-certificates', giftCertificateRoutes);
app.use('/api/purchased-certificates', purchasedCertificateRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
// Синхронизация базы данных и индексация
(async () => {
    try {
        await sequelize.sync();
        console.log('База данных синхронизирована.');
        await indexProducts();
        console.log('Индексация синхронизирована.');
    } catch (error) {
        console.error('Ошибка при синхронизации или индексации:', error.message);
    }
})();

module.exports = app;
