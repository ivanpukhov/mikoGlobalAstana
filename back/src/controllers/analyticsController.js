const { Op, fn, col, literal } = require('sequelize');
const { AnalyticsEvent, AnalyticsSession, Order } = require('../models');

const TRACKED_CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'yclid', 'fbclid', 'ttclid'];

const trimValue = (value, limit = 500) => {
    if (value === null || typeof value === 'undefined') {
        return null;
    }

    const stringValue = String(value).trim();
    return stringValue ? stringValue.slice(0, limit) : null;
};

const getIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || null;
};

const getHostFromUrl = (value) => {
    try {
        return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return '';
    }
};

const inferSource = ({ source, referrer, gclid, gbraid, wbraid, yclid, fbclid, ttclid }) => {
    const normalizedSource = trimValue(source, 120)?.toLowerCase() || '';
    const referrerHost = getHostFromUrl(referrer);

    if (gclid || gbraid || wbraid) return 'google_ads';
    if (yclid) return 'yandex_direct';
    if (fbclid) return 'meta_ads';
    if (ttclid) return 'tiktok_ads';

    if (normalizedSource) {
        if (normalizedSource.includes('google')) return 'google';
        if (normalizedSource.includes('yandex')) return 'yandex';
        if (normalizedSource.includes('instagram')) return 'instagram';
        if (normalizedSource.includes('facebook') || normalizedSource.includes('meta')) return 'meta';
        if (normalizedSource.includes('tiktok')) return 'tiktok';
        return normalizedSource;
    }

    if (referrerHost.includes('google.')) return 'google_organic';
    if (referrerHost.includes('yandex.')) return 'yandex_organic';
    if (referrerHost.includes('instagram.')) return 'instagram';
    if (referrerHost.includes('facebook.') || referrerHost.includes('l.facebook.')) return 'meta';
    if (referrerHost.includes('tiktok.')) return 'tiktok';
    if (referrerHost) return referrerHost;

    return 'direct';
};

const normalizeAttribution = (raw = {}, req) => {
    const utm = raw.utm || {};
    const clickIds = TRACKED_CLICK_IDS.reduce((acc, key) => {
        acc[key] = trimValue(raw[key] || utm[key], 255);
        return acc;
    }, {});

    const referrer = trimValue(raw.referrer || req.headers.referer, 1000);
    const source = trimValue(raw.source || raw.utm_source || utm.source || utm.utm_source, 120);

    const normalized = {
        source,
        medium: trimValue(raw.medium || raw.utm_medium || utm.medium || utm.utm_medium, 120),
        campaign: trimValue(raw.campaign || raw.utm_campaign || utm.campaign || utm.utm_campaign, 255),
        content: trimValue(raw.content || raw.utm_content || utm.content || utm.utm_content, 255),
        term: trimValue(raw.term || raw.utm_term || utm.term || utm.utm_term, 255),
        landingPage: trimValue(raw.landingPage || raw.landing_page, 1000),
        referrer,
        ...clickIds,
    };

    normalized.source = inferSource(normalized);
    return normalized;
};

const upsertSession = async ({ sessionId, clientId, attribution, req }) => {
    const now = new Date();
    const [session, created] = await AnalyticsSession.findOrCreate({
        where: { sessionId },
        defaults: {
            sessionId,
            clientId,
            ...attribution,
            firstSeenAt: now,
            lastSeenAt: now,
            userAgent: trimValue(req.headers['user-agent'], 1000),
            ip: trimValue(getIp(req), 120),
        },
    });

    if (!created) {
        session.clientId = session.clientId || clientId;
        session.lastSeenAt = now;
        session.userAgent = trimValue(req.headers['user-agent'], 1000) || session.userAgent;
        session.ip = trimValue(getIp(req), 120) || session.ip;

        Object.entries(attribution).forEach(([key, value]) => {
            if (value || !session[key]) {
                session[key] = value;
            }
        });

        await session.save();
    }

    return session;
};

const trackEvent = async (req, res) => {
    try {
        const {
            sessionId,
            clientId,
            eventName,
            path,
            title,
            productId,
            orderId,
            metadata,
            attribution,
        } = req.body;

        const normalizedSessionId = trimValue(sessionId, 120);
        const normalizedClientId = trimValue(clientId, 120);
        const normalizedEventName = trimValue(eventName, 120);

        if (!normalizedSessionId || !normalizedClientId || !normalizedEventName) {
            return res.status(400).json({ error: 'sessionId, clientId и eventName обязательны.' });
        }

        const normalizedAttribution = normalizeAttribution(attribution, req);

        await upsertSession({
            sessionId: normalizedSessionId,
            clientId: normalizedClientId,
            attribution: normalizedAttribution,
            req,
        });

        const event = await AnalyticsEvent.create({
            sessionId: normalizedSessionId,
            clientId: normalizedClientId,
            eventName: normalizedEventName,
            path: trimValue(path, 1000),
            title: trimValue(title, 500),
            productId: productId ? Number(productId) : null,
            orderId: orderId ? Number(orderId) : null,
            metadata: metadata && typeof metadata === 'object' ? metadata : null,
        });

        res.status(201).json({ success: true, id: event.id });
    } catch (error) {
        console.error('Ошибка записи аналитики:', error);
        res.status(500).json({ error: error.message });
    }
};

const getDateRange = (query) => {
    const fallbackEnd = new Date();
    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 30);

    const startDate = query.startDate ? new Date(query.startDate) : fallbackStart;
    const endDate = query.endDate ? new Date(query.endDate) : fallbackEnd;

    return {
        startDate: Number.isNaN(startDate.getTime()) ? fallbackStart : startDate,
        endDate: Number.isNaN(endDate.getTime()) ? fallbackEnd : endDate,
    };
};

const toPlainStats = (rows) => rows.map((row) => row.get({ plain: true }));

const getAnalyticsSummary = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const createdAt = { [Op.between]: [startDate, endDate] };

        const [
            sessions,
            pageViews,
            events,
            totalOrders,
            attributedOrders,
            googleAdsOrders,
            googleAdsRevenue,
            sourceSessionsRows,
            sourceOrdersRows,
            campaignRows,
            topPagesRows,
            eventRows,
            recentSessionsRows,
        ] = await Promise.all([
            AnalyticsSession.count({ where: { firstSeenAt: createdAt } }),
            AnalyticsEvent.count({ where: { eventName: 'page_view', createdAt } }),
            AnalyticsEvent.count({ where: { createdAt } }),
            Order.count({ where: { createdAt } }),
            Order.count({
                where: {
                    createdAt,
                    [Op.or]: [
                        { analyticsSessionId: { [Op.ne]: null } },
                        { attributionSource: { [Op.ne]: null } },
                    ],
                },
            }),
            Order.count({
                where: {
                    createdAt,
                    [Op.or]: [
                        { gclid: { [Op.ne]: null } },
                        { gbraid: { [Op.ne]: null } },
                        { wbraid: { [Op.ne]: null } },
                        { attributionSource: { [Op.in]: ['google', 'google_ads'] } },
                    ],
                },
            }),
            Order.sum('totalAmount', {
                where: {
                    createdAt,
                    [Op.or]: [
                        { gclid: { [Op.ne]: null } },
                        { gbraid: { [Op.ne]: null } },
                        { wbraid: { [Op.ne]: null } },
                        { attributionSource: { [Op.in]: ['google', 'google_ads'] } },
                    ],
                },
            }),
            AnalyticsSession.findAll({
                attributes: [
                    'source',
                    [fn('COUNT', col('id')), 'sessions'],
                ],
                where: { firstSeenAt: createdAt },
                group: ['source'],
                order: [[literal('sessions'), 'DESC']],
            }),
            Order.findAll({
                attributes: [
                    ['attributionSource', 'source'],
                    [fn('COUNT', col('id')), 'orders'],
                    [fn('SUM', col('totalAmount')), 'revenue'],
                ],
                where: { createdAt },
                group: ['attributionSource'],
                order: [[literal('orders'), 'DESC']],
            }),
            Order.findAll({
                attributes: [
                    ['attributionSource', 'source'],
                    'attributionCampaign',
                    [fn('COUNT', col('id')), 'orders'],
                    [fn('SUM', col('totalAmount')), 'revenue'],
                ],
                where: {
                    createdAt,
                    attributionCampaign: { [Op.ne]: null },
                },
                group: ['attributionSource', 'attributionCampaign'],
                order: [[literal('orders'), 'DESC']],
                limit: 20,
            }),
            AnalyticsEvent.findAll({
                attributes: [
                    'path',
                    [fn('COUNT', col('id')), 'views'],
                ],
                where: { eventName: 'page_view', createdAt },
                group: ['path'],
                order: [[literal('views'), 'DESC']],
                limit: 15,
            }),
            AnalyticsEvent.findAll({
                attributes: [
                    'eventName',
                    [fn('COUNT', col('id')), 'count'],
                ],
                where: { createdAt },
                group: ['eventName'],
                order: [[literal('count'), 'DESC']],
            }),
            AnalyticsSession.findAll({
                where: { lastSeenAt: createdAt },
                order: [['lastSeenAt', 'DESC']],
                limit: 10,
            }),
        ]);

        const sourceMap = new Map();
        toPlainStats(sourceSessionsRows).forEach((row) => {
            const source = row.source || 'direct';
            sourceMap.set(source, {
                source,
                sessions: Number(row.sessions || 0),
                orders: 0,
                revenue: 0,
            });
        });
        toPlainStats(sourceOrdersRows).forEach((row) => {
            const source = row.source || 'unknown';
            const existing = sourceMap.get(source) || {
                source,
                sessions: 0,
                orders: 0,
                revenue: 0,
            };
            existing.orders = Number(row.orders || 0);
            existing.revenue = Number(row.revenue || 0);
            sourceMap.set(row.source, existing);
        });

        const recentSessions = recentSessionsRows.map((session) => session.get({ plain: true }));
        const sessionIds = recentSessions.map((session) => session.sessionId);
        const [recentEvents, recentOrders] = sessionIds.length
            ? await Promise.all([
                AnalyticsEvent.findAll({
                    where: { sessionId: { [Op.in]: sessionIds } },
                    order: [['createdAt', 'DESC']],
                    limit: 80,
                }),
                Order.findAll({
                    where: { analyticsSessionId: { [Op.in]: sessionIds } },
                    order: [['createdAt', 'DESC']],
                    limit: 30,
                }),
            ])
            : [[], []];

        const eventsBySession = recentEvents.reduce((acc, event) => {
            const plain = event.get({ plain: true });
            acc[plain.sessionId] = acc[plain.sessionId] || [];
            if (acc[plain.sessionId].length < 8) {
                acc[plain.sessionId].push(plain);
            }
            return acc;
        }, {});

        const ordersBySession = recentOrders.reduce((acc, order) => {
            const plain = order.get({ plain: true });
            acc[plain.analyticsSessionId] = acc[plain.analyticsSessionId] || [];
            acc[plain.analyticsSessionId].push(plain);
            return acc;
        }, {});

        res.json({
            range: { startDate, endDate },
            totals: {
                sessions,
                pageViews,
                events,
                totalOrders,
                attributedOrders,
                googleAdsOrders,
                googleAdsRevenue: Number(googleAdsRevenue || 0),
                conversionRate: sessions > 0 ? (totalOrders / sessions) * 100 : 0,
            },
            sources: Array.from(sourceMap.values()).sort((a, b) => b.sessions + b.orders - (a.sessions + a.orders)),
            campaigns: toPlainStats(campaignRows).map((row) => ({
                ...row,
                orders: Number(row.orders || 0),
                revenue: Number(row.revenue || 0),
            })),
            topPages: toPlainStats(topPagesRows).map((row) => ({
                ...row,
                path: row.path || '/',
                views: Number(row.views || 0),
            })),
            eventsByName: toPlainStats(eventRows).map((row) => ({
                ...row,
                count: Number(row.count || 0),
            })),
            recentSessions: recentSessions.map((session) => ({
                ...session,
                events: eventsBySession[session.sessionId] || [],
                orders: ordersBySession[session.sessionId] || [],
            })),
        });
    } catch (error) {
        console.error('Ошибка получения аналитики:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    normalizeAttribution,
    trackEvent,
    getAnalyticsSummary,
};
