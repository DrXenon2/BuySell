const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Configurations
const config = require('./config');
const corsConfig = require('./config/cors');
const helmetConfig = require('./config/helmet');
const rateLimitConfig = require('./config/rateLimit');

// Middlewares
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const loggerMiddleware = require('./middleware/logger');
const authMiddleware = require('./middleware/auth');

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
    if (config.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }

    // Security middlewares
    this.app.use(helmet(helmetConfig));
    this.app.use(cors(corsConfig));

    // Rate limiting
    const limiter = rateLimit(rateLimitConfig);
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', { 
        stream: { write: message => logger.info(message.trim()) } 
      }));
    }
    
    this.app.use(loggerMiddleware);

    // Static files
    this.app.use('/uploads', express.static('uploads'));

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: config.VERSION
      });
    });

    // API info
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'BuySell Platform API',
        version: config.VERSION,
        environment: config.NODE_ENV,
        documentation: '/api/docs',
        status: 'running'
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Serve API documentation in development
    if (config.NODE_ENV === 'development') {
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
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Close server & exit process
      process.exit(1);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception thrown:', error);
      process.exit(1);
    });
  }

  start() {
    const PORT = config.PORT || 5000;
    
    return new Promise((resolve, reject) => {
      const server = this.app.listen(PORT, () => {
        logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
        logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
        
        resolve(server);
      });

      server.on('error', (error) => {
        logger.error('Failed to start server:', error);
        reject(error);
      });
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
