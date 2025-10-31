const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./index');
const logger = require('../utils/logger');

class AppConfig {
  constructor() {
    this.app = express();
    this.init();
  }

  init() {
    // Trust proxy for production
    if (config.env === 'production') {
      this.app.set('trust proxy', 1);
    }

    // Middleware de base
    this.setupBaseMiddleware();
    
    // Sécurité
    this.setupSecurity();
    
    // Performance
    this.setupPerformance();
    
    // Logging
    this.setupLogging();

    logger.info('✅ Configuration Express initialisée');
  }

  setupBaseMiddleware() {
    // Body parser
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

    // CORS
    this.app.use(cors(config.cors));

    // Static files
    this.app.use('/uploads', express.static('uploads', {
      maxAge: config.env === 'production' ? '1d' : '0',
      setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
          res.set('Content-Type', 'application/pdf');
        }
      }
    }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  setupSecurity() {
    // Helmet for security headers
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Ne pas limiter les webhooks et health checks
        return req.path === '/health' || req.path.startsWith('/webhooks');
      }
    });

    this.app.use(limiter);

    // Protection contre les attaques XSS
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Désactivation de l'en-tête X-Powered-By
    this.app.disable('x-powered-by');
  }

  setupPerformance() {
    // Compression Gzip
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Cache control pour les assets statiques
    this.app.use('/assets', express.static('assets', {
      maxAge: config.env === 'production' ? '365d' : '0'
    }));

    // Middleware de timing des requêtes
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        const logLevel = duration > 1000 ? 'warn' : 'info';
        
        logger[logLevel]('📊 Métrique de requête', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  setupLogging() {
    // Format de log personnalisé pour Morgan
    const morganFormat = config.env === 'production' ? 'combined' : 'dev';
    
    const morganMiddleware = morgan(morganFormat, {
      stream: {
        write: (message) => {
          logger.info('🌐 Requête HTTP', { message: message.trim() });
        }
      },
      skip: (req) => {
        // Ignorer les health checks dans les logs
        return req.path === '/health';
      }
    });

    this.app.use(morganMiddleware);

    // Log des erreurs non capturées
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Rejet non géré:', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('❌ Exception non capturée:', error);
      process.exit(1);
    });
  }

  // Méthode pour ajouter des routes
  addRoutes(prefix, router) {
    this.app.use(prefix, router);
    logger.info(`✅ Routes ajoutées: ${prefix}`);
  }

  // Méthode pour ajouter des middlewares
  addMiddleware(middleware) {
    this.app.use(middleware);
  }

  // Méthode pour démarrer le serveur
  start() {
    const port = config.port;
    
    return this.app.listen(port, () => {
      logger.info(`🚀 Serveur démarré sur le port ${port}`, {
        environment: config.env,
        url: `http://localhost:${port}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Getter pour l'app Express
  getApp() {
    return this.app;
  }
}

// Instance singleton
const appConfig = new AppConfig();

module.exports = appConfig;
