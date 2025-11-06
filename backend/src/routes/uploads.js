const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const upload = require('../middleware/upload');

// Contrôleurs
const uploadController = require('../controllers/uploadController');

// Validation rules
const uploadValidation = [
  body('folder')
    .optional()
    .isIn(['general', 'products', 'categories', 'avatars', 'reviews'])
    .withMessage('Dossier de destination invalide')
];

// Routes d'upload
router.post('/image', [
  auth.authenticate,
  upload.singleImage('image'),
  ...uploadValidation
], validation.handleValidationErrors, uploadController.uploadImage);

router.post('/multiple', [
  auth.authenticate,
  upload.multipleImages('images', 10),
  ...uploadValidation
], validation.handleValidationErrors, uploadController.uploadMultipleImages);

router.delete('/', [
  auth.authenticate,
  body('fileName').notEmpty().withMessage('Nom de fichier requis')
], validation.handleValidationErrors, uploadController.deleteImage);

router.get('/files', [
  auth.authenticate,
  validation.handleValidationErrors,
  uploadController.getUserFiles
]);

// Routes spécifiques
router.post('/avatar', [
  auth.authenticate,
  upload.singleImage('avatar'),
  validation.handleValidationErrors,
  uploadController.uploadAvatar
]);

router.post('/product-images', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  upload.multipleImages('images', 5),
  validation.handleValidationErrors,
  uploadController.uploadProductImages
]);

router.post('/category-image', [
  auth.authenticate,
  auth.authorize(['admin']),
  upload.singleImage('image'),
  validation.handleValidationErrors,
  uploadController.uploadCategoryImage
]);

router.post('/review-images', [
  auth.authenticate,
  upload.multipleImages('images', 3),
  validation.handleValidationErrors,
  uploadController.uploadReviewImages
]);

module.exports = router;
