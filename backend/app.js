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
const path = require('path');

// Configuration
const config = require('./src/config');

// Middlewares
const errorHandler = require('./src/middleware/errorHandler');
const notFoundHandler = require('./src/middleware/notFoundHandler');
const loggerMiddleware = require('./src/middleware/logger');
const requestId = require('./src/middleware/requestId');
const timeout = require('./src/middleware/timeout');

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const orderRoutes = require('./src/routes/orders');
const cartRoutes = require('./src/routes/cart');
const reviewRoutes = require('./src/routes/reviews');
const paymentRoutes = require('./src/routes/payments');
const webhookRoutes = require('./src/routes/webhooks');
const uploadRoutes = require('./src/routes/uploads');
const analyticsRoutes = require('./src/routes/analytics');
const adminRoutes = require('./src/routes/admin');

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
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://*.supabase.co"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          frameSrc: ["'self'", "https://js.stripe.com"]
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS Configuration
    const corsOptions = {
      origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'https://localhost:3000',
          'https://localhost:3001',
        ];

        // Ajouter les domaines de production
        if (process.env.FRONTEND_URL) {
          allowedOrigins.push(process.env.FRONTEND_URL);
        }
        if (process.env.BACKEND_URL) {
          allowedOrigins.push(process.env.BACKEND_URL);
        }

        // Ajouter les domaines supplémentaires
        if (process.env.ALLOWED_ORIGINS) {
          const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
          allowedOrigins.push(...additionalOrigins);
        }

        // En développement, autoriser toutes les origines
        if (config.env === 'development') {
          return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          logger.warn(`CORS bloqué pour l'origine: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'Accept',
        'Stripe-Signature',
        'X-Supabase-Secret'
      ],
      maxAge: 86400 // 24 hours
    };

    this.app.use(cors(corsOptions));
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
        skip: (req) => {
          // Ne pas limiter les webhooks et health checks
          return req.path.startsWith('/webhooks') || req.path === '/health';
        },
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
      15 * 60 * 1000, // 15 minutes
      process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
      'Trop de requêtes, veuillez réessayer dans 15 minutes.'
    );

    const authLimiter = createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      10, // 10 tentatives de connexion
      'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
    );

    const strictLimiter = createRateLimiter(
      60 * 1000, // 1 minute
      30, // 30 requêtes par minute
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
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '50mb',
      parameterLimit: 1000
    }));

    logger.debug('✅ Body parser configuré');

    // Cookie parser
    this.app.use(cookieParser(process.env.COOKIE_SECRET || 'buy-sell-cookie-secret'));
    logger.debug('✅ Cookie parser configuré');

    // Sécurité des données
    this.app.use(mongoSanitize());
    this.app.use(xss());
    this.app.use(hpp());

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
    this.app.use(timeout(30000)); // 30 secondes

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
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: config.env === 'production' ? '7d' : '0',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
        // Cache control pour les images
        if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          res.set('Cache-Control', 'public, max-age=86400'); // 1 jour
        }
      }
    }));

    // Health check détaillé
    this.app.get('/health', async (req, res) => {
      const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env || 'development',
        version: '1.0.0',
        services: {
          database: 'connected',
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            rss: process.memoryUsage().rss
          },
          node: process.version,
          platform: process.platform
        }
      };

      try {
        // Vérification Supabase
        const { supabase } = require('./src/config/supabase');
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single();

        if (error) throw error;
        
        healthCheck.services.database = 'connected';
        healthCheck.services.supabase = 'healthy';

      } catch (error) {
        healthCheck.status = 'DEGRADED';
        healthCheck.services.database = 'error';
        healthCheck.services.supabase = 'unhealthy';
        healthCheck.services.database_error = error.message;
      }

      // Vérification Redis si activé
      if (process.env.REDIS_ENABLED === 'true') {
        try {
          const redis = require('./src/config/redis');
          await redis.ping();
          healthCheck.services.redis = 'connected';
        } catch (error) {
          healthCheck.status = 'DEGRADED';
          healthCheck.services.redis = 'error';
        }
      }

      const statusCode = healthCheck.status === 'OK' ? 200 : 503;
      res.status(statusCode).json(healthCheck);
    });

    // Readiness check
    this.app.get('/ready', (req, res) => {
      res.status(200).json({
        status: 'READY',
        service: 'BuySell API',
        timestamp: new Date().toISOString(),
        environment: config.env
      });
    });

    // Informations API
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'BuySell Marketplace API',
          version: '1.0.0',
          environment: config.env,
          timestamp: new Date().toISOString(),
          documentation: '/api/docs',
          status: 'operational',
          endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            categories: '/api/categories',
            orders: '/api/orders',
            cart: '/api/cart',
            reviews: '/api/reviews',
            payments: '/api/payments',
            uploads: '/api/uploads',
            analytics: '/api/analytics',
            admin: '/api/admin',
            webhooks: '/api/webhooks'
          }
        }
      });
    });

    // API Documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        documentation: 'https://docs.buy-sell.africa',
        version: '1.0.0',
        environment: config.env,
        openapi: '/api/openapi.json',
        postman: '/api/postman.json'
      });
    });

    // Routes API principales
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/cart', cartRoutes);
    this.app.use('/api/reviews', reviewRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/uploads', uploadRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/webhooks', webhookRoutes);

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
      limit: '10mb'
    });

    // Webhook Stripe (endpoint direct)
    this.app.post('/webhooks/stripe', webhookMiddleware, async (req, res) => {
      try {
        // Vérifier la signature Stripe en production
        if (config.env === 'production') {
          const stripe = require('./src/config/stripe');
          const signature = req.headers['stripe-signature'];
          
          try {
            const event = stripe.webhooks.constructEvent(
              req.rawBody, 
              signature, 
              process.env.STRIPE_WEBHOOK_SECRET
            );
            req.stripeEvent = event;
          } catch (error) {
            logger.warn('Signature Stripe invalide:', error.message);
            return res.status(400).json({ error: 'Signature webhook invalide' });
          }
        }

        const stripeWebhook = require('./src/controllers/webhookController').stripeWebhook;
        await stripeWebhook(req, res);
      } catch (error) {
        logger.error('Erreur webhook Stripe:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur traitement webhook'
        });
      }
    });

    // Webhook Supabase Auth
    this.app.post('/webhooks/supabase-auth', webhookMiddleware, async (req, res) => {
      try {
        // Vérification du secret en production
        if (config.env === 'production') {
          const supabaseSecret = req.headers['x-supabase-secret'];
          if (supabaseSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
            logger.warn('Secret Supabase invalide');
            return res.status(401).json({ error: 'Non autorisé' });
          }
        }

        const supabaseAuthWebhook = require('./src/controllers/webhookController').supabaseAuthWebhook;
        await supabaseAuthWebhook(req, res);
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

    // Route 404 pour API
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'Route API non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // Route 404 globale
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });

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
  start(port = process.env.PORT || 3001) {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, (error) => {
        if (error) {
          logger.error('❌ Erreur lors du démarrage du serveur:', error);
          return reject(error);
        }

        this.logStartupInfo(server, port);
        resolve(server);
      });

      // Gestion des erreurs du serveur
      server.on('error', (error) => {
        logger.error('❌ Erreur du serveur HTTP:', error);
        reject(error);
      });

      // Gestion du timeout du serveur
      server.setTimeout(30000);

      logger.debug('✅ Serveur HTTP configuré');
    });
  }

  /**
   * Logger les informations de démarrage
   */
  logStartupInfo(server, port) {
    const address = server.address();
    const protocol = config.env === 'production' ? 'https' : 'http';
    const host = config.env === 'production' 
      ? (process.env.BACKEND_URL || `localhost:${port}`)
      : `localhost:${port}`;
    
    logger.info('='.repeat(70));
    logger.info(`🎉 SERVEUR DÉMARRÉ AVEC SUCCÈS`);
    logger.info('='.repeat(70));
    logger.info(`📋 Application: BuySell Marketplace API v1.0.0`);
    logger.info(`📍 Environnement: ${config.env}`);
    logger.info(`🌐 URL: ${protocol}://${host}`);
    logger.info(`🔧 Port: ${port}`);
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
      { method: 'GET', path: '/ready', description: 'Readiness check' },
      { method: 'GET', path: '/api', description: 'Informations API' },
      { method: 'GET', path: '/api/docs', description: 'Documentation' },
      { method: 'POST', path: '/api/auth/login', description: 'Connexion' },
      { method: 'POST', path: '/api/auth/register', description: 'Inscription' },
      { method: 'GET', path: '/api/products', description: 'Liste produits' },
      { method: 'GET', path: '/api/products/:id', description: 'Détail produit' },
      { method: 'GET', path: '/api/categories', description: 'Liste catégories' },
      { method: 'POST', path: '/api/orders', description: 'Créer commande' },
      { method: 'GET', path: '/api/orders', description: 'Mes commandes' },
      { method: 'POST', path: '/api/payments/create-intent', description: 'Paiement' },
      { method: 'POST', path: '/api/uploads/image', description: 'Upload image' },
      { method: 'POST', path: '/webhooks/stripe', description: 'Webhook Stripe' },
      { method: 'POST', path: '/webhooks/supabase-auth', description: 'Webhook Supabase' }
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
      name: 'BuySell Marketplace API',
      version: '1.0.0',
      environment: config.env,
      port: process.env.PORT || 3001,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        compression: true,
        cors: true,
        helmet: true,
        rateLimit: true,
        security: true
      }
    };
  }
}

module.exports = App;
