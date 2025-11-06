const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const userController = require('../controllers/userController');

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('Date de naissance invalide')
];

const addressValidation = [
  body('street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La rue doit contenir entre 5 et 200 caractères'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ville doit contenir entre 2 et 100 caractères'),
  body('postalCode')
    .isPostalCode('any')
    .withMessage('Code postal invalide'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le pays doit contenir entre 2 et 100 caractères'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault doit être un booléen')
];

// Routes du profil
router.get('/profile', auth.authenticate, userController.getProfile);
router.put('/profile', auth.authenticate, updateProfileValidation, validation.handleValidationErrors, userController.updateProfile);
router.post('/avatar', auth.authenticate, userController.uploadAvatar);
router.delete('/avatar', auth.authenticate, userController.deleteAvatar);

// Routes des adresses
router.get('/addresses', auth.authenticate, userController.getAddresses);
router.post('/addresses', auth.authenticate, addressValidation, validation.handleValidationErrors, userController.addAddress);
router.put('/addresses/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'adresse invalide'),
  ...addressValidation
], validation.handleValidationErrors, userController.updateAddress);
router.delete('/addresses/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'adresse invalide')
], validation.handleValidationErrors, userController.deleteAddress);

// Routes de la liste de souhaits
router.get('/wishlist', auth.authenticate, userController.getWishlist);
router.post('/wishlist', [
  auth.authenticate,
  body('productId').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, userController.addToWishlist);
router.delete('/wishlist/:productId', [
  auth.authenticate,
  param('productId').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, userController.removeFromWishlist);

// Routes des commandes utilisateur
router.get('/orders', auth.authenticate, userController.getUserOrders);
router.get('/orders/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, userController.getUserOrder);

// Routes des paramètres de notification
router.get('/notifications/settings', auth.authenticate, userController.getNotificationSettings);
router.put('/notifications/settings', auth.authenticate, userController.updateNotificationSettings);

// Routes des statistiques utilisateur
router.get('/stats', auth.authenticate, userController.getUserStats);

// Routes de désactivation de compte
router.post('/deactivate', auth.authenticate, userController.deactivateAccount);
router.post('/export-data', auth.authenticate, userController.exportData);

module.exports = router;
