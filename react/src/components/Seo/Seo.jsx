import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://miko-astana.kz';
const DEFAULT_IMAGE = `${SITE_URL}/og-miko.jpg`;
const DEFAULT_TITLE = 'Miko Astana — корейская косметика, товары для дома и подарки';
const DEFAULT_DESCRIPTION = 'Магазин Miko в Астане: корейская косметика, товары для дома, посуда, подарки и полезные находки. Удобный каталог и быстрая доставка.';

const STATIC_PAGES = {
    '/': [DEFAULT_TITLE, DEFAULT_DESCRIPTION],
    '/categories': ['Каталог корейских товаров в Астане | Miko', 'Корейская косметика, товары для дома, посуда, уход, подарки и другие полезные товары с доставкой по Астане.'],
    '/gift-certificates': ['Подарочные сертификаты Miko — онлайн в Астане', 'Электронные подарочные сертификаты Miko на корейскую косметику, товары для дома и приятные покупки.'],
    '/recipes': ['Рецепты и идеи для вкусного дня | Miko Astana', 'Пошаговые рецепты Miko: понятное приготовление, точные ингредиенты, время, порции и полезные советы.'],
    '/sale': ['Товары со скидками в Астане | Miko', 'Выгодные предложения Miko: товары с подходящими сроками, честными скидками и актуальным наличием.'],
    '/test': ['Тест по уходу за кожей — определить тип кожи | Miko', 'Пройдите короткий тест Miko, определите свой тип кожи и получите рекомендации по ежедневному уходу.'],
};

const upsertMeta = (attribute, key, value) => {
    let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attribute, key);
        document.head.appendChild(node);
    }
    node.setAttribute('content', value);
};

export const stripHtml = (value = '') => String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const shortenSeoText = (value, max = 158) => {
    const normalized = stripHtml(value);
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

export const useSeo = ({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    canonical = '/',
    image = DEFAULT_IMAGE,
    type = 'website',
    noIndex = false,
    schemas = [],
}) => {
    const schemaJson = useMemo(() => JSON.stringify(schemas), [schemas]);

    useEffect(() => {
        const canonicalUrl = canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`;
        const imageUrl = image?.startsWith('http') ? image : `${SITE_URL}${image || '/og-miko.jpg'}`;
        document.title = title;
        upsertMeta('name', 'title', title);
        upsertMeta('name', 'description', description);
        upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
        upsertMeta('property', 'og:type', type);
        upsertMeta('property', 'og:url', canonicalUrl);
        upsertMeta('property', 'og:title', title);
        upsertMeta('property', 'og:description', description);
        upsertMeta('property', 'og:image', imageUrl);
        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', title);
        upsertMeta('name', 'twitter:description', description);
        upsertMeta('name', 'twitter:image', imageUrl);

        let canonicalLink = document.head.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonicalUrl);

        let schemaScript = document.getElementById('seo-json-ld');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = 'seo-json-ld';
            schemaScript.type = 'application/ld+json';
            document.head.appendChild(schemaScript);
        }
        schemaScript.textContent = schemaJson;
    }, [canonical, description, image, noIndex, schemaJson, title, type]);
};

export const SeoManager = () => {
    const { pathname } = useLocation();
    const isDynamic = /^\/product\/\d+$/.test(pathname)
        || /^\/catalog\/\d+$/.test(pathname)
        || /^\/recipes\/[^/]+$/.test(pathname);
    const staticPage = STATIC_PAGES[pathname];
    const noIndex = pathname.startsWith('/admin')
        || pathname.startsWith('/cart')
        || pathname.startsWith('/search')
        || pathname.startsWith('/gift/')
        || pathname === '/catalog'
        || pathname === '/product';

    useSeo({
        title: isDynamic ? document.title : (staticPage?.[0] || (noIndex ? 'Служебная страница | Miko Astana' : 'Страница не найдена | Miko Astana')),
        description: isDynamic ? (document.querySelector('meta[name="description"]')?.content || DEFAULT_DESCRIPTION) : (staticPage?.[1] || DEFAULT_DESCRIPTION),
        canonical: pathname,
        noIndex: !isDynamic && (noIndex || !staticPage),
        schemas: pathname === '/' ? [{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Miko Astana',
            alternateName: ['Miko', 'Мико Астана'],
            url: SITE_URL,
            inLanguage: 'ru-KZ',
        }] : [],
    });

    return null;
};
