const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Contrôleurs
const authController = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

// Routes
router.post('/register', registerValidation, validation.handleValidationErrors, authController.register);
router.post('/login', loginValidation, validation.handleValidationErrors, authController.login);
router.post('/logout', auth.authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validation.handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validation.handleValidationErrors, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Routes protégées
router.get('/profile', auth.authenticate, authController.getProfile);
router.put('/profile', auth.authenticate, authController.updateProfile);
router.post('/change-password', auth.authenticate, authController.changePassword);

// Routes sociales (optionnelles)
router.post('/google', authController.googleAuth);
router.post('/facebook', authController.facebookAuth);

module.exports = router;
