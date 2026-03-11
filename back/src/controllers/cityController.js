const { City, Product, ProductPrice } = require('../models');

const createCity = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Название города обязательно.' });

    try {
        // Проверяем, есть ли город с таким именем
        const existingCity = await City.findOne({ where: { name } });
        if (existingCity) return res.status(400).json({ error: 'Такой город уже существует.' });

        // Создаем город
        const city = await City.create({ name });

        // Копируем данные цен и скидок из первого города
        const firstCity = await City.findOne();
        if (firstCity) {
            const prices = await ProductPrice.findAll({ where: { cityId: firstCity.id } });
            for (const price of prices) {
                await ProductPrice.create({
                    productId: price.productId,
                    cityId: city.id,
                    price: price.price,
                    discount: price.discount, // Копируем скидку
                });
            }
        }

        res.status(201).json(city);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateProductPriceInCity = async (req, res) => {
    const { id: cityId, productId } = req.params;
    const { price } = req.body;

    try {
        const productPrice = await ProductPrice.findOne({ where: { cityId, productId } });
        if (!productPrice) {
            return res.status(404).json({ error: 'Цена для данного товара в этом городе не найдена.' });
        }

        productPrice.price = price;
        await productPrice.save();

        res.json(productPrice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllCities = async (req, res) => {
    try {
        const cities = await City.findAll();
        res.json(cities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    createCity,
    updateProductPriceInCity,
    getAllCities,
};
