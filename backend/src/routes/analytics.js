const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const analyticsController = require('../controllers/analyticsController');

// Routes de tracking
router.post('/track', analyticsController.trackEvent);

// Routes de statistiques
router.get('/dashboard', [
  auth.authenticate,
  auth.authorize(['admin', 'seller']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, analyticsController.getDashboardStats);

router.get('/sales', [
  auth.authenticate,
  auth.authorize(['admin', 'seller']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide'),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('sellerId').optional().isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, analyticsController.getSalesStats);

router.get('/products', [
  auth.authenticate,
  auth.authorize(['admin', 'seller']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide'),
  query('productId').optional().isInt({ min: 1 }).withMessage('ID produit invalide'),
  query('sellerId').optional().isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, analyticsController.getProductStats);

router.get('/users', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, analyticsController.getUserStats);

router.get('/traffic', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, analyticsController.getTrafficData);

router.get('/conversion', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, analyticsController.getConversionRates);

// Top lists
router.get('/top-products', [
  auth.authenticate,
  auth.authorize(['admin', 'seller']),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide'),
  query('sellerId').optional().isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, analyticsController.getTopProducts);

router.get('/top-categories', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, analyticsController.getTopCategories);

router.get('/sellers', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide'),
  query('sellerId').optional().isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, analyticsController.getSellerPerformance);

// Rapports personnalisés
router.get('/reports/:type', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Format invalide')
], validation.handleValidationErrors, analyticsController.getCustomReport);

// Export des données
router.get('/export', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('format').isIn(['csv', 'json']).withMessage('Format d\'export invalide'),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('dataType').optional().isIn(['sales', 'users', 'products', 'traffic']).withMessage('Type de données invalide')
], validation.handleValidationErrors, analyticsController.exportAnalyticsData);

module.exports = router;
