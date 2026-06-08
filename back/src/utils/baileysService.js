const fs = require('fs/promises');
const path = require('path');
const { NotificationSetting } = require('../models');

const AUTH_DIR = process.env.BAILEYS_AUTH_DIR || path.join(__dirname, '../../database/baileys-auth');
const QR_WAIT_TIMEOUT_MS = Number(process.env.BAILEYS_QR_WAIT_TIMEOUT_MS || 8000);
const OPEN_WAIT_TIMEOUT_MS = Number(process.env.BAILEYS_OPEN_WAIT_TIMEOUT_MS || 15000);

let socket = null;
let startPromise = null;
let baileysPromise = null;
let connectionState = 'notAuthorized';
let isAuthorized = false;
let lastQr = '';
let lastError = '';
const qrWaiters = new Set();
const openWaiters = new Set();

const noopLogger = {};
for (const method of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
    noopLogger[method] = () => {};
}
noopLogger.child = () => noopLogger;
noopLogger.level = 'silent';

const getBaileys = async () => {
    if (!baileysPromise) {
        baileysPromise = import('baileys');
    }
    return baileysPromise;
};

const hasSavedCredentials = async () => {
    try {
        await fs.access(path.join(AUTH_DIR, 'creds.json'));
        return true;
    } catch {
        return false;
    }
};

const getSettings = async () => {
    const [settings] = await NotificationSetting.findOrCreate({
        where: { id: 1 },
        defaults: {
            id: 1,
            instanceState: 'notAuthorized',
            isAuthorized: false,
        },
    });

    return settings;
};

const persistState = async (state, authorized) => {
    connectionState = state;
    isAuthorized = authorized;

    const settings = await getSettings();
    settings.instanceState = state;
    settings.isAuthorized = authorized;
    await settings.save();
};

const getStatePayload = () => ({
    stateInstance: connectionState,
    isAuthorized,
    qrCode: lastQr || null,
    error: lastError || null,
});

const settleQrWaiters = (qr) => {
    for (const waiter of qrWaiters) {
        clearTimeout(waiter.timer);
        waiter.resolve(qr);
    }
    qrWaiters.clear();
};

const rejectQrWaiters = (error) => {
    for (const waiter of qrWaiters) {
        clearTimeout(waiter.timer);
        waiter.reject(error);
    }
    qrWaiters.clear();
};

const settleOpenWaiters = () => {
    for (const waiter of openWaiters) {
        clearTimeout(waiter.timer);
        waiter.resolve(socket);
    }
    openWaiters.clear();
};

const rejectOpenWaiters = (error) => {
    for (const waiter of openWaiters) {
        clearTimeout(waiter.timer);
        waiter.reject(error);
    }
    openWaiters.clear();
};

const waitForQr = () => {
    if (lastQr) return Promise.resolve(lastQr);
    if (isAuthorized) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const waiter = {
            resolve,
            reject,
            timer: setTimeout(() => {
                qrWaiters.delete(waiter);
                reject(new Error('QR пока недоступен. Повторите попытку через несколько секунд.'));
            }, QR_WAIT_TIMEOUT_MS),
        };
        qrWaiters.add(waiter);
    });
};

const waitForOpen = () => {
    if (socket && isAuthorized) return Promise.resolve(socket);

    return new Promise((resolve, reject) => {
        const waiter = {
            resolve,
            reject,
            timer: setTimeout(() => {
                openWaiters.delete(waiter);
                reject(new Error('WhatsApp не успел подключиться. Проверьте QR авторизацию.'));
            }, OPEN_WAIT_TIMEOUT_MS),
        };
        openWaiters.add(waiter);
    });
};

const closeSocket = () => {
    if (!socket) return;

    try {
        socket.ev?.removeAllListeners?.('connection.update');
        socket.ev?.removeAllListeners?.('creds.update');
        socket.ws?.close?.();
        socket.end?.(undefined);
    } catch (error) {
        console.warn('Ошибка при закрытии WhatsApp сокета:', error.message || error);
    } finally {
        socket = null;
    }
};

const startSocket = async () => {
    if (socket && ['connecting', 'authorized', 'qr'].includes(connectionState)) {
        return socket;
    }

    if (startPromise) {
        return startPromise;
    }

    startPromise = (async () => {
        await fs.mkdir(AUTH_DIR, { recursive: true });

        const {
            Browsers,
            DisconnectReason,
            default: makeWASocket,
            useMultiFileAuthState,
        } = await getBaileys();

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        lastError = '';
        await persistState('connecting', false);

        socket = makeWASocket({
            auth: state,
            browser: Browsers.macOS('Chrome'),
            logger: noopLogger,
            printQRInTerminal: false,
            syncFullHistory: false,
        });

        socket.ev.on('creds.update', saveCreds);
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                lastQr = qr;
                await persistState('qr', false);
                settleQrWaiters(qr);
            }

            if (connection === 'connecting') {
                await persistState(lastQr ? 'qr' : 'connecting', false);
            }

            if (connection === 'open') {
                lastQr = '';
                lastError = '';
                await persistState('authorized', true);
                settleOpenWaiters();
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = ![
                    DisconnectReason.loggedOut,
                    DisconnectReason.badSession,
                    DisconnectReason.forbidden,
                    DisconnectReason.multideviceMismatch,
                ].includes(statusCode);

                lastError = lastDisconnect?.error?.message || '';
                closeSocket();

                if (shouldReconnect) {
                    await persistState('disconnected', false);
                    setTimeout(() => {
                        startSocket().catch((error) => {
                            lastError = error.message || String(error);
                            console.error('Ошибка переподключения WhatsApp:', error.message || error);
                        });
                    }, statusCode === DisconnectReason.restartRequired ? 300 : 3000);
                } else {
                    lastQr = '';
                    await persistState('loggedOut', false);
                    rejectQrWaiters(new Error('WhatsApp сессия завершена. Запросите новый QR код.'));
                    rejectOpenWaiters(new Error('WhatsApp сессия завершена.'));
                }
            }
        });

        return socket;
    })();

    try {
        return await startPromise;
    } finally {
        startPromise = null;
    }
};

const getStateInstance = async () => {
    await getSettings();

    if (!socket && connectionState !== 'loggedOut') {
        try {
            await startSocket();
        } catch (error) {
            lastError = error.message || String(error);
            await persistState('error', false);
        }
    }

    return getStatePayload();
};

const getQr = async () => {
    if (isAuthorized) {
        return { type: 'authorized', message: null, ...getStatePayload() };
    }

    await startSocket();
    let qr = null;
    try {
        qr = await waitForQr();
    } catch (error) {
        lastError = error.message || String(error);
        if (!isAuthorized) {
            closeSocket();
            await persistState('notAuthorized', false);
        }

        return {
            type: 'pending',
            message: null,
            qrCode: null,
            qrImageUrl: null,
            ...getStatePayload(),
        };
    }

    if (!qr && isAuthorized) {
        return { type: 'authorized', message: null, ...getStatePayload() };
    }

    return {
        type: 'qrCode',
        message: qr,
        qrCode: qr,
        qrImageUrl: null,
        ...getStatePayload(),
    };
};

const disconnectWhatsApp = async () => {
    const activeSocket = socket;

    if (activeSocket) {
        try {
            await activeSocket.logout?.();
        } catch (error) {
            console.warn('Не удалось выполнить logout WhatsApp:', error.message || error);
        }
    }

    closeSocket();
    await fs.rm(AUTH_DIR, { recursive: true, force: true });
    lastQr = '';
    lastError = '';
    rejectQrWaiters(new Error('WhatsApp отключен.'));
    rejectOpenWaiters(new Error('WhatsApp отключен.'));
    await persistState('loggedOut', false);

    return getStatePayload();
};

const sendBaileysMessage = async ({ phoneNumber, message, imageUrl = null }) => {
    const hasCredentials = await hasSavedCredentials();

    if (!isAuthorized && (!hasCredentials || ['qr', 'loggedOut', 'error'].includes(connectionState))) {
        console.warn('Пропуск отправки WhatsApp: WhatsApp не авторизован.');
        return false;
    }

    await startSocket();
    const activeSocket = await waitForOpen();

    const formattedNumber = String(phoneNumber || '').replace(/\D/g, '');
    if (formattedNumber.length !== 11 || !formattedNumber.startsWith('7')) {
        throw new Error('Некорректный номер телефона. Ожидается формат: 77073670497.');
    }

    const chatId = `${formattedNumber}@s.whatsapp.net`;
    const payload = imageUrl
        ? { image: { url: imageUrl }, caption: message }
        : { text: message };

    await activeSocket.sendMessage(chatId, payload);
    return true;
};

module.exports = {
    disconnectWhatsApp,
    getQr,
    getSettings,
    getStateInstance,
    sendBaileysMessage,
};
