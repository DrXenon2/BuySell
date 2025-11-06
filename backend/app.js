const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');

// Configuration
const config = require('./config');

// Middlewares
const errorHandler = require('./src/middleware/errorHandler');
const notFoundHandler = require('./src/middleware/notFoundHandler');
const loggerMiddleware = require('./src/middleware/logger');
const requestId = require('./src/middleware/requestId');
const timeout = require('./src/middleware/timeout');

// Routes
const routes = require('./src/routes');

// Services
const logger = require('./src/utils/logger');

class App {
  constructor() {
    this.app = express();
    this.setupSecurity();
    this.setupStandardMiddlewares();
    this.setupCustomMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupWebhooks();
  }

  /**
   * Configuration de la sécurité
   */
  setupSecurity() {
    logger.info('🔒 Configuration de la sécurité...');

    // Trust proxy pour la production
    if (config.env === 'production') {
      this.app.set('trust proxy', 1);
      logger.debug('✅ Trust proxy activé');
    }

    // Helmet - Sécurité HTTP
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'", "https://js.stripe.com"],
          childSrc: ["'self'", "blob:"]
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors(config.cors));
    logger.debug('✅ CORS configuré');

    // Rate Limiting
    const createRateLimiter = (windowMs, max, message) => {
      return rateLimit({
        windowMs,
        max,
        message: {
          success: false,
          error: 'Trop de requêtes',
          message
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          logger.warn('Rate limit dépassé', {
            ip: req.ip,
            url: req.url,
            userAgent: req.get('User-Agent')
          });
          res.status(429).json({
            success: false,
            error: 'Trop de requêtes',
            message
          });
        }
      });
    };

    // Rate limiters pour différents endpoints
    const generalLimiter = createRateLimiter(
      config.rateLimit.windowMs,
      config.rateLimit.max,
      'Trop de requêtes, veuillez réessayer dans 15 minutes.'
    );

    const authLimiter = createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      5, // 5 tentatives de connexion
      'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
    );

    const strictLimiter = createRateLimiter(
      60 * 1000, // 1 minute
      10, // 10 requêtes par minute
      'Trop de requêtes, veuillez ralentir.'
    );

    // Appliquer les rate limiters
    this.app.use('/api/auth/', authLimiter);
    this.app.use('/api/uploads/', strictLimiter);
    this.app.use('/api/', generalLimiter);

    logger.debug('✅ Rate limiting configuré');
  }

  /**
   * Configuration des middlewares standards
   */
  setupStandardMiddlewares() {
    logger.info('🔧 Configuration des middlewares standards...');

    // Compression GZIP
    this.app.use(compression({
      level: 6,
      threshold: 1024
    }));
    logger.debug('✅ Compression activée');

    // Body parsing avec limites
    this.app.use(express.json({
      limit: config.upload.maxFileSize,
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: config.upload.maxFileSize,
      parameterLimit: 1000 // Nombre maximum de paramètres
    }));

    logger.debug('✅ Body parser configuré');

    // Cookie parser
    this.app.use(cookieParser(config.security.cookieSecret));
    logger.debug('✅ Cookie parser configuré');

    // Sécurité des données
    this.app.use(mongoSanitize()); // Prévention NoSQL injection
    this.app.use(xss()); // Prévention XSS
    this.app.use(hpp()); // Prévention parameter pollution

    logger.debug('✅ Sécurité des données configurée');
  }

  /**
   * Configuration des middlewares personnalisés
   */
  setupCustomMiddlewares() {
    logger.info('🔧 Configuration des middlewares personnalisés...');

    // Request ID pour le tracking
    this.app.use(requestId);

    // Timeout des requêtes
    this.app.use(timeout(config.server.requestTimeout));

    // Logging des requêtes
    if (config.env !== 'test') {
      const morganFormat = config.env === 'production' 
        ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
        : 'dev';

      this.app.use(morgan(morganFormat, {
        stream: {
          write: (message) => {
            const logMessage = message.trim();
            if (logMessage.length > 0) {
              logger.http(logMessage);
            }
          }
        },
        skip: (req) => {
          // Ignorer les health checks dans les logs en production
          return config.env === 'production' && req.url === '/health';
        }
      }));
    }

    // Logger personnalisé
    this.app.use(loggerMiddleware);

    logger.debug('✅ Middlewares personnalisés configurés');
  }

  /**
   * Configuration des routes
   */
  setupRoutes() {
    logger.info('🛣️  Configuration des routes...');

    // Servir les fichiers statiques
    this.app.use('/uploads', express.static(config.upload.uploadDir, {
      maxAge: config.env === 'production' ? '1d' : '0',
      setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
      }
    }));

    // Health check détaillé
    this.app.get('/health', async (req, res) => {
      const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: config.app.version,
        services: {
          database: 'connected',
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal
          },
          node: process.version
        }
      };

      // Vérification de la base de données
      try {
        const { supabase } = require('./src/config/supabase');
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (error) {
          healthCheck.status = 'DEGRADED';
          healthCheck.services.database = 'error';
          healthCheck.services.database_error = error.message;
        } else {
          healthCheck.services.database = 'connected';
        }
      } catch (error) {
        healthCheck.status = 'DEGRADED';
        healthCheck.services.database = 'error';
        healthCheck.services.database_error = error.message;
      }

      const statusCode = healthCheck.status === 'OK' ? 200 : 503;
      res.status(statusCode).json(healthCheck);
    });

    // Informations API
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        data: {
          name: config.app.name,
          version: config.app.version,
          environment: config.env,
          timestamp: new Date().toISOString(),
          documentation: '/api/docs',
          status: 'operational',
          endpoints: {
            auth: {
              login: 'POST /api/auth/login',
              register: 'POST /api/auth/register',
              refresh: 'POST /api/auth/refresh',
              logout: 'POST /api/auth/logout',
              forgotPassword: 'POST /api/auth/forgot-password',
              resetPassword: 'POST /api/auth/reset-password'
            },
            users: {
              profile: 'GET /api/users/profile',
              updateProfile: 'PUT /api/users/profile',
              addresses: 'GET /api/users/addresses',
              wishlist: 'GET /api/users/wishlist'
            },
            products: {
              list: 'GET /api/products',
              get: 'GET /api/products/:id',
              create: 'POST /api/products',
              update: 'PUT /api/products/:id',
              delete: 'DELETE /api/products/:id'
            },
            categories: {
              list: 'GET /api/categories',
              get: 'GET /api/categories/:id'
            },
            orders: {
              list: 'GET /api/orders',
              create: 'POST /api/orders',
              get: 'GET /api/orders/:id',
              update: 'PUT /api/orders/:id'
            },
            cart: {
              get: 'GET /api/cart',
              add: 'POST /api/cart',
              update: 'PUT /api/cart/:itemId',
              remove: 'DELETE /api/cart/:itemId',
              clear: 'DELETE /api/cart'
            },
            payments: {
              createIntent: 'POST /api/payments/create-intent',
              confirm: 'POST /api/payments/confirm',
              history: 'GET /api/payments/history'
            },
            reviews: {
              create: 'POST /api/reviews',
              list: 'GET /api/reviews/product/:productId',
              update: 'PUT /api/reviews/:id',
              delete: 'DELETE /api/reviews/:id'
            },
            uploads: {
              image: 'POST /api/uploads/image',
              multiple: 'POST /api/uploads/multiple',
              delete: 'DELETE /api/uploads'
            },
            admin: {
              dashboard: 'GET /api/admin/dashboard',
              users: 'GET /api/admin/users',
              products: 'GET /api/admin/products',
              orders: 'GET /api/admin/orders'
            },
            analytics: {
              dashboard: 'GET /api/analytics/dashboard',
              sales: 'GET /api/analytics/sales',
              products: 'GET /api/analytics/products'
            }
          }
        }
      });
    });

    // Routes API principales
    this.app.use('/api', routes);

    logger.info('✅ Routes principales configurées');
  }

  /**
   * Configuration des webhooks
   */
  setupWebhooks() {
    logger.info('🔗 Configuration des webhooks...');

    // Middleware pour les webhooks (body raw)
    const webhookMiddleware = express.raw({
      type: 'application/json',
      limit: config.upload.maxFileSize
    });

    // Webhook Stripe
    this.app.post('/webhooks/stripe', webhookMiddleware, (req, res) => {
      try {
        const stripeWebhook = require('./src/controllers/webhookController').stripeWebhook;
        stripeWebhook(req, res);
      } catch (error) {
        logger.error('Erreur webhook Stripe:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur traitement webhook'
        });
      }
    });

    // Webhook Supabase Auth
    this.app.post('/webhooks/supabase-auth', webhookMiddleware, (req, res) => {
      try {
        const supabaseAuthWebhook = require('./src/controllers/webhookController').supabaseAuthWebhook;
        supabaseAuthWebhook(req, res);
      } catch (error) {
        logger.error('Erreur webhook Supabase Auth:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur traitement webhook'
        });
      }
    });

    logger.debug('✅ Webhooks configurés');
  }

  /**
   * Configuration de la gestion des erreurs
   */
  setupErrorHandling() {
    logger.info('🚨 Configuration de la gestion des erreurs...');

    // Route 404
    this.app.use(notFoundHandler);

    // Handler d'erreurs global
    this.app.use(errorHandler);

    // Gestion des rejets de promesses non gérés
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('REJET NON GÉRÉ:', {
        promise: promise.toString(),
        reason: reason?.message || reason,
        stack: reason?.stack
      });

      // En production, exit le processus pour redémarrage
      if (config.env === 'production') {
        process.exit(1);
      }
    });

    // Gestion des exceptions non capturées
    process.on('uncaughtException', (error) => {
      logger.error('EXCEPTION NON CAPTURÉE:', {
        error: error.message,
        stack: error.stack,
        pid: process.pid
      });

      // En production, exit le processus pour redémarrage
      if (config.env === 'production') {
        process.exit(1);
      }
    });

    logger.debug('✅ Gestion des erreurs configurée');
  }

  /**
   * Démarrer le serveur
   */
  start() {
    const PORT = config.server.port;
    const HOST = config.server.host;
    
    return new Promise((resolve, reject) => {
      const server = this.app.listen(PORT, HOST, (error) => {
        if (error) {
          logger.error('❌ Erreur lors du démarrage du serveur:', error);
          return reject(error);
        }

        this.logStartupInfo(server);
        resolve(server);
      });

      // Gestion des erreurs du serveur
      server.on('error', (error) => {
        logger.error('❌ Erreur du serveur HTTP:', error);
        reject(error);
      });

      // Gestion du timeout du serveur
      server.setTimeout(config.server.requestTimeout);

      logger.debug('✅ Serveur HTTP configuré');
    });
  }

  /**
   * Logger les informations de démarrage
   */
  logStartupInfo(server) {
    const address = server.address();
    const protocol = config.env === 'production' ? 'https' : 'http';
    const host = config.env === 'production' ? config.app.backendUrl : `${config.server.host}:${address.port}`;
    
    logger.info('='.repeat(70));
    logger.info(`🎉 SERVEUR DÉMARRÉ AVEC SUCCÈS`);
    logger.info('='.repeat(70));
    logger.info(`📋 Application: ${config.app.name} v${config.app.version}`);
    logger.info(`📍 Environnement: ${config.env}`);
    logger.info(`🌐 URL: ${protocol}://${host}`);
    logger.info(`🔧 Port: ${address.port}`);
    logger.info(`👤 Processus: ${process.pid}`);
    logger.info(`🕒 Démarrage: ${new Date().toISOString()}`);
    logger.info('='.repeat(70));
    
    // Log des endpoints disponibles
    this.logAvailableEndpoints(protocol, host);
    
    logger.info('='.repeat(70));
  }

  /**
   * Logger les endpoints disponibles
   */
  logAvailableEndpoints(protocol, host) {
    const endpoints = [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/api', description: 'Informations API' },
      { method: 'POST', path: '/api/auth/login', description: 'Connexion' },
      { method: 'POST', path: '/api/auth/register', description: 'Inscription' },
      { method: 'GET', path: '/api/products', description: 'Liste produits' },
      { method: 'GET', path: '/api/products/:id', description: 'Détail produit' },
      { method: 'GET', path: '/api/categories', description: 'Liste catégories' },
      { method: 'POST', path: '/api/orders', description: 'Créer commande' },
      { method: 'GET', path: '/api/orders', description: 'Mes commandes' },
      { method: 'POST', path: '/api/payments/create-intent', description: 'Paiement' },
      { method: 'POST', path: '/api/uploads/image', description: 'Upload image' },
      { method: 'POST', path: '/webhooks/stripe', description: 'Webhook Stripe' }
    ];

    logger.info('📋 ENDPOINTS DISPONIBLES:');
    endpoints.forEach(endpoint => {
      const url = `${protocol}://${host}${endpoint.path}`;
      logger.info(`   ${endpoint.method.padEnd(6)} ${url.padEnd(45)} ${endpoint.description}`);
    });
  }

  /**
   * Obtenir l'instance Express
   */
  getApp() {
    return this.app;
  }

  /**
   * Obtenir les informations du serveur
   */
  getServerInfo() {
    return {
      name: config.app.name,
      version: config.app.version,
      environment: config.env,
      port: config.server.port,
      host: config.server.host,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        compression: true,
        cors: true,
        helmet: true,
        rateLimit: true,
        clustering: config.env === 'production'
      }
    };
  }
}

module.exports = App;
