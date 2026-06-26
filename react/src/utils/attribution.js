const SOURCE_LABELS = {
    google_ads: 'Google Ads',
    google: 'Google',
    google_organic: 'Google organic',
    yandex_direct: 'Яндекс Директ',
    yandex: 'Яндекс',
    yandex_organic: 'Яндекс organic',
    instagram: 'Instagram',
    meta: 'Meta',
    meta_ads: 'Meta Ads',
    tiktok: 'TikTok',
    tiktok_ads: 'TikTok Ads',
    direct: 'Прямой заход',
    unknown: 'Не определено',
};

export const getSourceLabel = (source) => SOURCE_LABELS[source] || source || SOURCE_LABELS.unknown;

export const getSourceColor = (source) => {
    if (source === 'google_ads' || source === 'google') return 'green';
    if (source === 'yandex_direct' || source === 'yandex') return 'yellow';
    if (source === 'instagram' || source === 'meta' || source === 'meta_ads') return 'pink';
    if (source === 'direct') return 'gray';
    return 'blue';
};

export const getOrderSource = (order) => {
    if (order?.gclid || order?.gbraid || order?.wbraid) return 'google_ads';
    return order?.attributionSource || 'unknown';
};
