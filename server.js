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
// Dans votre server.js principal
const App = require('./app');
const app = new App();
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

class BuySellServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: this.getCorsOrigins(),
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });
    
    this.port = process.env.PORT || 3001;
    this.env = process.env.NODE_ENV || 'development';
    this.isProduction = this.env === 'production';

    // Initialisation Supabase
    this.supabase = require('@supabase/supabase-js').createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    );

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
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ];

    // Ajouter les domaines de production depuis la config
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }

    if (process.env.BACKEND_URL) {
      origins.push(process.env.BACKEND_URL);
    }

    // Ajouter les domaines supplémentaires depuis les variables d'environnement
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      origins.push(...additionalOrigins);
    }

    // En développement, autoriser toutes les origines
    if (this.env === 'development') {
      return true; // Autoriser toutes les origines en dev
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
      contentSecurityPolicy: false // Désactivé pour faciliter le développement
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
      max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
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
      max: 10,
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
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf; // Pour les webhooks Stripe
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '50mb' 
    }));

    // Cookie Parser
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (this.env !== 'test') {
      this.app.use(morgan(this.isProduction ? 'combined' : 'dev'));
    }

    // Request Logger personnalisé
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Static Files
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: '7d',
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
    
app.start().then(server => {
  console.log('Serveur démarré !');
}).catch(error => {
  console.error('Erreur démarrage:', error);
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
    this.app.use('/api/users', userRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/orders', orderRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/cart', cartRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/reviews', reviewRoutes);
    this.app.use('/api/payments', paymentRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/webhooks', webhookRoutes); // Pas d'authentification pour les webhooks
    this.app.use('/api/uploads', uploadRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/analytics', analyticsRoutes); // authenticateToken géré dans les routes
    this.app.use('/api/admin', adminRoutes); // authenticateToken géré dans les routes

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
      if (typeof connectDatabase === 'function') {
        await connectDatabase();
        console.log('✅ Base de données connectée');
      }

      // Supabase
      if (typeof setupSupabase === 'function') {
        await setupSupabase();
        console.log('✅ Supabase configuré');
      }

      // Redis
      if (process.env.REDIS_ENABLED === 'true' && typeof connectRedis === 'function') {
        await connectRedis();
        console.log('✅ Redis connecté');
      }

      // Socket.IO
      this.initializeSocketHandlers();
      console.log('✅ Socket.IO initialisé');

      // Jobs Cron
      if (this.isProduction) {
        this.startCronJobs();
        console.log('✅ Jobs Cron démarrés');
      }

      console.log('✅ Tous les services initialisés');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des services:', error);
      // Ne pas bloquer le démarrage si un service échoue
    }
  }

  /**
   * Handlers Socket.IO
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
    // Implémentation des jobs cron dans src/jobs/
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
        console.log('✅ Arrêt terminé.');
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

  /**
   * Getter pour Supabase (pour les tests)
   */
  getSupabase() {
    return this.supabase;
  }
}

// Création et démarrage du serveur
const buySellServer = new BuySellServer();

// Démarrage du serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  buySellServer.start().catch(console.error);
}

module.exports = buySellServer;
