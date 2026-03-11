const { GiftCertificate } = require('../models');

const createGiftCertificate = async (req, res) => {
    try {
        const { name, imageUrl } = req.body;
        const certificate = await GiftCertificate.create({ name, imageUrl });
        res.status(201).json(certificate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllGiftCertificates = async (req, res) => {
    try {
        const certificates = await GiftCertificate.findAll();
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteGiftCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        await GiftCertificate.destroy({ where: { id } });
        res.json({ message: 'Сертификат удалён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createGiftCertificate, getAllGiftCertificates, deleteGiftCertificate };
