const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const productController = require('../controllers/productController');

// Validation rules
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le nom doit contenir entre 3 et 200 caractères'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Le prix doit être un nombre positif'),
  body('salePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix soldé doit être un nombre positif'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('La quantité en stock doit être un nombre positif'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('ID de catégorie invalide'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La marque ne doit pas dépasser 100 caractères'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le SKU ne doit pas dépasser 50 caractères'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le poids doit être un nombre positif'),
  body('dimensions')
    .optional()
    .isObject()
    .withMessage('Les dimensions doivent être un objet'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Les tags doivent être un tableau')
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le nom doit contenir entre 3 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Le prix doit être un nombre positif'),
  body('salePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix soldé doit être un nombre positif'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La quantité en stock doit être un nombre positif')
];

// Routes publiques
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide'),
  query('category').optional().isInt({ min: 1 }).withMessage('Catégorie invalide'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide'),
  query('inStock').optional().isBoolean().withMessage('inStock doit être un booléen'),
  query('onSale').optional().isBoolean().withMessage('onSale doit être un booléen'),
  query('featured').optional().isBoolean().withMessage('featured doit être un booléen'),
  query('sortBy').optional().isIn(['name', 'price', 'created_at', 'rating', 'popularity']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide')
], validation.handleValidationErrors, productController.getProducts);

router.get('/search', [
  query('q').trim().isLength({ min: 2 }).withMessage('La recherche doit contenir au moins 2 caractères'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide')
], validation.handleValidationErrors, productController.searchProducts);

router.get('/popular', productController.getPopularProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/deals', productController.getDealProducts);

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, productController.getProductById);

router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id/similar', productController.getSimilarProducts);
router.get('/:id/reviews', productController.getProductReviews);

// Routes protégées (vendeurs et admin)
router.post('/', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  ...createProductValidation
], validation.handleValidationErrors, productController.createProduct);

router.put('/:id', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  ...updateProductValidation
], validation.handleValidationErrors, productController.updateProduct);

router.delete('/:id', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, productController.deleteProduct);

// Routes de gestion des images
router.post('/:id/images', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide')
], productController.uploadProductImages);

router.delete('/:id/images/:imageId', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  param('imageId').isInt({ min: 1 }).withMessage('ID d\'image invalide')
], validation.handleValidationErrors, productController.deleteProductImage);

// Routes d'inventaire
router.patch('/:id/inventory', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Quantité invalide'),
  body('operation').optional().isIn(['increment', 'decrement']).withMessage('Opération invalide')
], validation.handleValidationErrors, productController.updateInventory);

router.get('/:id/availability', [
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  query('quantity').optional().isInt({ min: 1 }).withMessage('Quantité invalide')
], validation.handleValidationErrors, productController.checkAvailability);

// Routes de statistiques (vendeurs)
router.get('/:id/stats', [
  auth.authenticate,
  auth.authorize(['seller', 'admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de produit invalide')
], validation.handleValidationErrors, productController.getProductStats);

module.exports = router;
