const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

// Client Redis pour le stockage des rate limits
let redisClient = null;

if (config.redis.url || config.redis.host) {
  redisClient = new Redis(config.redis.url || {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 1
  });

  redisClient.on('error', (error) => {
    logger.error('❌ Erreur Redis pour rate limiting:', error);
  });

  redisClient.on('connect', () => {
    logger.info('✅ Redis connecté pour rate limiting');
  });
}

// Store pour le rate limiting
const createStore = () => {
  if (redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:',
      expiry: 900, // 15 minutes en secondes
      resetExpiryOnChange: true
    });
  }
  return new rateLimit.MemoryStore();
};

// Configuration de base du rate limiting
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    store: createStore(),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite par défaut
    message: {
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Ne pas limiter les health checks
      return req.path === '/health';
    },
    handler: (req, res) => {
      logger.warn('🚫 Rate limit dépassé:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      res.status(429).json({
        error: 'Trop de requêtes',
        message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Configurations spécifiques par route
const rateLimitConfigs = {
  // Limite stricte pour l'authentification
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives de connexion max
    message: {
      error: 'Trop de tentatives de connexion',
      message: 'Trop de tentatives de connexion échouées. Veuillez réessayer dans 15 minutes.',
      retryAfter: '15 minutes'
    },
    skip: (req) => {
      // Ne pas compter les requêtes réussies
      return req.method === 'POST' && req.path === '/auth/login' && req.body?.email;
    }
  }),

  // Limite pour l'inscription
  signup: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 inscriptions max par heure
    message: {
      error: 'Trop de tentatives d\'inscription',
      message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.',
      retryAfter: '1 heure'
    }
  }),

  // Limite pour les requêtes API générales
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requêtes max
    message: {
      error: 'Limite d\'API dépassée',
      message: 'Vous avez dépassé votre quota de requêtes API. Veuillez réessayer dans 15 minutes.',
      retryAfter: '15 minutes'
    }
  }),

  // Limite plus permissive pour les utilisateurs authentifiés
  authenticated: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requêtes max pour les utilisateurs auth
    keyGenerator: (req) => {
      // Utiliser l'ID utilisateur comme clé si authentifié
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      // Ne pas limiter les admins
      return req.user?.role === 'admin';
    }
  }),

  // Limite pour les uploads de fichiers
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 uploads max par heure
    message: {
      error: 'Limite d\'upload dépassée',
      message: 'Vous avez dépassé votre quota d\'upload. Veuillez réessayer dans 1 heure.',
      retryAfter: '1 heure'
    }
  }),

  // Limite pour les recherches
  search: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 recherches max par minute
    message: {
      error: 'Trop de recherches',
      message: 'Trop de requêtes de recherche. Veuillez réessayer dans 1 minute.',
      retryAfter: '1 minute'
    }
  }),

  // Pas de limite pour les webhooks
  webhooks: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Limite haute pour les webhooks
    skip: () => true // Désactiver la limite
  }),

  // Limite pour les emails de réinitialisation
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 demandes de réinitialisation max
    message: {
      error: 'Trop de demandes de réinitialisation',
      message: 'Trop de demandes de réinitialisation de mot de passe. Veuillez réessayer dans 1 heure.',
      retryAfter: '1 heure'
    }
  })
};

// Middleware pour appliquer dynamiquement les limites
const dynamicRateLimit = (req, res, next) => {
  let limiter;

  // Déterminer le limiteur en fonction de la route
  if (req.path.startsWith('/auth/login')) {
    limiter = rateLimitConfigs.auth;
  } else if (req.path.startsWith('/auth/signup')) {
    limiter = rateLimitConfigs.signup;
  } else if (req.path.startsWith('/auth/reset-password')) {
    limiter = rateLimitConfigs.passwordReset;
  } else if (req.path.startsWith('/upload')) {
    limiter = rateLimitConfigs.upload;
  } else if (req.path.startsWith('/search')) {
    limiter = rateLimitConfigs.search;
  } else if (req.path.startsWith('/webhooks')) {
    limiter = rateLimitConfigs.webhooks;
  } else if (req.user) {
    limiter = rateLimitConfigs.authenticated;
  } else {
    limiter = rateLimitConfigs.api;
  }

  return limiter(req, res, next);
};

// Fonction pour réinitialiser les compteurs d'un IP
const resetIpLimit = async (ip) => {
  if (redisClient) {
    const key = `rate-limit:${ip}`;
    await redisClient.del(key);
    logger.info('🔄 Rate limit réinitialisé pour IP:', { ip });
  }
};

// Fonction pour réinitialiser les compteurs d'un utilisateur
const resetUserLimit = async (userId) => {
  if (redisClient) {
    const key = `rate-limit:${userId}`;
    await redisClient.del(key);
    logger.info('🔄 Rate limit réinitialisé pour utilisateur:', { userId });
  }
};

module.exports = {
  rateLimit: dynamicRateLimit,
  rateLimitConfigs,
  resetIpLimit,
  resetUserLimit,
  createRateLimit
};
