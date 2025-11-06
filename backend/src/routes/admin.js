const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const adminController = require('../controllers/adminController');

// Routes admin seulement
router.get('/dashboard', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('Période invalide')
], validation.handleValidationErrors, adminController.getDashboardStats);

// Gestion des utilisateurs
router.get('/users', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('role').optional().isIn(['customer', 'seller', 'admin']).withMessage('Rôle invalide'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Statut invalide'),
  query('search').optional().trim().isLength({ min: 2 }).withMessage('La recherche doit contenir au moins 2 caractères')
], validation.handleValidationErrors, adminController.getUsers);

router.get('/users/:id', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide')
], validation.handleValidationErrors, adminController.getUserById);

router.put('/users/:id/role', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  validation.handleValidationErrors,
  adminController.updateUserRole
]);

router.put('/users/:id/status', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  validation.handleValidationErrors,
  adminController.updateUserStatus
]);

// Gestion des vendeurs
router.get('/sellers', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['active', 'pending', 'suspended']).withMessage('Statut invalide')
], validation.handleValidationErrors, adminController.getSellers);

router.post('/sellers/:id/approve', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, adminController.approveSeller);

router.post('/sellers/:id/suspend', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, adminController.suspendSeller);

// Gestion des produits
router.get('/products', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Statut invalide'),
  query('sellerId').optional().isInt({ min: 1 }).withMessage('ID vendeur invalide')
], validation.handleValidationErrors, adminController.getProducts);

router.put('/products/:id/status', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID produit invalide'),
  validation.handleValidationErrors,
  adminController.updateProductStatus
]);

// Gestion des commandes
router.get('/orders', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Statut invalide')
], validation.handleValidationErrors, adminController.getOrders);

// Gestion des catégories
router.get('/categories', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide')
], validation.handleValidationErrors, adminController.getCategories);

// Gestion des avis
router.get('/reviews', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Statut invalide')
], validation.handleValidationErrors, adminController.getReviews);

// Gestion des paiements
router.get('/payments', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('status').optional().isIn(['pending', 'succeeded', 'failed', 'refunded']).withMessage('Statut invalide')
], validation.handleValidationErrors, adminController.getPayments);

// Paramètres système
router.get('/settings', [
  auth.authenticate,
  auth.authorize(['admin'])
], adminController.getSystemSettings);

router.put('/settings', [
  auth.authenticate,
  auth.authorize(['admin']),
  validation.handleValidationErrors,
  adminController.updateSystemSettings
]);

// Rapports
router.get('/reports/sales', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Période invalide')
], validation.handleValidationErrors, adminController.getSalesReport);

router.get('/reports/users', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide')
], validation.handleValidationErrors, adminController.getUsersReport);

router.get('/reports/products', [
  auth.authenticate,
  auth.authorize(['admin']),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide')
], validation.handleValidationErrors, adminController.getProductsReport);

module.exports = router;
