const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('../utils/logger');

// Cache en mémoire
const cache = new NodeCache({ 
  stdTTL: config.cache.ttl,
  checkperiod: 600 // Vérifier les expirations toutes les 10 minutes
});

/**
 * Middleware de cache pour les routes GET
 */
const cacheMiddleware = (duration = config.cache.ttl) => {
  return (req, res, next) => {
    // Seulement pour les requêtes GET quand le cache est activé
    if (req.method !== 'GET' || !config.cache.enabled) {
      return next();
    }

    const key = generateCacheKey(req);
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      logger.debug('Cache hit:', { key, url: req.originalUrl });
      return res.json(cachedResponse);
    }

    logger.debug('Cache miss:', { key, url: req.originalUrl });

    // Sauvegarder la méthode originale send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Ne cacher que les réponses réussies
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const responseData = JSON.parse(data);
          cache.set(key, responseData, duration);
          logger.debug('Response cached:', { key, duration });
        } catch (error) {
          logger.warn('Impossible de cacher la réponse:', error.message);
        }
      }
      
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Générer une clé de cache unique pour la requête
 */
const generateCacheKey = (req) => {
  const { originalUrl, query, user } = req;
  const userPart = user ? `:user:${user.id}` : ':public';
  const queryPart = Object.keys(query).length > 0 
    ? `:query:${JSON.stringify(query)}` 
    : '';
  
  return `api${userPart}${queryPart}:url:${originalUrl}`;
};

/**
 * Nettoyer le cache pour un pattern spécifique
 */
const clearCacheByPattern = (pattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    logger.debug('Cache cleared for pattern:', { pattern, keysDeleted: keysToDelete.length });
  }
};

/**
 * Middleware pour éviter le cache pour certaines routes
 */
const noCache = (req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

module.exports = {
  cacheMiddleware,
  clearCacheByPattern,
  noCache,
  cache // Exporter l'instance pour un usage manuel
};
