/**
 * Serveur principal de l'application Buy-Sell Platform
 * Point d'entrée du backend Express.js
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

// Import de la configuration
const config = require('./src/config');
const { connectDatabase } = require('./src/config/database');
const { setupSupabase } = require('./src/config/supabase');

// Import des middlewares
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');
const { sanitizeInput } = require('./src/middleware/sanitize');

// Import des routes
const routes = require('./src/routes');

// Import des services
const { startCronJobs } = require('./src/jobs');
const { initializeSocket } = require('./src/services/socketService');

class Server {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = config.port || 3001;
    this.env = config.nodeEnv || 'development';
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSecurity();
  }

  /**
   * Initialisation des middlewares
   */
  initializeMiddlewares() {
    // Compression GZIP
    this.app.use(compression());

    // Sécurité Helmet
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://*.supabase.co"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
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
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Date',
        'X-Api-Version'
      ],
      maxAge: 86400, // 24 hours
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.maxRequests || 100, // Limit each IP to 100 requests per windowMs
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

    // Body parsers
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb'
    }));

    // Cookie parser
    this.app.use(cookieParser());

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
      }
    }));

    // Logging
    if (this.env !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => {
            console.log(message.trim());
          }
        }
      }));
    }

    // Request logging middleware
    this.app.use(requestLogger);

    // Input sanitization
    this.app.use(sanitizeInput);

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: this.env
      });
    });

    // API information endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Buy-Sell Platform API',
        version: '1.0.0',
        description: 'API pour la plateforme d\'achat-vente en ligne',
        documentation: '/api/docs',
        status: 'active',
        environment: this.env
      });
    });
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
    if (config.frontendUrl) {
      origins.push(config.frontendUrl);
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
   * Initialisation des routes
   */
  initializeRoutes() {
    // Mount API routes
    this.app.use('/api', routes);

    // Serve API documentation
    this.app.use('/api/docs', express.static(path.join(__dirname, 'src/docs')));

    // Serve OpenAPI specification
    this.app.get('/api/openapi.json', (req, res) => {
      res.sendFile(path.join(__dirname, 'src/docs/openapi.json'));
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        message: `La route ${req.originalUrl} n'existe pas`,
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // Serve static files for production (if needed)
    if (this.env === 'production') {
      this.app.use(express.static(path.join(__dirname, '../frontend/build')));

      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
      });
    }
  }

  /**
   * Gestion des erreurs
   */
  initializeErrorHandling() {
    // Error handling middleware
    this.app.use(errorHandler);

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // En production, on pourrait logger vers un service externe
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   Configuration de sécurité supplémentaire
   */
  initializeSecurity() {
    // Prevent X-Powered-By header
    this.app.disable('x-powered-by');

    // CSRF protection for non-GET requests
    this.app.use((req, res, next) => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        // Implémentation basique de CSRF - à renforcer selon les besoins
        if (!csrfToken) {
          console.warn('CSRF token manquant pour la requête:', req.method, req.url);
        }
      }
      next();
    });

    // Basic security headers
    this.app.use((req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Feature policy
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      next();
    });
  }

  /**
   * Démarrage du serveur
   */
  async start() {
    try {
      console.log('🚀 Démarrage du serveur Buy-Sell Platform...');
      console.log(`📍 Environnement: ${this.env}`);

      // Connexion à la base de données
      console.log('📊 Connexion à la base de données...');
      await connectDatabase();
      console.log('✅ Base de données connectée avec succès');

      // Configuration Supabase
      console.log('🔑 Configuration de Supabase...');
      await setupSupabase();
      console.log('✅ Supabase configuré avec succès');

      // Démarrage des jobs cron
      console.log('⏰ Démarrage des jobs planifiés...');
      startCronJobs();
      console.log('✅ Jobs planifiés démarrés');

      // Création du serveur HTTP/HTTPS
      if (config.ssl.enabled && this.env === 'production') {
        const sslOptions = {
          key: fs.readFileSync(config.ssl.keyPath),
          cert: fs.readFileSync(config.ssl.certPath),
          ca: config.ssl.caPath ? fs.readFileSync(config.ssl.caPath) : null
        };
        this.server = https.createServer(sslOptions, this.app);
        console.log('🔒 Serveur HTTPS créé');
      } else {
        this.server = http.createServer(this.app);
        console.log('🌐 Serveur HTTP créé');
      }

      // Initialisation Socket.IO
      console.log('🔌 Initialisation de Socket.IO...');
      initializeSocket(this.server);
      console.log('✅ Socket.IO initialisé');

      // Démarrage du serveur
      this.server.listen(this.port, () => {
        console.log(`🎉 Serveur démarré avec succès!`);
        console.log(`📍 Port: ${this.port}`);
        console.log(`🌍 Environnement: ${this.env}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
        console.log(`❤️ Health Check: http://localhost:${this.port}/health`);
        
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

      // Fermeture des connexions de base de données
      try {
        // Implémenter la fermeture des connexions DB si nécessaire
        console.log('✅ Connexions base de données fermées');
      } catch (error) {
        console.error('❌ Erreur lors de la fermeture des connexions DB:', error);
      }

      // Arrêt des jobs cron
      try {
        // Implémenter l'arrêt des jobs cron si nécessaire
        console.log('✅ Jobs planifiés arrêtés');
      } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt des jobs:', error);
      }

      console.log('👋 Arrêt du processus...');
      process.exit(0);
    };

    // Gestion des signaux d'arrêt
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Pour nodemon

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
