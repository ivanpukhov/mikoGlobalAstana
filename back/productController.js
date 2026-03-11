const {sequelize} = require('../models');
const {indexProducts} = require('../utils/meilisearch');
const {Category, Subcategory, Product, City, ProductPrice} = require('../models');
const client = require('../config/meilisearch'); // Подключение к Meilisearch

// Получение всех товаров
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: ['category', 'subcategory', 'prices'],
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Обновление цены товара в городе
const updateProductPrice = async (req, res) => {
    const { cityId, productId } = req.params;
    const { price } = req.body;

    if (!price || price <= 0) {
        return res.status(400).json({ error: 'Цена должна быть больше 0.' });
    }

    try {
        const productPrice = await ProductPrice.findOne({ where: { cityId, productId } });
        if (!productPrice) {
            return res.status(404).json({ error: 'Цена для данного товара в этом городе не найдена.' });
        }

        productPrice.price = price;
        await productPrice.save();

        res.json({ success: true, productPrice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




const createProducts = async (req, res) => {
    try {
        const products = JSON.parse(req.body.products); // Парсинг JSON из FormData

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: "Ожидается массив продуктов." });
        }

        const createdProducts = [];

        for (const productData of products) {
            const {
                name, description, categoryName, subcategoryName, defaultPrice, cityPrices, image, defaultDiscount = 0
            } = productData;

            const parsedCityPrices = Array.isArray(cityPrices) ? cityPrices : [];

            let category = await Category.findOne({ where: { name: categoryName } });
            if (!category) {
                category = await Category.create({ name: categoryName });
            }

            let subcategory = await Subcategory.findOne({
                where: { name: subcategoryName, categoryId: category.id },
            });
            if (!subcategory) {
                subcategory = await Subcategory.create({ name: subcategoryName, categoryId: category.id });
            }

            const imagePath = req.file ? `/uploads/${req.file.filename}` : image || null;

            const product = await Product.create({
                name,
                description, // Сохраняем HTML-разметку "как есть"
                categoryId: category.id,
                subcategoryId: subcategory.id,
                image: imagePath,
            });

            const cities = await City.findAll();

            const cityPricesMap = parsedCityPrices.length
                ? Object.fromEntries(parsedCityPrices.map(({ cityId, price, discount }) => [
                    cityId, { price, discount: discount ?? defaultDiscount }
                ]))
                : {};

            for (const city of cities) {
                const { price = defaultPrice, discount = defaultDiscount } = cityPricesMap[city.id] || {};

                await ProductPrice.create({
                    productId: product.id, cityId: city.id, price, discount,
                });
            }

            const index = client.index('products');
            await index.addDocuments([{
                id: product.id,
                name: product.name,
                description: product.description,
                category: category.name,
                subcategory: subcategory.name,
                price: defaultPrice,
                discount: defaultDiscount,
            }]);

            createdProducts.push(product);
        }

        res.status(201).json(createdProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Получение товара по ID
const getProductById = async (req, res) => {
    const {id} = req.params;
    try {
        const product = await Product.findByPk(id, {
            include: ['category', 'subcategory', 'prices'],
        });
        if (!product) return res.status(404).json({error: 'Товар не найден.'});

        res.json(product);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};






// Создание товара

// const createProduct = async (req, res) => {
//     const {name, description, categoryName, subcategoryName, defaultPrice, cityPrices} = req.body;
//
//     try {
//         // Проверяем, что `cityPrices` является массивом
//         const parsedCityPrices = Array.isArray(cityPrices) ? cityPrices : [];
//
//         // Найти или создать категорию
//         let category = await Category.findOne({where: {name: categoryName}});
//         if (!category) {
//             category = await Category.create({name: categoryName});
//         }
//
//         // Найти или создать подкатегорию
//         let subcategory = await Subcategory.findOne({
//             where: {name: subcategoryName, categoryId: category.id},
//         });
//         if (!subcategory) {
//             subcategory = await Subcategory.create({name: subcategoryName, categoryId: category.id});
//         }
//
//         // Создать товар
//         const product = await Product.create({
//             name,
//             description,
//             categoryId: category.id,
//             subcategoryId: subcategory.id,
//             image: req.file ? `/uploads/${req.file.filename}` : null,
//         });
//
//         // Получить все города
//         const cities = await City.findAll();
//
//         // Подготовить карту цен и скидок для городов
//         const cityPricesMap = parsedCityPrices.length ? Object.fromEntries(parsedCityPrices.map(({
//                                                                                                      cityId,
//                                                                                                      price,
//                                                                                                      discount
//                                                                                                  }) => [cityId, {
//             price, discount: discount ?? 0
//         },])) : {};
//
//         const defaultDiscount = cityPricesMap[1]?.discount ?? 0; // Основной город
//
//         // Установить цены и скидки
//         for (const city of cities) {
//             const {price = defaultPrice, discount = defaultDiscount} = cityPricesMap[city.id] || {};
//
//             await ProductPrice.create({
//                 productId: product.id, cityId: city.id, price, discount,
//             });
//         }
//
//         // Индексируем продукт в Meilisearch
//         const index = client.index('products');
//         await index.addDocuments([{
//             id: product.id,
//             name: product.name,
//             description: product.description,
//             category: category.name,
//             subcategory: subcategory.name,
//             price: defaultPrice,
//         }]);
//
//         res.status(201).json(product);
//     } catch (error) {
//         res.status(500).json({error: error.message});
//     }
// };


// Обновление доступности товара
const updateProductAvailability = async (req, res) => {
    const {cityId, productId} = req.params;
    const {availability} = req.body;

    try {
        const productPrice = await ProductPrice.findOne({where: {cityId, productId}});
        if (!productPrice) {
            return res.status(404).json({error: 'Цена для данного товара в этом городе не найдена.'});
        }

        productPrice.availability = availability;
        await productPrice.save();

        res.json(productPrice);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Получение продуктов по категории в городе
const getProductsByCategoryInCity = async (req, res) => {
    const {cityId, categoryId} = req.params;
    const {subcategoryId} = req.query; // Опциональный параметр subcategoryId

    try {
        const whereCondition = {
            cityId, availability: true, // Только доступные продукты
        };

        // Основной запрос к базе данных
        const products = await Product.findAll({
            where: {
                categoryId, ...(subcategoryId && {subcategoryId: subcategoryId}), // Добавляем фильтр по подкатегории, если указан
            }, include: {
                model: ProductPrice,
                as: 'prices',
                where: whereCondition,
                attributes: ['price', 'discount', [sequelize.literal('price - (price * discount / 100)'), 'discountedPrice'],],
            },
        });

        if (products.length === 0) {
            return res.status(404).json({error: 'Продукты не найдены для указанной категории или подкатегории.'});
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};


// Обновление скидки товара
const updateProductDiscount = async (req, res) => {
    const {cityId, productId} = req.params;
    const {discount} = req.body;

    try {
        const productPrice = await ProductPrice.findOne({where: {cityId, productId}});
        if (!productPrice) {
            return res.status(404).json({error: 'Цена для данного товара в этом городе не найдена.'});
        }

        productPrice.discount = discount;
        await productPrice.save();

        res.json({
            productPrice, discountedPrice: productPrice.price - (productPrice.price * discount / 100),
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Получение товаров по городу
const getProductsByCity = async (req, res) => {
    const {cityId} = req.params;

    try {
        const products = await Product.findAll({
            include: {
                model: ProductPrice,
                as: 'prices',
                where: {cityId, availability: true},
                attributes: ['price', 'discount', [sequelize.literal('price - (price * discount / 100)'), 'discountedPrice']],
            },
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const searchProductsByCity = async (req, res) => {
    const { query, cityId } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Параметр query обязателен.' });
    }

    if (!cityId) {
        return res.status(400).json({ error: 'Параметр cityId обязателен.' });
    }

    try {
        const index = client.index('products');

        // Выполняем поиск в Meilisearch
        const searchResults = await index.search(query, {
            limit: 200,
            attributesToSearchOn: ['name', 'description', 'category', 'subcategory'], // Поля для поиска
            matchingStrategy: 'all', // Стратегия поиска
        });

        // Получаем ID продуктов из результатов поиска
        const productIds = searchResults.hits.map(hit => hit.id);

        if (productIds.length === 0) {
            return res.status(404).json({ error: 'Продукты не найдены.' });
        }

        // Запрашиваем информацию о продуктах в базе данных
        const products = await Product.findAll({
            where: { id: productIds },
            include: {
                model: ProductPrice,
                as: 'prices',
                where: { cityId, availability: true }, // Фильтрация по городу и доступности
                attributes: [
                    'price',
                    'discount',
                    [sequelize.literal('price - (price * discount / 100)'), 'discountedPrice'],
                ],
            },
        });

        if (products.length === 0) {
            return res.status(404).json({ error: 'Продукты не найдены для указанного города.' });
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const searchProducts = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Параметр query обязателен.' });
    }

    try {
        const index = client.index('products');
        const searchResults = await index.search(query, {
            limit: 20,
            attributesToSearchOn: ['name', 'description', 'category', 'subcategory'], // Поля для поиска
            matchingStrategy: 'all', // Задаем стратегию поиска
        });

        res.json(searchResults.hits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Функция подсказок в поиске
const getSearchSuggestions = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Параметр query обязателен.' });
    }

    try {
        const index = client.index('products');
        const suggestions = await index.search(query, {
            limit: 100, // Получаем больше результатов для точного фильтра
            attributesToSearchOn: ['name', 'category', 'subcategory', 'description'], // Учитываем описание
            matchingStrategy: 'all', // Используем стратегию совпадений по всем атрибутам
        });

        // Фильтруем результаты по началу строки
        const words = suggestions.hits.flatMap(hit => [
            hit.name,
            hit.category,
            hit.subcategory,
            hit.description,
        ]).filter(word => word && word.toLowerCase().startsWith(query.toLowerCase())); // Сравнение по началу строки

        // Убираем дубликаты
        const uniqueWords = [...new Set(words)];

        res.json(uniqueWords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllIndexedDocuments = async (req, res) => {
    try {
        const index = client.index('products');
        const documents = await index.getDocuments({
            limit: 1000, // Максимальное количество документов для извлечения
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error)
    }
};





const createProductsJson = async (req, res) => {
    const products = req.body; // Массив продуктов

    if (!Array.isArray(products)) {
        return res.status(400).json({error: "Ожидается массив продуктов."});
    }

    try {
        const createdProducts = [];

        for (const productData of products) {
            const {
                name, description, categoryName, subcategoryName, defaultPrice, cityPrices, image, defaultDiscount = 0
            } = productData;

            // Проверяем, что `cityPrices` является массивом
            const parsedCityPrices = Array.isArray(cityPrices) ? cityPrices : [];

            // Найти или создать категорию
            let category = await Category.findOne({where: {name: categoryName}});
            if (!category) {
                category = await Category.create({name: categoryName});
            }

            // Найти или создать подкатегорию
            let subcategory = await Subcategory.findOne({
                where: {name: subcategoryName, categoryId: category.id},
            });
            if (!subcategory) {
                subcategory = await Subcategory.create({name: subcategoryName, categoryId: category.id});
            }

            // Определить изображение
            const imagePath = req.file ? `/uploads/${req.file.filename}` : image ? image : null;

            // Создать продукт
            const product = await Product.create({
                name, description, categoryId: category.id, subcategoryId: subcategory.id, image: imagePath,
            });

            // Получить все города
            const cities = await City.findAll();

            // Подготовить карту цен и скидок для городов
            const cityPricesMap = parsedCityPrices.length ? Object.fromEntries(parsedCityPrices.map(({
                                                                                                         cityId,
                                                                                                         price,
                                                                                                         discount
                                                                                                     }) => [cityId, {
                price, discount: discount ?? defaultDiscount
            },])) : {};

            // Установить цены и скидки
            for (const city of cities) {
                const {price = defaultPrice, discount = defaultDiscount} = cityPricesMap[city.id] || {};

                await ProductPrice.create({
                    productId: product.id, cityId: city.id, price, discount,
                });
            }

            // Индексируем продукт в Meilisearch
            const index = client.index('products');
            await index.addDocuments([{
                id: product.id,
                name: product.name,
                description: product.description,
                category: category.name,
                subcategory: subcategory.name,
                price: defaultPrice,
                discount: defaultDiscount,
            }]);

            createdProducts.push(product);
        }

        res.status(201).json(createdProducts);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};


// Обновление товара
const updateProduct = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).json({ error: 'ID товара отсутствует в запросе.' });
        }

        const productsData = req.body.products;
        const image = req.file;

        if (!productsData) {
            return res.status(400).json({ error: 'Данные товара (products) не переданы.' });
        }

        let parsedProducts;
        try {
            parsedProducts = JSON.parse(productsData);
        } catch (parseError) {
            return res.status(400).json({ error: 'Ошибка парсинга JSON из products.', details: parseError.message });
        }

        const productData = parsedProducts[0];

        if (!productData.name) {
            return res.status(400).json({ error: 'Название товара (name) не передано или пустое.' });
        }
        if (!productData.categoryName) {
            return res.status(400).json({ error: 'Название категории (categoryName) не передано или пустое.' });
        }
        if (!productData.subcategoryName) {
            return res.status(400).json({ error: 'Название подкатегории (subcategoryName) не передано или пустое.' });
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: `Товар с ID ${id} не найден.` });
        }

        let category = await Category.findOne({ where: { name: productData.categoryName } });
        if (!category) {
            category = await Category.create({ name: productData.categoryName });
        }

        let subcategory = await Subcategory.findOne({
            where: { name: productData.subcategoryName, categoryId: category.id },
        });
        if (!subcategory) {
            subcategory = await Subcategory.create({ name: productData.subcategoryName, categoryId: category.id });
        }

        const imagePath = image ? `/uploads/${image.filename}` : product.image;

        product.name = productData.name;
        product.description = productData.description || product.description;
        product.categoryId = category.id;
        product.subcategoryId = subcategory.id;
        product.image = imagePath;
        await product.save();

        const cityPrices = productData.cityPrices || [];
        if (!Array.isArray(cityPrices)) {
            return res.status(400).json({ error: 'Цены для городов (cityPrices) должны быть массивом.' });
        }

        const cities = await City.findAll();
        const cityPricesMap = Object.fromEntries(
            cityPrices.map(({ cityId, price, discount }) => [cityId, { price, discount }])
        );

        for (const city of cities) {
            const { price = productData.defaultPrice, discount = productData.defaultDiscount } = cityPricesMap[city.id] || {};

            const productPrice = await ProductPrice.findOne({ where: { cityId: city.id, productId: product.id } });

            if (productPrice) {
                if (price !== undefined) productPrice.price = price;
                if (discount !== undefined) productPrice.discount = discount;
                await productPrice.save();
            } else if (price !== undefined) {
                await ProductPrice.create({
                    productId: product.id,
                    cityId: city.id,
                    price,
                    discount,
                });
            }
        }

        const index = client.index('products');
        await index.updateDocuments([
            {
                id: product.id,
                name: product.name,
                description: product.description,
                category: category.name,
                subcategory: subcategory.name,
                price: productData.defaultPrice,
                discount: productData.defaultDiscount,
            },
        ]);

        res.json({ success: true, product });
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
    }
};

// Удаление товара
const deleteProduct = async (req, res) => {
    const {id} = req.params;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({error: 'Товар не найден.'});
        }

        await ProductPrice.destroy({where: {productId: id}}); // Удаляем все цены
        await product.destroy(); // Удаляем сам товар

        // Удаляем из Meilisearch
        const index = client.index('products');
        await index.deleteDocument(id);

        res.json({message: 'Товар успешно удалён.'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};



module.exports = {
    getAllProducts,
    getProductById,
    // createProduct,
    createProducts,
    updateProductAvailability,
    updateProductDiscount,
    getProductsByCity,
    getProductsByCategoryInCity,
    searchProducts,
    updateProductPrice,
    getSearchSuggestions,
    getAllIndexedDocuments,
    searchProductsByCity,
    createProductsJson,
    updateProduct,
    deleteProduct,
};
