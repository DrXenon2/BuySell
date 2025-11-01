const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Configuration
const config = require('./config');

// Middlewares
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const loggerMiddleware = require('./middleware/logger');

// Routes
const routes = require('./routes');

// Services
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Trust proxy for production
    if (config.env === 'production') {
      this.app.set('trust proxy', 1);
    }

    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors(config.cors));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
        message: 'Limite de débit dépassée'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ 
      limit: config.upload.maxFileSize 
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: config.upload.maxFileSize 
    }));

    // Logging
    if (config.env !== 'test') {
      const morganFormat = config.env === 'production' ? 'combined' : 'dev';
      this.app.use(morgan(morganFormat, { 
        stream: { write: message => logger.info(message.trim()) } 
      }));
    }
    
    this.app.use(loggerMiddleware);

    // Static files
    this.app.use('/uploads', express.static(config.upload.uploadDir));

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: '1.0.0'
      });
    });

    // API info
    this.app.get('/api', (req, res) => {
      res.json({
        name: config.app.name,
        version: '1.0.0',
        environment: config.env,
        documentation: '/api/docs',
        status: 'running'
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Serve API documentation in development
    if (config.env === 'development') {
      this.app.use('/api/docs', express.static('src/docs'));
    }
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Rejet non géré:', { promise, reason });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Exception non capturée:', error);
      process.exit(1);
    });
  }

  start() {
    const PORT = config.port;
    const HOST = config.env === 'production' ? config.app.backendUrl : 'localhost';
    
    return new Promise((resolve, reject) => {
      const server = this.app.listen(PORT, () => {
        logger.info(`🚀 Serveur ${config.app.name} démarré`);
        logger.info(`📍 Environnement: ${config.env}`);
        logger.info(`🌐 URL: http://${HOST}:${PORT}`);
        logger.info(`📚 API: http://${HOST}:${PORT}/api`);
        logger.info(`❤️  Health: http://${HOST}:${PORT}/health`);
        
        resolve(server);
      });

      server.on('error', (error) => {
        logger.error('Échec du démarrage du serveur:', error);
        reject(error);
      });
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
