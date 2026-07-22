const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const SITE_URL = 'https://miko-astana.kz';
const API_URL = process.env.SEO_API_BASE_URL || 'http://127.0.0.1:3000/api';
const BUILD_DIR = path.join(__dirname, 'build');
const INDEX_PATH = path.join(BUILD_DIR, 'index.html');
const DEFAULT_IMAGE = `${SITE_URL}/og-miko.jpg`;

const DEFAULT_SEO = {
    title: 'Miko Astana — корейская косметика, товары для дома и подарки',
    description: 'Магазин Miko в Астане: корейская косметика, товары для дома, посуда, подарки и полезные находки. Удобный каталог, актуальные цены и быстрая доставка.',
    canonical: '/',
    image: DEFAULT_IMAGE,
    type: 'website',
};

const STATIC_SEO = {
    '/': DEFAULT_SEO,
    '/categories': {
        title: 'Каталог корейских товаров в Астане | Miko',
        description: 'Каталог Miko: корейская косметика, товары для дома, посуда, уход, подарки и другие полезные товары с доставкой по Астане.',
        canonical: '/categories',
    },
    '/gift-certificates': {
        title: 'Подарочные сертификаты Miko — онлайн в Астане',
        description: 'Подарите близким выбор: электронные подарочные сертификаты Miko на корейскую косметику, товары для дома и приятные покупки.',
        canonical: '/gift-certificates',
    },
    '/recipes': {
        title: 'Рецепты и идеи для вкусного дня | Miko Astana',
        description: 'Пошаговые рецепты Miko: понятное приготовление, точные ингредиенты, время, порции и полезные советы для вкусных блюд.',
        canonical: '/recipes',
    },
    '/sale': {
        title: 'Товары со скидками в Астане | Miko',
        description: 'Выгодные предложения Miko: товары с подходящими сроками и честными скидками. Смотрите актуальное наличие и цены в Астане.',
        canonical: '/sale',
    },
    '/test': {
        title: 'Тест по уходу за кожей — определить тип кожи | Miko',
        description: 'Пройдите короткий тест Miko, определите свой тип кожи и получите понятные рекомендации по ежедневному уходу.',
        canonical: '/test',
    },
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
const escapeXml = escapeHtml;
const stripHtml = (value = '') => String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const shorten = (value, max = 158) => {
    const normalized = stripHtml(value);
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};
const absoluteUrl = (value, fallback = DEFAULT_IMAGE) => {
    if (!value) return fallback;
    if (/^https?:\/\//i.test(value)) return value;
    return `${SITE_URL}${value.startsWith('/api') ? value : `/api${value.startsWith('/') ? value : `/${value}`}`}`;
};
const isoDuration = (minutes) => `PT${Math.max(0, Number(minutes) || 0)}M`;

const fetchJson = async (endpoint) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, { signal: controller.signal });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#store`,
    name: 'Miko Astana',
    url: SITE_URL,
    logo: `${SITE_URL}/manifest_512x512.png`,
    image: DEFAULT_IMAGE,
    description: DEFAULT_SEO.description,
    areaServed: { '@type': 'City', name: 'Астана' },
    currenciesAccepted: 'KZT',
};

const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Miko Astana',
    alternateName: ['Miko', 'Мико Астана'],
    inLanguage: 'ru-KZ',
    publisher: { '@id': `${SITE_URL}/#store` },
};

const navigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Основные разделы Miko',
    itemListElement: [
        ['Каталог', '/categories'],
        ['Рецепты', '/recipes'],
        ['Подарочные сертификаты', '/gift-certificates'],
        ['Скидки', '/sale'],
    ].map(([name, url], index) => ({
        '@type': 'SiteNavigationElement',
        position: index + 1,
        name,
        url: `${SITE_URL}${url}`,
    })),
};

const breadcrumbs = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, url], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: `${SITE_URL}${url}`,
    })),
});

const getPageSeo = async (pathname) => {
    if (STATIC_SEO[pathname]) {
        const seo = { ...DEFAULT_SEO, ...STATIC_SEO[pathname] };
        const schemas = pathname === '/'
            ? [organizationSchema, websiteSchema, navigationSchema]
            : [breadcrumbs([['Главная', '/'], [seo.title.split('|')[0].trim(), pathname]])];
        return { ...seo, schemas };
    }

    const productMatch = pathname.match(/^\/product\/(\d+)$/);
    if (productMatch) {
        const product = await fetchJson(`/products/${productMatch[1]}`);
        if (product) {
            const description = shorten(product.description) || `Купить ${product.name} в магазине Miko в Астане. Актуальные цены, наличие и удобное оформление заказа онлайн.`;
            const title = `${shorten(product.name, 46)} | Miko Astana`;
            const categoryName = product.category?.name || 'Каталог';
            const price = product.prices?.find((item) => item.availability !== false) || product.prices?.[0];
            const image = absoluteUrl(product.image);
            const brandName = product.attributes?.find((item) => /бренд/i.test(item.name))?.value;
            return {
                title,
                description,
                canonical: pathname,
                image,
                type: 'product',
                schemas: [
                    breadcrumbs([['Главная', '/'], ['Каталог', '/categories'], [categoryName, `/catalog/${product.categoryId}`], [product.name, pathname]]),
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        description,
                        image: [image],
                        sku: String(product.id),
                        category: categoryName,
                        brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
                        offers: price ? {
                            '@type': 'Offer',
                            url: `${SITE_URL}${pathname}`,
                            priceCurrency: 'KZT',
                            price: Number(price.price || 0),
                            availability: price.availability === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                            seller: { '@id': `${SITE_URL}/#store` },
                        } : undefined,
                    },
                ],
            };
        }
    }

    const categoryMatch = pathname.match(/^\/catalog\/(\d+)$/);
    if (categoryMatch) {
        const category = await fetchJson(`/categories/${categoryMatch[1]}/subcategories`);
        if (category) {
            const title = `${category.name} — купить в Астане | Miko`;
            const description = `Купить товары категории «${category.name}» в магазине Miko в Астане. Актуальный ассортимент, цены, наличие и удобный заказ онлайн.`;
            return {
                ...DEFAULT_SEO,
                title: shorten(title, 68),
                description,
                canonical: pathname,
                schemas: [
                    breadcrumbs([['Главная', '/'], ['Каталог', '/categories'], [category.name, pathname]]),
                    {
                        '@context': 'https://schema.org',
                        '@type': 'CollectionPage',
                        name: category.name,
                        description,
                        url: `${SITE_URL}${pathname}`,
                        isPartOf: { '@id': `${SITE_URL}/#website` },
                    },
                ],
            };
        }
    }

    const recipeMatch = pathname.match(/^\/recipes\/([^/]+)$/);
    if (recipeMatch) {
        const recipe = await fetchJson(`/recipes/${encodeURIComponent(recipeMatch[1])}`);
        if (recipe) {
            const description = shorten(recipe.seoDescription || recipe.excerpt || `Пошаговый рецепт «${recipe.title}»: ингредиенты, время приготовления и понятная инструкция от Miko.`);
            const image = absoluteUrl(recipe.image);
            return {
                title: shorten(recipe.seoTitle || `${recipe.title} — пошаговый рецепт | Miko`, 68),
                description,
                canonical: pathname,
                image,
                type: 'article',
                schemas: [
                    breadcrumbs([['Главная', '/'], ['Рецепты', '/recipes'], [recipe.title, pathname]]),
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Recipe',
                        name: recipe.title,
                        description,
                        image: [image],
                        datePublished: recipe.publishedAt,
                        dateModified: recipe.updatedAt,
                        recipeCategory: recipe.category,
                        keywords: recipe.tags?.join(', '),
                        recipeYield: recipe.servings ? `${recipe.servings} порций` : undefined,
                        prepTime: isoDuration(recipe.prepTime),
                        cookTime: isoDuration(recipe.cookTime),
                        totalTime: isoDuration((recipe.prepTime || 0) + (recipe.cookTime || 0)),
                        nutrition: recipe.calories ? { '@type': 'NutritionInformation', calories: `${recipe.calories} calories` } : undefined,
                        recipeIngredient: recipe.ingredients?.map((item) => `${item.amount || ''} ${item.name}`.trim()),
                        recipeInstructions: recipe.steps?.map((step, index) => ({
                            '@type': 'HowToStep',
                            position: index + 1,
                            name: step.title || `Шаг ${index + 1}`,
                            text: step.text,
                        })),
                        author: { '@type': 'Organization', name: 'Miko Astana', url: SITE_URL },
                    },
                ],
            };
        }
    }

    const noIndex = pathname.startsWith('/admin')
        || pathname.startsWith('/cart')
        || pathname.startsWith('/search')
        || pathname.startsWith('/gift/')
        || pathname === '/catalog'
        || pathname === '/product';

    return {
        ...DEFAULT_SEO,
        title: noIndex ? 'Служебная страница | Miko Astana' : 'Страница не найдена | Miko Astana',
        description: noIndex ? DEFAULT_SEO.description : 'Запрошенная страница не найдена. Перейдите в каталог Miko и выберите нужный раздел.',
        canonical: pathname,
        noIndex: true,
        schemas: [],
    };
};

const replaceMeta = (html, attribute, key, value) => {
    const escaped = escapeHtml(value);
    const matcher = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
    const tag = `<meta ${attribute}="${key}" content="${escaped}">`;
    return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `    ${tag}\n</head>`);
};

const renderHtml = (template, seo) => {
    const canonical = `${SITE_URL}${seo.canonical || '/'}`;
    let html = template.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
    html = replaceMeta(html, 'name', 'title', seo.title);
    html = replaceMeta(html, 'name', 'description', seo.description);
    html = replaceMeta(html, 'name', 'robots', seo.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    html = replaceMeta(html, 'property', 'og:type', seo.type || 'website');
    html = replaceMeta(html, 'property', 'og:url', canonical);
    html = replaceMeta(html, 'property', 'og:title', seo.title);
    html = replaceMeta(html, 'property', 'og:description', seo.description);
    html = replaceMeta(html, 'property', 'og:image', seo.image || DEFAULT_IMAGE);
    html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = replaceMeta(html, 'name', 'twitter:title', seo.title);
    html = replaceMeta(html, 'name', 'twitter:description', seo.description);
    html = replaceMeta(html, 'name', 'twitter:image', seo.image || DEFAULT_IMAGE);

    const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}">`;
    html = /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
        ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag)
        : html.replace('</head>', `    ${canonicalTag}\n</head>`);

    const jsonLd = JSON.stringify(seo.schemas || []).replace(/</g, '\\u003c');
    const schemaTag = `<script id="seo-json-ld" type="application/ld+json">${jsonLd}</script>`;
    html = /<script\s+id=["']seo-json-ld["'][^>]*>.*?<\/script>/is.test(html)
        ? html.replace(/<script\s+id=["']seo-json-ld["'][^>]*>.*?<\/script>/is, schemaTag)
        : html.replace('</head>', `    ${schemaTag}\n</head>`);
    return html;
};

let sitemapCache = { expiresAt: 0, xml: '' };
const buildSitemap = async () => {
    if (sitemapCache.expiresAt > Date.now()) return sitemapCache.xml;

    const [categories, products, recipes] = await Promise.all([
        fetchJson('/categories'),
        fetchJson('/products'),
        fetchJson('/recipes'),
    ]);
    const today = new Date().toISOString();
    const entries = [
        { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
        { loc: '/categories', priority: '0.9', changefreq: 'daily', lastmod: today },
        { loc: '/recipes', priority: '0.8', changefreq: 'weekly', lastmod: today },
        { loc: '/gift-certificates', priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: '/sale', priority: '0.7', changefreq: 'daily', lastmod: today },
        { loc: '/test', priority: '0.5', changefreq: 'monthly', lastmod: today },
        ...(Array.isArray(categories) ? categories.map((item) => ({ loc: `/catalog/${item.id}`, priority: '0.8', changefreq: 'daily', lastmod: item.updatedAt || today })) : []),
        ...(Array.isArray(products) ? products.map((item) => ({ loc: `/product/${item.id}`, priority: '0.7', changefreq: 'weekly', lastmod: item.updatedAt || today, image: absoluteUrl(item.image, '') })) : []),
        ...(Array.isArray(recipes) ? recipes.map((item) => ({ loc: `/recipes/${item.slug}`, priority: '0.7', changefreq: 'monthly', lastmod: item.updatedAt || today, image: absoluteUrl(item.image, '') })) : []),
    ];

    const rows = entries.map((entry) => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${entry.loc}`)}</loc>\n    <lastmod>${escapeXml(new Date(entry.lastmod).toISOString())}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>${entry.image ? `\n    <image:image><image:loc>${escapeXml(entry.image)}</image:loc></image:image>` : ''}\n  </url>`).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows}\n</urlset>`;
    sitemapCache = { expiresAt: Date.now() + 10 * 60 * 1000, xml };
    return xml;
};

app.disable('x-powered-by');
app.use(express.static(BUILD_DIR, { index: false, maxAge: '1h' }));

app.get('/sitemap.xml', async (_req, res) => {
    res.type('application/xml').set('Cache-Control', 'public, max-age=600').send(await buildSitemap());
});

app.get('*', async (req, res) => {
    try {
        const template = fs.readFileSync(INDEX_PATH, 'utf8');
        const seo = await getPageSeo(req.path);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(seo.title.startsWith('Страница не найдена') ? 404 : 200).send(renderHtml(template, seo));
    } catch (error) {
        console.error('SEO render error:', error);
        res.sendFile(INDEX_PATH);
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
