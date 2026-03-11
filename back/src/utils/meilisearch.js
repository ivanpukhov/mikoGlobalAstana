const client = require('../config/meilisearch');
const { Product, ProductPrice } = require('../models');

const indexProducts = async () => {
    const index = client.index('products'); // Название индекса
    const products = await Product.findAll({
        include: ['category', 'subcategory', 'prices'],
    });

    const documents = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category?.name,
        subcategory: product.subcategory?.name,
        price: product.prices?.[0]?.price || 0,
    }));

    await index.addDocuments(documents);
    console.log('Продукты проиндексированы.');
};

module.exports = { indexProducts };
