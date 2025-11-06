const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const categoryController = require('../controllers/categoryController');

// Validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne doit pas dépasser 500 caractères'),
  body('parentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID parent invalide'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen')
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne doit pas dépasser 500 caractères'),
  body('parentId')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ID parent invalide'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen')
];

// Routes publiques
router.get('/', [
  query('includeProducts').optional().isBoolean().withMessage('includeProducts doit être un booléen'),
  query('includeCount').optional().isBoolean().withMessage('includeCount doit être un booléen'),
  query('parentOnly').optional().isBoolean().withMessage('parentOnly doit être un booléen'),
  query('featured').optional().isBoolean().withMessage('featured doit être un booléen')
], validation.handleValidationErrors, categoryController.getCategories);

router.get('/tree', categoryController.getCategoryTree);
router.get('/popular', categoryController.getPopularCategories);
router.get('/search', [
  query('q').trim().isLength({ min: 2 }).withMessage('La recherche doit contenir au moins 2 caractères')
], validation.handleValidationErrors, categoryController.searchCategories);

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID de catégorie invalide')
], validation.handleValidationErrors, categoryController.getCategoryById);

router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id/products', categoryController.getCategoryProducts);
router.get('/:id/subcategories', categoryController.getSubcategories);

// Routes protégées (admin seulement)
router.post('/', [
  auth.authenticate,
  auth.authorize(['admin']),
  ...createCategoryValidation
], validation.handleValidationErrors, categoryController.createCategory);

router.put('/:id', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de catégorie invalide'),
  ...updateCategoryValidation
], validation.handleValidationErrors, categoryController.updateCategory);

router.delete('/:id', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de catégorie invalide')
], validation.handleValidationErrors, categoryController.deleteCategory);

// Gestion des images de catégorie
router.post('/:id/image', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de catégorie invalide')
], categoryController.uploadCategoryImage);

router.delete('/:id/image', [
  auth.authenticate,
  auth.authorize(['admin']),
  param('id').isInt({ min: 1 }).withMessage('ID de catégorie invalide')
], validation.handleValidationErrors, categoryController.deleteCategoryImage);

module.exports = router;
