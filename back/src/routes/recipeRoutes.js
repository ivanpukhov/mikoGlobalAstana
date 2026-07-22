const express = require('express');
const upload = require('../config/multer');
const authenticate = require('../utils/authenticate');
const controller = require('../controllers/recipeController');

const router = express.Router();
router.get('/', controller.getPublished);
router.get('/admin', authenticate, controller.getAdmin);
router.get('/admin/:id', authenticate, controller.getAdminById);
router.post('/admin', authenticate, upload.single('image'), controller.create);
router.put('/admin/:id', authenticate, upload.single('image'), controller.update);
router.delete('/admin/:id', authenticate, controller.remove);
router.get('/:slug', controller.getPublishedBySlug);

module.exports = router;
