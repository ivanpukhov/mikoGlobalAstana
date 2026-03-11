// controllers/orderController.js
const {Order, OrderItem, Product, City, User, PromoCode, PurchasedCertificate} = require('../models');
const {sequelize} = require('../models');
const {Op, fn, col, literal} = require('sequelize');
const moment = require("moment");
const sendNotification = require('../utils/notificationService');


const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ message: "Заказ не найден" });
        }

        await OrderItem.destroy({ where: { orderId: id } });
        await order.destroy();

        res.json({ message: "Заказ успешно удален" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Создать заказ
const createOrder = async (req, res) => {
    const {
        customerName,
        customerPhone,
        customerAddress,
        deliveryMethod,
        paymentMethod,
        cityId,
        items,
        totalAmount,
        promoCodeName,
        giftCertificateCode
    } = req.body;

    if (!cityId) return res.status(400).json({ error: 'Город обязателен для заказа.' });

    const transaction = await sequelize.transaction();

    try {
        const city = await City.findByPk(cityId);
        if (!city) return res.status(404).json({ error: 'Город не найден.' });

        let finalTotalAmount = totalAmount;
        let appliedPromoCode = null;
        let usedGiftCertificate = null;

        // Применение промокода
        if (promoCodeName) {
            appliedPromoCode = await PromoCode.findOne({ where: { name: promoCodeName }, transaction });

            if (appliedPromoCode && appliedPromoCode.usageCount < appliedPromoCode.usageLimit && new Date() <= appliedPromoCode.expirationDate) {
                if (appliedPromoCode.discountPercentage) {
                    finalTotalAmount -= (finalTotalAmount * appliedPromoCode.discountPercentage) / 100;
                } else if (appliedPromoCode.discountAmount) {
                    finalTotalAmount -= appliedPromoCode.discountAmount;
                }
                finalTotalAmount = Math.max(finalTotalAmount, 0);
                appliedPromoCode.usageCount += 1;
                await appliedPromoCode.save({ transaction });
            }
        }

        // Использование подарочного сертификата
        if (giftCertificateCode) {
            usedGiftCertificate = await PurchasedCertificate.findOne({ where: { code: giftCertificateCode }, transaction });

            if (!usedGiftCertificate || usedGiftCertificate.status !== 'активирован') {
                return res.status(400).json({ error: 'Сертификат недействителен или уже использован.' });
            }

            finalTotalAmount = Math.max(finalTotalAmount - usedGiftCertificate.amount, 0);
            usedGiftCertificate.status = 'использован';
            await usedGiftCertificate.save({ transaction });
        }

        // Создание заказа
        const order = await Order.create({
            customerName,
            customerPhone,
            customerAddress,
            deliveryMethod,
            paymentMethod,
            cityId,
            totalAmount: finalTotalAmount,
            promoCodeId: appliedPromoCode ? appliedPromoCode.id : null,
            giftCertificateCode: usedGiftCertificate ? usedGiftCertificate.code : null,
            status: null // статус создается пустым
        }, { transaction });

        let orderedItemsDetails = [];
        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction });
            if (!product) continue;

            const price = product.prices?.[0]?.price || 0;

            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price,
            }, { transaction });

            orderedItemsDetails.push({
                name: product.name,
                quantity: item.quantity,
                price
            });
        }

        await transaction.commit();

        // Формирование сообщения с деталями
        const itemsDetailsText = orderedItemsDetails.map(
            (item) => `• ${item.name}\n  Количество: ${item.quantity}`
        ).join('\n\n');

        const promoText = appliedPromoCode
            ? `🎁 Промокод: *${appliedPromoCode.name}* (скидка ${appliedPromoCode.discountPercentage ? appliedPromoCode.discountPercentage + '%' : appliedPromoCode.discountAmount + ' KZT'})`
            : '';

        const certificateText = usedGiftCertificate
            ? `🎁 Оплачен подарочным сертификатом: *${usedGiftCertificate.code}* (на сумму ${usedGiftCertificate.amount} KZT)`
            : '';

        const customerMessage = `
📦 *Ваш заказ успешно создан!*

*Информация о заказе:*
- Имя клиента: *${customerName}*
- Номер телефона: *${customerPhone}*
- Адрес доставки: *${customerAddress}*
- Способ доставки: *${deliveryMethod}*
- Способ оплаты: *${paymentMethod}*
- Сумма заказа: *${finalTotalAmount} KZT*
${promoText}
${certificateText}

*Товары:*
${itemsDetailsText}

✨ Спасибо за ваш заказ! Мы свяжемся с вами для подтверждения. Хорошего дня! 😊
    `;
        await sendNotification(customerPhone, customerMessage);

        // Уведомление администраторам
        const usersToNotify = await User.findAll({
            where: {
                [Op.or]: [
                    { cityId },
                    { cityId: null }
                ]
            }
        });

        const orderLink = `https://miko-astana.kz/admin/orders/${order.id}`;
        const cityMessage = `
🔔 *Новый заказ в вашем городе${city.name ? `: ${city.name}` : ''}!*

*Детали заказа:*
- Имя клиента: *${customerName}*
- Номер телефона: *${customerPhone}*
- Адрес доставки: *${customerAddress}*
- Способ доставки: *${deliveryMethod}*
- Способ оплаты: *${paymentMethod}*
- Сумма заказа: *${finalTotalAmount} KZT*
${promoText}
${certificateText}

*Товары:*
${itemsDetailsText}

🖥️ Для просмотра подробностей перейдите по ссылке: 
${orderLink}

✨ Спасибо за вашу работу! Удачного дня! 😊
    `;

        for (const user of usersToNotify) {
            await sendNotification(user.phoneNumber, cityMessage);
        }

        // Получение заказа с деталями
        const createdOrder = await Order.findByPk(order.id, {
            include: [
                { model: City, as: 'city' },
                { model: PromoCode, as: 'promoCode', attributes: ['name', 'discountPercentage', 'discountAmount'] },
                { model: PurchasedCertificate, as: 'giftCertificate', attributes: ['code', 'amount', 'status'] },
                {
                    model: OrderItem,
                    as: 'items',
                    include: {
                        model: Product,
                        as: 'product',
                        attributes: ['name']
                    }
                }
            ]
        });

        res.status(201).json(createdOrder);
    } catch (error) {
        await transaction.rollback();
        console.error('Ошибка при создании заказа:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['в обработке', 'выполнен', 'отклонен'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Недопустимый статус' });
    }

    try {
        const order = await Order.findByPk(id, {
            include: [
                { model: City, as: 'city' }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Заказ не найден' });

        order.status = status;
        await order.save();

        const clientMessage = `
📦 *Обновление по вашему заказу!*

Здравствуйте, *${order.customerName}* 👋

Статус вашего заказа №${order.id} был обновлён:
📌 Новый статус: *${status.toUpperCase()}*

Спасибо, что выбрали нас! 😊  
С любовью, команда *Miko-Astana*
        `;

        await sendNotification(order.customerPhone, clientMessage);

        const usersToNotify = await User.findAll({
            where: {
                [Op.or]: [
                    { cityId: order.cityId },
                    { cityId: null }
                ]
            }
        });

        const adminMessage = `
🔔 *Изменение статуса заказа!*

Статус заказа №${order.id} был изменён:
👤 Клиент: *${order.customerName}*
📞 Телефон: *${order.customerPhone}*
🏙️ Город: *${order.city?.name || 'Неизвестно'}*
📌 Новый статус: *${status.toUpperCase()}*

🖥️ Ссылка на заказ: https://miko-astana.kz/admin/orders/${order.id}
        `;

        for (const user of usersToNotify) {
            await sendNotification(user.phoneNumber, adminMessage);
        }

        res.json({ message: 'Статус заказа обновлён и уведомления отправлены', order });
    } catch (error) {
        console.error("Ошибка при обновлении статуса:", error);
        res.status(500).json({ error: error.message });
    }
};

// Получить заказы по номеру телефона
const getOrdersByPhone = async (req, res) => {
    const {phone} = req.params;

    try {
        const orders = await Order.findAll({
            where: {customerPhone: phone},
            include: {
                model: OrderItem,
                as: 'items',
                include: {model: Product, as: 'product'},
            },
        });

        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.json({orders, totalAmount});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Получить список всех заказов с фильтрацией и сортировкой
const getAllOrders = async (req, res) => {
    // Извлекаем параметры из запроса
    const {
        cityId,
        customerName,
        deliveryMethod,
        paymentMethod,
        sortBy,
        sortOrder = "ASC", // По умолчанию сортировка - по возрастанию
        startDate,
        endDate,
    } = req.query;

    try {
        const where = {};

        // Фильтр по городу
        if (cityId) where.cityId = cityId;

        // Фильтр по имени клиента
        if (customerName) where.customerName = {[Op.iLike]: `%${customerName}%`};

        // Фильтр по способу доставки
        if (deliveryMethod) where.deliveryMethod = deliveryMethod;

        // Фильтр по способу оплаты
        if (paymentMethod) where.paymentMethod = paymentMethod;

        // Фильтр по диапазону дат с учетом времени
        if (startDate && endDate) {
            const start = new Date(startDate); // Начальная дата
            start.setHours(0, 0, 0, 0); // Устанавливаем время начала дня

            const end = new Date(endDate); // Конечная дата
            end.setHours(23, 59, 59, 999); // Устанавливаем время конца дня

            where.createdAt = {
                [Op.between]: [start, end],
            };
        } else if (startDate) {
            // Если задана только начальная дата
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            where.createdAt = {
                [Op.gte]: start, // Сравнение "больше или равно"
            };
        } else if (endDate) {
            // Если задана только конечная дата
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            where.createdAt = {
                [Op.lte]: end, // Сравнение "меньше или равно"
            };
        }

        // Запрос в базу данных
        const orders = await Order.findAll({
            where, // Фильтры
            include: [
                {model: City, as: "city"}, // Присоединяем данные о городе
                {
                    model: OrderItem,
                    as: "items",
                    include: {model: Product, as: "product"}, // Включаем данные о продуктах
                },
            ],
            order: sortBy ? [[sortBy, sortOrder]] : undefined, // Сортировка
        });

        // Если заказы не найдены, возвращаем пустой массив
        if (orders.length === 0) {
            return res.json([]); // Пустой массив вместо 404 ошибки
        }

        // Возвращаем результаты
        res.json(orders);
    } catch (error) {
        console.error("Ошибка при получении заказов:", error);
        res.status(500).json({error: error.message});
    }
};

const getOrdersByCity = async (req, res) => {
    const {cityId} = req.params;

    try {
        const orders = await Order.findAll({
            where: {cityId},
            include: [
                {model: City, as: 'city'},
                {model: OrderItem, as: 'items', include: {model: Product, as: 'product'}}
            ]
        });

        if (orders.length === 0) {
            return res.status(404).json({message: "В этом городе заказы не найдены"});
        }

        res.json(orders);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Получить конкретный заказ по ID
const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findByPk(id, {
            include: [
                { model: City, as: 'city' },
                { model: PromoCode, as: 'promoCode', attributes: ['name', 'discountPercentage', 'discountAmount'] },
                {
                    model: OrderItem,
                    as: 'items',
                    include: {
                        model: Product,
                        as: 'product',
                        attributes: ['name']
                    }
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Заказ не найден" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getOrderStatistics = async (req, res) => {
    const {startDate, endDate, cityId} = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({error: 'Укажите начальную и конечную дату.'});
    }

    try {
        const timezone = 'Asia/Almaty';

        const startMoment = moment.tz(startDate, timezone);
        const endMoment = moment.tz(endDate, timezone);

        const where = {
            createdAt: {
                [Op.gte]: startMoment.toDate(),
                [Op.lte]: endMoment.toDate(),
            },
        };

        if (cityId && cityId !== 'all') {
            where.cityId = Number(cityId);
        }

        const totalOrders = await Order.count({where});
        const totalAmount = await Order.sum('totalAmount', {where});

        const averageOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

        const averageItemsPerOrderResult = await OrderItem.findAll({
            attributes: [[fn('AVG', col('quantity')), 'averageItems']],
            include: [{
                model: Order,
                as: 'order',
                where,
            }],
        });
        const averageItemsPerOrder = parseFloat(averageItemsPerOrderResult[0]?.dataValues?.averageItems || 0);

        const uniqueCustomersCount = await Order.count({
            distinct: true,
            col: 'customerPhone',
            where,
        });

        let geoDistribution = {};
        if (!cityId || cityId === 'all') {
            geoDistribution = await Order.findAll({
                attributes: [
                    'cityId',
                    [fn('COUNT', col('id')), 'orderCount'],
                    [fn('SUM', col('totalAmount')), 'totalRevenue']
                ],
                group: ['cityId'],
            });
        }

        const repeatOrderRate =
            uniqueCustomersCount > 0
                ? ((totalOrders - uniqueCustomersCount) / totalOrders) * 100
                : 0;

        const peakOrderTimes = await Order.findAll({
            attributes: [
                [fn('strftime', '%H', col('createdAt')), 'hour'],
                [fn('COUNT', col('id')), 'orderCount']
            ],
            where,
            group: ['hour'],
            order: [[literal('orderCount'), 'DESC']],
        });

        const ordersByWeekday = await Order.findAll({
            attributes: [
                [fn('strftime', '%w', col('createdAt')), 'weekday'],
                [fn('COUNT', col('id')), 'orderCount']
            ],
            where,
            group: ['weekday'],
            order: [[col('weekday'), 'ASC']],
        });

        const popularCategories = await OrderItem.findAll({
            attributes: [
                [fn('COUNT', col('productId')), 'productCount'],
                [col('product.categoryId'), 'categoryId']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['categoryId'],
            }],
            group: ['product.categoryId'],
            order: [[literal('productCount'), 'DESC']],
        });

        const topProductsBySales = await OrderItem.findAll({
            attributes: [
                'productId',
                [fn('SUM', col('quantity')), 'totalSales']
            ],
            group: ['productId'],
            order: [[literal('totalSales'), 'DESC']],
            limit: 10
        });

        const topProductsByRevenue = await OrderItem.findAll({
            attributes: [
                'productId',
                [literal('SUM(quantity * price)'), 'totalRevenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name'],
            }],
            group: ['productId'],
            order: [[literal('totalRevenue'), 'DESC']],
            limit: 10
        });

        const getTimeDistribution = async (startMoment, endMoment, where) => {
            const diffInDays = endMoment.diff(startMoment, 'days');
            let periodUnit; // Интервал группировки
            let periodFormat;

            if (diffInDays <= 2) {
                periodUnit = 'hour';
                periodFormat = '%Y-%m-%d %H:00'; // Часовой интервал
            } else if (diffInDays <= 30) {
                periodUnit = 'day';
                periodFormat = '%Y-%m-%d'; // Дневной интервал
            } else if (diffInDays <= 730) {
                periodUnit = 'month';
                periodFormat = '%Y-%m'; // Месячный интервал
            } else {
                periodUnit = 'year';
                periodFormat = '%Y'; // Годовой интервал
            }

            // Генерация всех периодов
            const allPeriods = [];
            const currentMoment = startMoment.clone();

            while (currentMoment.isBefore(endMoment) || currentMoment.isSame(endMoment)) {
                allPeriods.push(currentMoment.format(periodUnit === 'hour' ? 'YYYY-MM-DD HH:00' : `YYYY-MM${periodUnit === 'day' ? '-DD' : ''}`));
                currentMoment.add(1, periodUnit);
            }

            const timeDistributionData = await Order.findAll({
                attributes: [
                    [fn('strftime', periodFormat, col('createdAt')), 'period'],
                    [fn('COUNT', col('id')), 'orderCount'],
                    [fn('SUM', col('totalAmount')), 'totalAmount'],
                ],
                where,
                group: [fn('strftime', periodFormat, col('createdAt'))],
                order: [[literal('period'), 'ASC']],
            });

            return allPeriods.map((period) => {
                const data = timeDistributionData.find((d) => d.dataValues.period === period);
                return {
                    period,
                    orderCount: data ? parseInt(data.dataValues.orderCount, 10) : 0,
                    totalAmount: data ? parseFloat(data.dataValues.totalAmount) : 0,
                };
            });
        };

        const timeDistribution = await getTimeDistribution(startMoment, endMoment, where);

        res.json({
            totalOrders,
            totalAmount,
            averageOrderAmount,
            averageItemsPerOrder,
            uniqueCustomersCount,
            repeatOrderRate,
            geoDistribution,
            peakOrderTimes,
            ordersByWeekday,
            popularCategories,
            topProductsBySales,
            topProductsByRevenue,
            timeDistribution
        });
    } catch (error) {
        console.error("Ошибка при получении статистики заказов:", error);
        res.status(500).json({error: error.message});
    }
};
module.exports = {createOrder, updateOrderStatus, getAllOrders, deleteOrder, getOrdersByPhone, getOrdersByCity, getOrderById, getOrderStatistics};
