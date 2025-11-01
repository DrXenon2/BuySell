const logger = require('../utils/logger');

/**
 * Middleware de logging personnalisé pour les requêtes HTTP
 */
const loggerMiddleware = (req, res, next) => {
  // Ignorer les health checks dans les logs
  if (req.path === '/health') {
    return next();
  }

  const start = Date.now();

  // Log de la requête entrante
  logger.http('Requête entrante', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log de la réponse
    logger.http('Réponse sortante', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });

    // Log des erreurs
    if (res.statusCode >= 400) {
      logger.error('Erreur HTTP', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ...(typeof data === 'string' && { response: data })
      });
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = loggerMiddleware;
