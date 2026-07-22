const multer = require('multer');
const path = require('path');
require('dotenv').config();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            return cb(new Error('Разрешены изображения PNG, JPG, JPEG или WEBP.'));
        }
        cb(null, true);
    },
});

module.exports = upload;
