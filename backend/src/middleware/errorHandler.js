const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur
  logger.error('Erreur interceptée:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erreur de validation Mongoose (adapté pour PostgreSQL)
  if (err.name === 'ValidationError') {
    const message = 'Données de requête invalides';
    error = {
      message,
      statusCode: 400,
      details: Object.values(err.errors).map(val => val.message)
    };
  }

  // Erreur de clé dupliquée PostgreSQL
  if (err.code === '23505') {
    const message = 'Une ressource avec ces données existe déjà';
    error = { message, statusCode: 409 };
  }

  // Violation de contrainte de clé étrangère
  if (err.code === '23503') {
    const message = 'Référence à une ressource inexistante';
    error = { message, statusCode: 400 };
  }

  // Erreur de valeur nulle
  if (err.code === '23502') {
    const message = 'Données manquantes requises';
    error = { message, statusCode: 400 };
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token JWT invalide';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token JWT expiré';
    error = { message, statusCode: 401 };
  }

  // Erreur Cast (pour les IDs invalides)
  if (err.name === 'CastError') {
    const message = 'Format de ressource invalide';
    error = { message, statusCode: 400 };
  }

  // Réponse d'erreur
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Erreur serveur interne',
      ...(config.env === 'development' && { stack: err.stack }),
      ...(error.details && { details: error.details })
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
