const { Op } = require('sequelize');
const { Recipe } = require('../models');

const text = (value) => typeof value === 'string' ? value.trim() : '';
const bool = (value) => value === true || value === 'true' || value === '1';
const numberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
};
const array = (value) => {
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value || '[]'); } catch { return []; }
};
const slugify = (value) => text(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `recipe-${Date.now()}`;
const safeHtml = (value) => text(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '');

const uniqueSlug = async (requested, title, id = null) => {
    const base = slugify(requested || title);
    let candidate = base;
    let suffix = 2;
    while (await Recipe.findOne({ where: { slug: candidate, ...(id ? { id: { [Op.ne]: id } } : {}) } })) {
        candidate = `${base}-${suffix++}`;
    }
    return candidate;
};

const payloadFrom = async (req, existing = null) => {
    const title = text(req.body.title);
    if (!title) throw new Error('Укажите название рецепта.');
    const isPublished = bool(req.body.isPublished);
    const ingredients = array(req.body.ingredients)
        .map((item) => ({ name: text(item?.name), amount: text(item?.amount), group: text(item?.group) }))
        .filter((item) => item.name);
    const steps = array(req.body.steps)
        .map((item, index) => ({ title: text(item?.title), text: text(item?.text), order: index + 1 }))
        .filter((item) => item.text);

    return {
        title,
        slug: await uniqueSlug(req.body.slug, title, existing?.id),
        excerpt: text(req.body.excerpt) || null,
        content: safeHtml(req.body.content),
        image: req.file ? `/uploads/${req.file.filename}` : existing?.image || null,
        category: text(req.body.category) || 'Другое',
        tags: [...new Set(array(req.body.tags).map(text).filter(Boolean))],
        ingredients,
        steps,
        servings: numberOrNull(req.body.servings),
        prepTime: numberOrNull(req.body.prepTime),
        cookTime: numberOrNull(req.body.cookTime),
        difficulty: ['easy', 'medium', 'hard'].includes(req.body.difficulty) ? req.body.difficulty : 'easy',
        calories: numberOrNull(req.body.calories),
        isPublished,
        isFeatured: bool(req.body.isFeatured),
        publishedAt: isPublished ? (existing?.publishedAt || new Date()) : null,
        seoTitle: text(req.body.seoTitle) || null,
        seoDescription: text(req.body.seoDescription) || null,
    };
};

exports.getPublished = async (req, res) => {
    try {
        const where = { isPublished: true };
        if (text(req.query.category)) where.category = text(req.query.category);
        const recipes = await Recipe.findAll({ where, order: [['isFeatured', 'DESC'], ['publishedAt', 'DESC'], ['id', 'DESC']] });
        const tag = text(req.query.tag).toLowerCase();
        res.json(tag ? recipes.filter((recipe) => recipe.tags.some((item) => item.toLowerCase() === tag)) : recipes);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getPublishedBySlug = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ where: { slug: req.params.slug, isPublished: true } });
        if (!recipe) return res.status(404).json({ error: 'Рецепт не найден.' });
        res.json(recipe);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAdmin = async (_req, res) => {
    try { res.json(await Recipe.findAll({ order: [['updatedAt', 'DESC']] })); }
    catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAdminById = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id);
        if (!recipe) return res.status(404).json({ error: 'Рецепт не найден.' });
        res.json(recipe);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
    try { res.status(201).json(await Recipe.create(await payloadFrom(req))); }
    catch (error) { res.status(400).json({ error: error.message }); }
};

exports.update = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id);
        if (!recipe) return res.status(404).json({ error: 'Рецепт не найден.' });
        await recipe.update(await payloadFrom(req, recipe));
        res.json(recipe);
    } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id);
        if (!recipe) return res.status(404).json({ error: 'Рецепт не найден.' });
        await recipe.destroy();
        res.json({ message: 'Рецепт удалён.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
