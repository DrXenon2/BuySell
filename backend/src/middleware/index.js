// Export centralisé de tous les middlewares
const asyncHandler = require('./asyncHandler');
const { authenticate, authorize, optionalAuth, isOwnerOrAdmin } = require('./auth');
const { cacheMiddleware, noCache } = require('./cache');
const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const loggerMiddleware = require('./logger');
const { rateLimiter, createRateLimit } = require('./rateLimiter');
const { sanitizeBody, sanitizeQuery, sanitizeParams } = require('./sanitize');
const { uploadMiddleware, validateFile } = require('./upload');
const { 
  validateAuth, 
  validateUser, 
  validateProduct, 
  validateOrder, 
  validateCart, 
  validateReview, 
  validatePayment 
} = require('./validation');

module.exports = {
  // Gestion des erreurs
  asyncHandler,
  errorHandler,
  notFoundHandler,
  
  // Authentification et autorisation
  authenticate,
  authorize,
  optionalAuth,
  isOwnerOrAdmin,
  
  // Cache
  cacheMiddleware,
  noCache,
  
  // Logging
  loggerMiddleware,
  
  // Rate limiting
  rateLimiter,
  createRateLimit,
  
  // Sécurité
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  
  // Upload de fichiers
  uploadMiddleware,
  validateFile,
  
  // Validation
  validateAuth,
  validateUser,
  validateProduct,
  validateOrder,
  validateCart,
  validateReview,
  validatePayment
};
