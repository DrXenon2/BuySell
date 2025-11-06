const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Rate limiter global
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Trop de requêtes',
    message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit dépassé:', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Trop de requêtes',
      message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

/**
 * Créer un rate limiter personnalisé
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Rate limiters spécifiques
 */
const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    success: false,
    error: 'Trop de tentatives',
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  }
});

const passwordResetLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives max
  message: {
    success: false,
    error: 'Trop de demandes',
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.'
  }
});

const uploadLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 uploads max par heure
  message: {
    success: false,
    error: 'Limite d\'upload atteinte',
    message: 'Vous avez atteint la limite d\'upload. Veuillez réessayer dans 1 heure.'
  }
});

const apiLimiter = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requêtes max par minute
  message: {
    success: false,
    error: 'Limite d\'API atteinte',
    message: 'Vous avez atteint la limite d\'API. Veuillez réessayer dans 1 minute.'
  }
});

module.exports = {
  rateLimiter,
  createRateLimit,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  apiLimiter
};
