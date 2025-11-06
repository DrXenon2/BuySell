const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const cartController = require('../controllers/cartController');

// Validation rules
const cartItemValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('ID de produit invalide'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('La quantité doit être entre 1 et 100'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Les options doivent être un objet')
];

const updateCartItemValidation = [
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('La quantité doit être entre 0 et 100')
];

const couponValidation = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Le code promo doit contenir entre 3 et 20 caractères')
];

// Routes du panier
router.get('/', auth.authenticate, cartController.getCart);

router.post('/items', [
  auth.authenticate,
  ...cartItemValidation
], validation.handleValidationErrors, cartController.addToCart);

router.put('/items/:itemId', [
  auth.authenticate,
  param('itemId').isInt({ min: 1 }).withMessage('ID d\'article invalide'),
  ...updateCartItemValidation
], validation.handleValidationErrors, cartController.updateCartItem);

router.delete('/items/:itemId', [
  auth.authenticate,
  param('itemId').isInt({ min: 1 }).withMessage('ID d\'article invalide')
], validation.handleValidationErrors, cartController.removeFromCart);

router.delete('/', auth.authenticate, cartController.clearCart);

// Routes des codes promo
router.post('/coupon', [
  auth.authenticate,
  ...couponValidation
], validation.handleValidationErrors, cartController.applyCoupon);

router.delete('/coupon', auth.authenticate, cartController.removeCoupon);

// Synchronisation du panier
router.post('/sync', [
  auth.authenticate,
  body('items')
    .isArray()
    .withMessage('Les articles doivent être un tableau'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ID de produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantité invalide'),
  body('items.*.price')
    .isFloat({ min: 0.01 })
    .withMessage('Prix invalide')
], validation.handleValidationErrors, cartController.syncCart);

// Calcul du panier
router.get('/calculate', auth.authenticate, cartController.calculateCart);

module.exports = router;
