const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const reviewController = require('../controllers/reviewController');

// Validation rules
const createReviewValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('ID de produit invalide'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le commentaire doit contenir entre 10 et 1000 caractères'),
  body('images')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 images autorisées')
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le commentaire doit contenir entre 10 et 1000 caractères'),
  body('images')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 images autorisées')
];

const reportReviewValidation = [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La raison doit contenir entre 10 et 500 caractères')
];

// Routes publiques
router.get('/product/:productId', [
  param('productId').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Note invalide'),
  query('sortBy').optional().isIn(['created_at', 'rating', 'helpful_count']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide')
], validation.handleValidationErrors, reviewController.getProductReviews);

router.get('/product/:productId/stats', [
  param('productId').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, reviewController.getReviewStats);

router.get('/product/:productId/verified', [
  param('productId').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, reviewController.getVerifiedReviews);

// Routes utilisateur
router.get('/user', [
  auth.authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide')
], validation.handleValidationErrors, reviewController.getUserReviews);

router.post('/', [
  auth.authenticate,
  ...createReviewValidation
], validation.handleValidationErrors, reviewController.createReview);

router.put('/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide'),
  ...updateReviewValidation
], validation.handleValidationErrors, reviewController.updateReview);

router.delete('/:id', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide')
], validation.handleValidationErrors, reviewController.deleteReview);

// Interactions avec les avis
router.post('/:id/helpful', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide')
], validation.handleValidationErrors, reviewController.markHelpful);

router.post('/:id/report', [
  auth.authenticate,
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide'),
  ...reportReviewValidation
], validation.handleValidationErrors, reviewController.reportReview);

// Routes vendeur
router.get('/seller/pending', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit invalide')
], validation.handleValidationErrors, reviewController.getPendingReviews);

router.post('/:id/reply', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide'),
  body('reply').trim().isLength({ min: 5, max: 500 }).withMessage('La réponse doit contenir entre 5 et 500 caractères')
], validation.handleValidationErrors, reviewController.replyToReview);

// Routes admin/modération
router.post('/:id/moderate', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID d\'avis invalide'),
  body('action').isIn(['approve', 'reject', 'delete']).withMessage('Action de modération invalide'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('La raison ne doit pas dépasser 500 caractères')
], validation.handleValidationErrors, reviewController.moderateReview);

module.exports = router;
