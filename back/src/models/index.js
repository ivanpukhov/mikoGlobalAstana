const sequelize = require('../config/db');
const City = require('./City');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Product = require('./Product');
const ProductPrice = require('./ProductPrice');
const Order = require('./Order');
const User = require('./UserModel');
const OrderItem = require('./OrderItem');
const ProductAttribute = require('./ProductAttribute');
const PromoCode = require('./PromoCode');
const GiftCertificate = require('./GiftCertificate');
const PurchasedCertificate = require('./PurchasedCertificate');
const NotificationSetting = require('./NotificationSetting');
const NotificationTemplate = require('./NotificationTemplate');
const OrderGiftRule = require('./OrderGiftRule');
const Banner = require('./Banner');

// Ассоциации
Category.hasMany(Subcategory, { foreignKey: 'categoryId', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Subcategory.hasMany(Product, { foreignKey: 'subcategoryId', as: 'products' });
Product.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' });

Product.hasMany(ProductPrice, { foreignKey: 'productId', as: 'prices' });
ProductPrice.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(OrderGiftRule, { foreignKey: 'productId', as: 'giftRules' });
OrderGiftRule.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

City.hasMany(ProductPrice, { foreignKey: 'cityId', as: 'productPrices' });
ProductPrice.belongsTo(City, { foreignKey: 'cityId', as: 'city' });


Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });



module.exports = {
    sequelize,
    City,
    PromoCode,
    Category,
    Subcategory,
    Product,
    Order,
    OrderItem,
    ProductPrice,
    User,
    ProductAttribute,
    GiftCertificate,
    PurchasedCertificate,
    NotificationSetting,
    NotificationTemplate,
    OrderGiftRule,
    Banner,
};
