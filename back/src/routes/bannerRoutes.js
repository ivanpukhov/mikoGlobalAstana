const express = require('express');
const upload = require('../config/multer');
const {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
} = require('../controllers/bannerController');

const router = express.Router();

router.get('/', getAllBanners);
router.post('/', upload.single('image'), createBanner);
router.put('/:id', upload.single('image'), updateBanner);
router.delete('/:id', deleteBanner);

module.exports = router;
