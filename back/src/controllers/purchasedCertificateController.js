const { PurchasedCertificate, GiftCertificate, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const sendNotification = require('../utils/notificationService');
const { getRenderedTemplate } = require('../utils/templateService');

async function notifyAdminsAboutCertificate(action, certificate) {
    const admins = await User.findAll({ where: { cityId: null } });

    const text = await getRenderedTemplate(
        'certificate.general',
        {
            action,
            id: certificate.id,
            code: certificate.code,
            status: certificate.status,
            amount: certificate.amount,
            senderPhone: certificate.senderPhone,
            recipientPhone: certificate.recipientPhone,
            message: certificate.message || '-',
            certificateName: certificate.giftCertificate ? certificate.giftCertificate.name : '-',
        },
        '🔔 {action}\nID: {id}\nКод: {code}\nСтатус: {status}\nСумма: {amount} KZT\nОтправитель: {senderPhone}\nПолучатель: {recipientPhone}\nСообщение: {message}\nТип сертификата: {certificateName}'
    );

    for (const admin of admins) {
        await sendNotification(admin.phoneNumber, text, certificate.giftCertificate?.imageUrl);
    }
}

const createPurchasedCertificate = async (req, res) => {
    try {
        const { giftCertificateId, senderPhone, recipientPhone, amount, message } = req.body;

        const certificate = await GiftCertificate.findByPk(giftCertificateId);
        if (!certificate) return res.status(404).json({ error: 'Сертификат не найден' });

        const uniqueCode = crypto.randomBytes(6).toString('hex').toUpperCase();

        const purchasedCertificate = await PurchasedCertificate.create({
            giftCertificateId,
            senderPhone,
            recipientPhone,
            amount,
            message,
            code: uniqueCode,
            status: 'ожидает оплаты'
        });

        const withGift = await PurchasedCertificate.findByPk(purchasedCertificate.id, {
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });

        await notifyAdminsAboutCertificate('Создан новый заказ на сертификат', withGift);

        res.status(201).json(withGift);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const purchasedCertificate = await PurchasedCertificate.findByPk(id, {
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });
        if (!purchasedCertificate) return res.status(404).json({ error: 'Сертификат не найден' });

        purchasedCertificate.status = 'активирован';
        await purchasedCertificate.save();

        const url = `https://miko-astana.kz/gift/${encodeURIComponent(purchasedCertificate.code)}`;
        const message = await getRenderedTemplate(
            'certificate.paymentConfirmed',
            {
                amount: purchasedCertificate.amount,
                senderPhone: purchasedCertificate.senderPhone,
                message: purchasedCertificate.message,
                code: purchasedCertificate.code,
                url,
            },
            '🎁 Вам подарили сертификат на сумму {amount} KZT!\nОтправитель: {senderPhone}\nСообщение: {message}\nКод сертификата: {code}\n\nДля активации перейдите по ссылке: {url}'
        );

        await sendNotification(purchasedCertificate.recipientPhone, message, purchasedCertificate.giftCertificate.imageUrl);

        await notifyAdminsAboutCertificate('Сертификат активирован (оплата подтверждена)', purchasedCertificate);

        res.json({ message: 'Оплата подтверждена, сертификат активирован' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markCertificateAsUsed = async (req, res) => {
    try {
        const { id } = req.params;
        const purchasedCertificate = await PurchasedCertificate.findByPk(id, {
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });
        if (!purchasedCertificate) return res.status(404).json({ error: 'Сертификат не найден' });

        if (purchasedCertificate.status !== 'активирован') {
            return res.status(400).json({ error: 'Сертификат не может быть использован, так как он не активирован' });
        }

        purchasedCertificate.status = 'использован';
        await purchasedCertificate.save();

        await notifyAdminsAboutCertificate('Сертификат отмечен как использованный', purchasedCertificate);

        res.json({ message: 'Сертификат отмечен как использованный' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllPurchasedCertificates = async (req, res) => {
    try {
        const certificates = await PurchasedCertificate.findAll({
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePurchasedCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await PurchasedCertificate.findByPk(id, {
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });
        if (!certificate) return res.status(404).json({ error: 'Сертификат не найден' });

        await certificate.destroy();

        await notifyAdminsAboutCertificate('Сертификат удалён', certificate);

        res.json({ message: 'Заказ на сертификат удалён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkGiftCertificateValidity = async (req, res) => {
    try {
        const { code } = req.params;

        const certificate = await PurchasedCertificate.findOne({
            where: { code },
            include: { model: GiftCertificate, as: 'giftCertificate' }
        });

        if (!certificate) {
            return res.status(404).json({ valid: false, message: "Сертификат не найден" });
        }

        if (certificate.status !== 'активирован') {
            return res.status(400).json({ valid: false, message: "Сертификат не активирован или уже использован" });
        }

        res.json({
            valid: true,
            message: "Сертификат действителен",
            amount: certificate.amount,
            senderPhone: certificate.senderPhone,
            recipientPhone: certificate.recipientPhone,
            giftCertificate: {
                id: certificate.giftCertificate.id,
                name: certificate.giftCertificate.name,
                imageUrl: certificate.giftCertificate.imageUrl
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPurchasedCertificate,
    confirmPayment,
    markCertificateAsUsed,
    getAllPurchasedCertificates,
    deletePurchasedCertificate,
    checkGiftCertificateValidity
};
