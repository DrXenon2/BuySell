/**
 * Serveur principal de l'application Buy-Sell Platform
 * Point d'entrée du backend Express.js
 * Fichier: backend/server.js
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');
const socketIo = require('socket.io');

// Import de la configuration
const config = require('./src/config');
const { connectDatabase } = require('./src/config/database');
const { setupSupabase } = require('./src/config/supabase');
const { connectRedis } = require('./src/config/redis');

// Import des middlewares
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');
const { sanitizeInput } = require('./src/middleware/sanitize');
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

class Server {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.port = process.env.PORT || 3001;
    this.env = process.env.NODE_ENV || 'development';
    this.isProduction = this.env === 'production';
    
    // Initialisation Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    );

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialisation des middlewares
   */
  initializeMiddlewares() {
    // Compression GZIP
    this.app.use(compression());

    // Trust proxy
    this.app.set('trust proxy', 1);

    // Désactiver x-powered-by
    this.app.disable('x-powered-by');

    // Sécurité Helmet
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false // Désactivé pour faciliter le développement
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'Accept',
        'Stripe-Signature'
      ],
      maxAge: 86400, // 24 hours
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
      message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: 900 // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for webhooks and health checks
        return req.path.startsWith('/api/webhooks') || req.path === '/health';
      }
    });

    this.app.use(limiter);

    // Rate limiting pour l'authentification
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
        retryAfter: 900
      }
    });

    // Body parsers
    this.app.use(express.json({
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf; // Pour les webhooks Stripe
      }
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '50mb'
    }));

    // Cookie parser
    this.app.use(cookieParser());

    // Static files - servir les uploads
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
      }
    }));

    // Logging
    if (this.env !== 'test') {
      this.app.use(morgan(this.isProduction ? 'combined' : 'dev'));
    }

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });

    // Input sanitization
    if (typeof sanitizeInput === 'function') {
      this.app.use(sanitizeInput);
    }

    // Security headers
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
   * Configuration des origines CORS
   */
  getCorsOrigins() {
    const origins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ];

    // Ajouter les domaines de production
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }

    if (process.env.BACKEND_URL) {
      origins.push(process.env.BACKEND_URL);
    }

    // Ajouter les domaines supplémentaires
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      origins.push(...additionalOrigins);
    }

    // En développement, autoriser toutes les origines
    if (this.env === 'development') {
      return true;
    }

    return origins;
  }

  /**
   * Initialisation des routes
   */
  initializeRoutes() {
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
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/cart', cartRoutes);
    this.app.use('/api/reviews', reviewRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/webhooks', webhookRoutes);
    this.app.use('/api/uploads', uploadRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/admin', adminRoutes);

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

    // 404 handler pour les routes API
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'Route API non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // 404 handler global
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
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
      const { data, error } = await this.supabase.from('profiles').select('count').limit(1);
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
  initializeErrorHandling() {
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);

      // Erreur JWT
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token invalide',
          message: 'Le token d\'authentification est invalide'
        });
      }

      // Erreur d'expiration JWT
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expiré',
          message: 'Le token d\'authentification a expiré'
        });
      }

      // Erreur de validation
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Données invalides',
          message: err.message,
          details: err.details
        });
      }

      // Erreur par défaut
      res.status(err.status || 500).json({
        error: 'Erreur interne du serveur',
        message: this.isProduction ? 'Une erreur est survenue' : err.message,
        ...(this.isProduction ? {} : { stack: err.stack })
      });
    });

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Initialisation Socket.IO
   */
  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Nouvelle connexion Socket.IO:', socket.id);

      // Rejoindre une room utilisateur
      socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 Utilisateur ${userId} a rejoint sa room`);
      });

      // Rejoindre une room order
      socket.on('join-order-room', (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`📦 Order ${orderId} - nouvelle connexion`);
      });

      // Gestion de la déconnexion
      socket.on('disconnect', () => {
        console.log('🔌 Déconnexion Socket.IO:', socket.id);
      });

      // Gestion des erreurs
      socket.on('error', (error) => {
        console.error('❌ Erreur Socket.IO:', error);
      });
    });

    console.log('🔌 Socket.IO handlers configurés');
  }

  /**
   * Jobs Cron
   */
  startCronJobs() {
    console.log('⏰ Jobs Cron démarrés');
    // Les jobs sont gérés dans src/jobs/
  }

  /**
   * Démarrage du serveur
   */
  async start() {
    try {
      console.log('🚀 Démarrage du serveur Buy-Sell Platform...');
      console.log(`📍 Environnement: ${this.env}`);

      // Connexion à la base de données
      if (typeof connectDatabase === 'function') {
        console.log('📊 Connexion à la base de données...');
        await connectDatabase();
        console.log('✅ Base de données connectée avec succès');
      }

      // Configuration Supabase
      if (typeof setupSupabase === 'function') {
        console.log('🔑 Configuration de Supabase...');
        await setupSupabase();
        console.log('✅ Supabase configuré avec succès');
      }

      // Redis
      if (process.env.REDIS_ENABLED === 'true' && typeof connectRedis === 'function') {
        console.log('🔴 Connexion à Redis...');
        await connectRedis();
        console.log('✅ Redis connecté');
      }

      // Création du serveur HTTP/HTTPS
      if (process.env.SSL_ENABLED === 'true' && this.isProduction) {
        const sslOptions = {
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH),
          ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH) : null
        };
        this.server = https.createServer(sslOptions, this.app);
        console.log('🔒 Serveur HTTPS créé');
      } else {
        this.server = http.createServer(this.app);
        console.log('🌐 Serveur HTTP créé');
      }

      // Initialisation Socket.IO
      console.log('🔌 Initialisation de Socket.IO...');
      this.io = socketIo(this.server, {
        cors: {
          origin: this.getCorsOrigins(),
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
      this.initializeSocketHandlers();
      console.log('✅ Socket.IO initialisé');

      // Démarrage des jobs cron
      console.log('⏰ Démarrage des jobs planifiés...');
      this.startCronJobs();
      console.log('✅ Jobs planifiés démarrés');

      // Démarrage du serveur
      this.server.listen(this.port, () => {
        console.log(`🎉 Serveur démarré avec succès!`);
        console.log(`📍 Port: ${this.port}`);
        console.log(`🌍 Environnement: ${this.env}`);
        console.log(`📚 API: http://localhost:${this.port}/api`);
        console.log(`📖 Documentation: http://localhost:${this.port}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
        console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
        
        if (this.env === 'development') {
          console.log('\n🚀 Points de terminaison API:');
          console.log(`   - Auth: http://localhost:${this.port}/api/auth`);
          console.log(`   - Products: http://localhost:${this.port}/api/products`);
          console.log(`   - Users: http://localhost:${this.port}/api/users`);
          console.log(`   - Orders: http://localhost:${this.port}/api/orders`);
          console.log(`   - Payments: http://localhost:${this.port}/api/payments`);
        }
      });

      // Gestion gracieuse de l'arrêt
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }
  }

  /**
   * Configuration de l'arrêt gracieux
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n📞 Signal ${signal} reçu. Arrêt gracieux du serveur...`);
      
      // Arrêt du serveur
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Serveur HTTP arrêté');
        });
      }

      console.log('👋 Arrêt du processus...');
      process.exit(0);
    };

    // Gestion des signaux d'arrêt
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('💥 Exception non capturée:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Rejet de promesse non géré:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
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
}

// Création et démarrage du serveur
const server = new Server();

// Démarrage du serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  server.start();
}

// Export pour les tests
module.exports = { server, app: server.app };
