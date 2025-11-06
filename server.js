/**
 * Serveur Principal - BuySell Platform
 * Point d'entrée de l'application backend
 * CommonJS Version
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import des configurations
const config = require('./src/config');
const { connectDatabase } = require('./src/config/database');
const { setupSupabase } = require('./src/config/supabase');
const { connectRedis } = require('./src/config/redis');

// Import des middlewares
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');
const { authenticateToken } = require('./src/middleware/auth');

// Import des routes
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

// Import des services
const { initializeSocketHandlers } = require('./src/services/socketService');
const { startCronJobs } = require('./src/jobs');

class BuySellServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: this.getCorsOrigins(),
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.port = process.env.PORT || 3001;
    this.env = process.env.NODE_ENV || 'development';
    this.isProduction = this.env === 'production';

    this.initializeServer();
  }

  /**
   * Initialisation du serveur
   */
  async initializeServer() {
    try {
      console.log('🚀 Initialisation du serveur BuySell Platform...');
      
      // Configuration de base
      this.setupBasicConfig();
      
      // Middlewares de sécurité
      this.setupSecurityMiddlewares();
      
      // Middlewares standards
      this.setupStandardMiddlewares();
      
      // Routes de l'API
      this.setupRoutes();
      
      // Gestion des erreurs
      this.setupErrorHandling();
      
      // Initialisation des services
      await this.initializeServices();
      
      console.log('✅ Serveur initialisé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
      process.exit(1);
    }
  }

  /**
   * Configuration de base
   */
  setupBasicConfig() {
    // Trust proxy pour les headers X-Forwarded-*
    this.app.set('trust proxy', 1);
    
    // Désactiver x-powered-by
    this.app.disable('x-powered-by');
  }

  /**
   * Configuration des origines CORS
   */
  getCorsOrigins() {
    const origins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
    ];

    // Ajouter les domaines de production depuis la config
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }

    // Ajouter les domaines supplémentaires depuis les variables d'environnement
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      origins.push(...additionalOrigins);
    }

    // En développement, autoriser toutes les origines
    if (this.env === 'development') {
      origins.push(/.*/);
    }

    return origins;
  }

  /**
   * Middlewares de sécurité
   */
  setupSecurityMiddlewares() {
    // Helmet.js pour la sécurité
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://*.supabase.co", "wss://*.supabase.co"],
          frameSrc: ["'self'", "https://js.stripe.com"]
        }
      }
    }));

    // CORS Configuration
    this.app.use(cors({
      origin: this.getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'X-Request-ID',
        'X-CSRF-Token',
        'Accept',
        'Stripe-Signature'
      ]
    }));

    // Rate Limiting global
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
      message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Ne pas limiter les webhooks et health checks
        return req.path.startsWith('/api/webhooks') || req.path === '/health';
      }
    });

    this.app.use(globalLimiter);

    // Rate limiting plus strict pour l'authentification
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
      }
    });
  }

  /**
   * Middlewares standards
   */
  setupStandardMiddlewares() {
    // Body Parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf; // Pour les webhooks Stripe
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Cookie Parser
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (this.env !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Request Logger personnalisé
    this.app.use(requestLogger);

    // Static Files
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
      }
    }));

    // Security Headers supplémentaires
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      next();
    });
  }

  /**
   * Configuration des routes
   */
  setupRoutes() {
    // Route racine
    this.app.get('/', (req, res) => {
      res.json({
        message: '🛍️ BuySell Marketplace API',
        version: '1.0.0',
        description: 'Africa\'s Smart Marketplace - Buy New, Sell Smart',
        documentation: '/api/docs',
        status: 'operational',
        environment: this.env,
        timestamp: new Date().toISOString()
      });
    });

    // Health checks
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/ready', this.readinessCheck.bind(this));

    // API Status
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'OK',
        service: 'BuySell API',
        version: '1.0.0',
        environment: this.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    // API Routes
    this.app.use('/api/auth', this.authLimiter, authRoutes);
    this.app.use('/api/users', authenticateToken, userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/orders', authenticateToken, orderRoutes);
    this.app.use('/api/cart', authenticateToken, cartRoutes);
    this.app.use('/api/reviews', reviewRoutes);
    this.app.use('/api/payments', authenticateToken, paymentRoutes);
    this.app.use('/api/webhooks', webhookRoutes); // Pas d'authentification pour les webhooks
    this.app.use('/api/uploads', authenticateToken, uploadRoutes);
    this.app.use('/api/analytics', authenticateToken, analyticsRoutes);
    this.app.use('/api/admin', authenticateToken, adminRoutes);

    // API Documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        documentation: 'https://docs.buy-sell.africa',
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
        },
        version: '1.0.0',
        environment: this.env
      });
    });

    // 404 Handler pour les routes API
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'Route API non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });
  }

  /**
   * Health Check endpoint
   */
  async healthCheck(req, res) {
    const healthcheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.env,
      checks: {
        database: 'healthy',
        redis: process.env.REDIS_ENABLED ? 'healthy' : 'disabled',
        memory: process.memoryUsage(),
        supabase: 'healthy'
      }
    };

    try {
      // Vérifier la connexion Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      
      res.status(200).json(healthcheck);
    } catch (error) {
      healthcheck.status = 'ERROR';
      healthcheck.checks.database = 'unhealthy';
      healthcheck.checks.supabase = 'unhealthy';
      healthcheck.error = error.message;
      
      console.error('Health check failed:', error);
      res.status(503).json(healthcheck);
    }
  }

  /**
   * Readiness Check endpoint
   */
  readinessCheck(req, res) {
    res.status(200).json({
      status: 'READY',
      service: 'BuySell API',
      timestamp: new Date().toISOString(),
      environment: this.env
    });
  }

  /**
   * Gestion des erreurs
   */
  setupErrorHandling() {
    // 404 Handler global
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // Error handling middleware
    this.app.use(errorHandler);

    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Rejet de promesse non géré:', reason);
      console.error('Au niveau de la promesse:', promise);
    });

    process.on('uncaughtException', (error) => {
      console.error('Exception non capturée:', error);
      process.exit(1);
    });
  }

  /**
   * Initialisation des services
   */
  async initializeServices() {
    console.log('📊 Initialisation des services...');
    
    try {
      // Base de données
      await connectDatabase();
      console.log('✅ Base de données connectée');

      // Supabase
      await setupSupabase();
      console.log('✅ Supabase configuré');

      // Redis
      if (process.env.REDIS_ENABLED === 'true') {
        await connectRedis();
        console.log('✅ Redis connecté');
      }

      // Socket.IO
      initializeSocketHandlers(this.io);
      console.log('✅ Socket.IO initialisé');

      // Jobs Cron
      if (this.isProduction) {
        startCronJobs();
        console.log('✅ Jobs Cron démarrés');
      }

      console.log('✅ Tous les services initialisés');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des services:', error);
      throw error;
    }
  }

  /**
   * Démarrage du serveur
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) {
          console.error('❌ Erreur lors du démarrage du serveur:', err);
          return reject(err);
        }

        console.log(`
🛍️  BuySell Marketplace Server Started!
      
📍 Environment: ${this.env}
🚀 Server running on port: ${this.port}
📚 API Documentation: http://localhost:${this.port}/api/docs
❤️  Health Check: http://localhost:${this.port}/health
🔍 Status: http://localhost:${this.port}/api/status
🔌 WebSocket: ws://localhost:${this.port}

🌟 BuySell - Africa's Smart Marketplace
💡 Buy New, Sell Smart!
        `);

        // Configuration de l'arrêt gracieux
        this.setupGracefulShutdown();
        
        resolve(this.server);
      });
    });
  }

  /**
   * Configuration de l'arrêt gracieux
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      console.log(`\n📢 Signal ${signal} reçu. Arrêt gracieux du serveur...`);
      
      this.server.close((err) => {
        if (err) {
          console.error('❌ Erreur lors de l\'arrêt du serveur:', err);
          process.exit(1);
        }

        console.log('✅ Serveur HTTP fermé.');
        
        // Fermer les connexions de base de données
        console.log('✅ Toutes les connexions fermées. Arrêt terminé.');
        process.exit(0);
      });

      // Arrêt forcé après 10 secondes
      setTimeout(() => {
        console.error('❌ Impossible de fermer les connexions à temps, arrêt forcé');
        process.exit(1);
      }, 10000);
    };

    // Écouter les signaux de terminaison
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Arrêt du serveur
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Serveur arrêté');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Getter pour l'app Express (pour les tests)
   */
  getApp() {
    return this.app;
  }

  /**
   * Getter pour Socket.IO (pour les tests)
   */
  getIO() {
    return this.io;
  }
}

// Création et démarrage du serveur
const buySellServer = new BuySellServer();

// Démarrage du serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  buySellServer.start().catch(console.error);
}

module.exports = buySellServer;
