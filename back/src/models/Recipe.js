const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const jsonText = (field, defaultValue = []) => ({
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify(defaultValue),
    get() {
        const raw = this.getDataValue(field);
        try { return JSON.parse(raw || '[]'); } catch { return defaultValue; }
    },
    set(value) { this.setDataValue(field, JSON.stringify(Array.isArray(value) ? value : defaultValue)); },
});

const Recipe = sequelize.define('Recipe', {
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    excerpt: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    image: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Другое' },
    tags: jsonText('tags'),
    ingredients: jsonText('ingredients'),
    steps: jsonText('steps'),
    servings: { type: DataTypes.INTEGER, allowNull: true },
    prepTime: { type: DataTypes.INTEGER, allowNull: true },
    cookTime: { type: DataTypes.INTEGER, allowNull: true },
    difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: false, defaultValue: 'easy' },
    calories: { type: DataTypes.INTEGER, allowNull: true },
    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    seoTitle: { type: DataTypes.STRING, allowNull: true },
    seoDescription: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

module.exports = Recipe;
