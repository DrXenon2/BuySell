const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const paymentController = require('../controllers/paymentController');

// Validation rules
const paymentIntentValidation = [
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('ID de commande invalide'),
  body('paymentMethod')
    .optional()
    .isIn(['card', 'paypal', 'bank_transfer'])
    .withMessage('Méthode de paiement invalide'),
  body('savePaymentMethod')
    .optional()
    .isBoolean()
    .withMessage('savePaymentMethod doit être un booléen')
];

const confirmPaymentValidation = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('ID d\'intention de paiement requis'),
  body('paymentMethodId')
    .optional()
    .notEmpty()
    .withMessage('ID de méthode de paiement requis')
];

const refundValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Montant de remboursement invalide'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La raison ne doit pas dépasser 500 caractères')
];

// Routes de paiement
router.post('/create-intent', [
  auth.authenticate,
  ...paymentIntentValidation
], validation.handleValidationErrors, paymentController.createPaymentIntent);

router.post('/confirm', [
  auth.authenticate,
  ...confirmPaymentValidation
], validation.handleValidationErrors, paymentController.confirmPayment);

router.get('/history', [
  auth.authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'succeeded', 'failed', 'refunded']).withMessage('Statut invalide')
], validation.handleValidationErrors, paymentController.getPaymentHistory);

router.get('/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID de paiement invalide')
], validation.handleValidationErrors, paymentController.getPaymentById);

router.get('/status/:paymentIntentId', paymentController.checkPaymentStatus);

// Routes de remboursement (admin)
router.post('/:id/refund', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de paiement invalide'),
  ...refundValidation
], validation.handleValidationErrors, paymentController.refundPayment);

// Routes des méthodes de paiement sauvegardées
router.get('/methods', auth.authenticate, paymentController.getPaymentMethods);

router.post('/methods', [
  auth.authenticate,
  body('paymentMethodId').notEmpty().withMessage('ID de méthode de paiement requis')
], validation.handleValidationErrors, paymentController.savePaymentMethod);

router.delete('/methods/:methodId', [
  auth.authenticate,
  param('methodId').notEmpty().withMessage('ID de méthode de paiement requis')
], validation.handleValidationErrors, paymentController.deletePaymentMethod);

// Paiements hors ligne
router.post('/offline', [
  auth.authenticate,
  body('orderId').isInt({ min: 1 }).withMessage('ID de commande invalide'),
  body('method').isIn(['cash', 'bank_transfer', 'check']).withMessage('Méthode de paiement invalide'),
  body('reference').optional().trim().isLength({ max: 100 }).withMessage('La référence ne doit pas dépasser 100 caractères'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Montant invalide')
], validation.handleValidationErrors, paymentController.processOfflinePayment);

module.exports = router;
