const { Banner } = require('../models');

const normalizeText = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
};

const normalizeBannerPayload = ({ body = {}, file = null, existingBanner = null }) => {
    const type = normalizeText(body.type);
    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const linkUrl = normalizeText(body.linkUrl);
    const buttonText = normalizeText(body.buttonText);
    const buttonLink = normalizeText(body.buttonLink);
    const background = normalizeText(body.background) || 'sunset';
    const sortOrder = Number(body.sortOrder || 0);
    const imagePath = file ? `/uploads/${file.filename}` : existingBanner?.image || null;

    if (!['image', 'image_link', 'text'].includes(type)) {
        return { error: 'Выберите корректный тип баннера.' };
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
        return { error: 'Порядок сортировки должен быть числом не меньше 0.' };
    }

    if (type === 'text' && !title) {
        return { error: 'Для текстового баннера заполните заголовок.' };
    }

    if ((buttonText && !buttonLink) || (!buttonText && buttonLink)) {
        return { error: 'Для кнопки заполните и текст, и ссылку.' };
    }

    if ((type === 'image' || type === 'image_link') && !imagePath) {
        return { error: 'Для баннера с изображением загрузите картинку.' };
    }

    if (type === 'image_link' && !linkUrl) {
        return { error: 'Для баннера-ссылки укажите ссылку перехода.' };
    }

    if (type === 'text') {
        return {
            payload: {
                type,
                title,
                description: description || null,
                image: null,
                linkUrl: null,
                buttonText: buttonText || null,
                buttonLink: buttonLink || null,
                background,
                sortOrder,
            },
        };
    }

    return {
        payload: {
            type,
            title: title || null,
            description: null,
            image: imagePath,
            linkUrl: type === 'image_link' ? linkUrl : null,
            buttonText: null,
            buttonLink: null,
            background: null,
            sortOrder,
        },
    };
};

const getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.findAll({
            order: [
                ['sortOrder', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createBanner = async (req, res) => {
    const { payload, error } = normalizeBannerPayload({ body: req.body, file: req.file });

    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const banner = await Banner.create(payload);
        res.status(201).json(banner);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);

        if (!banner) {
            return res.status(404).json({ error: 'Баннер не найден.' });
        }

        const { payload, error } = normalizeBannerPayload({
            body: req.body,
            file: req.file,
            existingBanner: banner,
        });

        if (error) {
            return res.status(400).json({ error });
        }

        await banner.update(payload);
        res.json(banner);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);

        if (!banner) {
            return res.status(404).json({ error: 'Баннер не найден.' });
        }

        await banner.destroy();
        res.json({ message: 'Баннер удалён.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};
