const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const orderController = require('../controllers/orderController');

// Validation rules
const createOrderValidation = [
  body('shippingAddress')
    .isObject()
    .withMessage('Adresse de livraison requise'),
  body('billingAddress')
    .optional()
    .isObject()
    .withMessage('Adresse de facturation invalide'),
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer', 'cash'])
    .withMessage('Méthode de paiement invalide'),
  body('shippingMethod')
    .isIn(['standard', 'express', 'pickup'])
    .withMessage('Méthode de livraison invalide'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Au moins un article est requis'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ID de produit invalide'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantité invalide'),
  body('items.*.price')
    .isFloat({ min: 0.01 })
    .withMessage('Prix invalide'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note ne doit pas dépasser 500 caractères')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Statut de commande invalide'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note ne doit pas dépasser 500 caractères')
];

// Routes utilisateur
router.get('/', [
  auth.authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide'),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'total_amount']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide')
], validation.handleValidationErrors, orderController.getUserOrders);

router.get('/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, orderController.getOrderById);

router.post('/', [
  auth.authenticate,
  ...createOrderValidation
], validation.handleValidationErrors, orderController.createOrder);

router.post('/:id/cancel', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('La raison ne doit pas dépasser 500 caractères')
], validation.handleValidationErrors, orderController.cancelOrder);

router.get('/:id/tracking', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, orderController.trackOrder);

router.get('/:id/invoice', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, orderController.downloadInvoice);

router.post('/:id/reorder', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, orderController.reorder);

// Routes vendeur
router.get('/seller/orders', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide')
], validation.handleValidationErrors, orderController.getSellerOrders);

router.put('/:id/status', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide'),
  ...updateOrderStatusValidation
], validation.handleValidationErrors, orderController.updateOrderStatus);

router.put('/:id/shipping-address', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de commande invalide')
], validation.handleValidationErrors, orderController.updateShippingAddress);

// Routes admin
router.get('/admin/orders', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide'),
  query('userId').optional().isInt({ min: 1 }).withMessage('ID utilisateur invalide')
], validation.handleValidationErrors, orderController.getAllOrders);

// Statistiques
router.get('/seller/stats', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, orderController.getSellerStats);

router.get('/admin/stats', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, orderController.getAdminStats);

module.exports = router;
