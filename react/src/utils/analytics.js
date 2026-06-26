import api from '../api/api';

const CLIENT_ID_KEY = 'miko.analytics.clientId';
const ATTRIBUTION_KEY = 'miko.analytics.attribution';
const SESSION_ID_KEY = 'miko.analytics.sessionId';

const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'yclid', 'fbclid', 'ttclid'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const makeId = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const safeParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const getHost = (value) => {
    try {
        return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return '';
    }
};

const inferSource = ({ utm = {}, referrer = '', gclid, gbraid, wbraid, yclid, fbclid, ttclid }) => {
    const source = (utm.utm_source || '').toLowerCase();
    const referrerHost = getHost(referrer);

    if (gclid || gbraid || wbraid) return 'google_ads';
    if (yclid) return 'yandex_direct';
    if (fbclid) return 'meta_ads';
    if (ttclid) return 'tiktok_ads';
    if (source) return source;
    if (referrerHost.includes('google.')) return 'google_organic';
    if (referrerHost.includes('yandex.')) return 'yandex_organic';
    if (referrerHost.includes('instagram.')) return 'instagram';
    if (referrerHost.includes('facebook.')) return 'meta';
    if (referrerHost.includes('tiktok.')) return 'tiktok';
    if (referrerHost) return referrerHost;
    return 'direct';
};

export const getClientId = () => {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);

    if (!clientId) {
        clientId = makeId('client');
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }

    return clientId;
};

export const getSessionId = () => {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
        sessionId = makeId('session');
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
};

export const captureAttribution = () => {
    const params = new URLSearchParams(window.location.search);
    const stored = safeParse(localStorage.getItem(ATTRIBUTION_KEY));
    const utm = {};
    const clickIds = {};

    UTM_KEYS.forEach((key) => {
        const value = params.get(key);
        if (value) utm[key] = value;
    });

    CLICK_ID_KEYS.forEach((key) => {
        const value = params.get(key);
        if (value) clickIds[key] = value;
    });

    const hasCampaignData = Object.keys(utm).length > 0 || Object.keys(clickIds).length > 0;

    if (stored && !hasCampaignData) {
        return stored;
    }

    const attribution = {
        ...(stored || {}),
        capturedAt: new Date().toISOString(),
        landingPage: stored?.landingPage || `${window.location.pathname}${window.location.search}`,
        referrer: stored?.referrer || document.referrer || '',
        utm: {
            ...(stored?.utm || {}),
            ...utm,
        },
        ...clickIds,
    };

    attribution.source = inferSource({
        utm: attribution.utm,
        referrer: attribution.referrer,
        ...attribution,
    });
    attribution.medium = attribution.utm.utm_medium || attribution.medium || null;
    attribution.campaign = attribution.utm.utm_campaign || attribution.campaign || null;
    attribution.content = attribution.utm.utm_content || attribution.content || null;
    attribution.term = attribution.utm.utm_term || attribution.term || null;

    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
};

export const getAnalyticsPayload = () => ({
    clientId: getClientId(),
    sessionId: getSessionId(),
    attribution: captureAttribution(),
});

export const trackEvent = (eventName, metadata = {}) => {
    if (!eventName || typeof window === 'undefined') {
        return;
    }

    const payload = {
        ...getAnalyticsPayload(),
        eventName,
        path: `${window.location.pathname}${window.location.search}`,
        title: document.title,
        productId: metadata.productId,
        orderId: metadata.orderId,
        metadata,
    };

    api.post('/analytics/events', payload).catch(() => {});
};
