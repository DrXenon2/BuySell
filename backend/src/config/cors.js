const cors = require('cors');
const config = require('./index');
const logger = require('../utils/logger');

// Liste des origines autorisées
const allowedOrigins = [
  // Développement local
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  
  // Staging
  'https://staging.buysell.com',
  'https://www.staging.buysell.com',
  
  // Production
  'https://buysell.com',
  'https://www.buysell.com',
  
  // Mobile apps (si applicable)
  'capacitor://localhost',
  'ionic://localhost',
];

// Ajouter les origines depuis la configuration
if (config.cors.origin && Array.isArray(config.cors.origin)) {
  config.cors.origin.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// Fonction de validation d'origine
const originValidator = (origin, callback) => {
  // Autoriser les requêtes sans origine (mobile apps, postman, curl, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Vérifier si l'origine est dans la liste autorisée
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    // En développement, logger l'origine non autorisée mais l'accepter
    if (config.env === 'development') {
      logger.warn('🌐 Origine CORS non autorisée en développement:', { origin });
      return callback(null, true);
    }
    
    // En production, rejeter les origines non autorisées
    logger.warn('🚫 Origine CORS non autorisée:', { origin });
    callback(new Error('Origine non autorisée par CORS'));
  }
};

// Configuration CORS principale
const corsOptions = {
  origin: originValidator,
  
  // Méthodes HTTP autorisées
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  
  // En-têtes autorisés
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Access-Token',
    'X-Refresh-Token',
    'X-API-Key',
    'X-Client-Version',
    'X-Device-ID',
    'X-Platform',
    'X-Request-ID',
    'Stripe-Signature', // Pour les webhooks Stripe
    'User-Agent'
  ],
  
  // En-têtes exposés au client
  exposedHeaders: [
    'X-Access-Token',
    'X-Refresh-Token',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
    'Content-Range',
    'Content-Length'
  ],
  
  // Credentials (cookies, auth headers)
  credentials: true,
  
  // Cache des pré-vols (en secondes)
  maxAge: 86400, // 24 heures
  
  // Options supplémentaires
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// Configuration CORS pour les webhooks (moins restrictive)
const webhookCorsOptions = {
  origin: true, // Toutes les origines pour les webhooks
  methods: ['POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Stripe-Signature',
    'User-Agent',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  credentials: false,
  maxAge: 300, // 5 minutes
  optionsSuccessStatus: 204
};

// Configuration CORS pour les assets publics
const publicCorsOptions = {
  origin: true, // Toutes les origines pour les assets publics
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Range', 'User-Agent'],
  exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length'],
  credentials: false,
  maxAge: 86400 // 24 heures
};

// Middleware CORS principal
const corsMiddleware = cors(corsOptions);

// Middleware CORS pour les webhooks
const webhookCorsMiddleware = cors(webhookCorsOptions);

// Middleware CORS pour les assets publics
const publicCorsMiddleware = cors(publicCorsOptions);

// Middleware CORS personnalisé avec logging
const customCorsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const path = req.path;
  
  // Déterminer la configuration CORS en fonction du chemin
  let corsHandler;
  
  if (path.startsWith('/webhooks/')) {
    // Webhooks - CORS permissif
    corsHandler = webhookCorsMiddleware;
    logger.debug('🌐 CORS Webhook:', { origin, path });
  } else if (path.startsWith('/uploads/') || path.startsWith('/assets/')) {
    // Assets publics - CORS ouvert
    corsHandler = publicCorsMiddleware;
    logger.debug('🌐 CORS Public:', { origin, path });
  } else {
    // Routes API - CORS contrôlé
    corsHandler = corsMiddleware;
    
    // Log des origines non standard en production
    if (config.env === 'production' && origin && !allowedOrigins.includes(origin)) {
      logger.warn('🌐 Origine CORS non standard en production:', { origin, path });
    }
  }
  
  // Appliquer le middleware CORS approprié
  return corsHandler(req, res, next);
};

// Middleware pour ajouter les en-têtes CORS manuellement si nécessaire
const manualCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Ajouter des en-têtes CORS supplémentaires
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // En-têtes de sécurité supplémentaires
    res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', corsOptions.maxAge.toString());
  }
  
  next();
};

// Fonction pour vérifier si une origine est autorisée
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Les requêtes sans origine sont autorisées
  return allowedOrigins.includes(origin);
};

// Fonction pour ajouter une origine temporairement (utile pour le développement)
const addTemporaryOrigin = (origin) => {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin);
    logger.info('🌐 Origine CORS temporaire ajoutée:', { origin });
    
    // Supprimer après 24 heures (pour le développement)
    if (config.env === 'development') {
      setTimeout(() => {
        const index = allowedOrigins.indexOf(origin);
        if (index > -1) {
          allowedOrigins.splice(index, 1);
          logger.info('🌐 Origine CORS temporaire supprimée:', { origin });
        }
      }, 24 * 60 * 60 * 1000); // 24 heures
    }
  }
};

// Middleware pour les erreurs CORS
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Origine non autorisée par CORS') {
    logger.warn('🚫 Erreur CORS:', {
      origin: req.headers.origin,
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origine non autorisée',
      code: 'CORS_ORIGIN_NOT_ALLOWED'
    });
  }
  
  next(err);
};

// Export des configurations et middlewares
module.exports = {
  // Middlewares
  corsMiddleware: customCorsMiddleware,
  webhookCorsMiddleware,
  publicCorsMiddleware,
  manualCorsHeaders,
  corsErrorHandler,
  
  // Configurations
  corsOptions,
  webhookCorsOptions,
  publicCorsOptions,
  
  // Fonctions utilitaires
  isOriginAllowed,
  addTemporaryOrigin,
  allowedOrigins,
  
  // Configuration complète pour une utilisation directe
  config: {
    development: {
      ...corsOptions,
      origin: (origin, callback) => {
        // En développement, accepter toutes les origines
        callback(null, true);
      }
    },
    production: corsOptions,
    staging: corsOptions
  }[config.env] || corsOptions
};

// Log de la configuration au démarrage
logger.info('🌐 Configuration CORS initialisée', {
  environment: config.env,
  allowedOrigins: config.env === 'production' ? 
    allowedOrigins.length : 
    allowedOrigins,
  credentials: corsOptions.credentials,
  maxAge: `${corsOptions.maxAge}s`
});
