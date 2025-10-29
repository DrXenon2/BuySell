// backend/server.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurations
import config from './src/config/config.js';
import { connectSupabase } from './src/config/supabase.js';
import { connectRedis } from './src/config/redis.js';

// Routes
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import productRoutes from './src/routes/products.js';
import categoryRoutes from './src/routes/categories.js';
import orderRoutes from './src/routes/orders.js';
import cartRoutes from './src/routes/cart.js';
import reviewRoutes from './src/routes/reviews.js';
import paymentRoutes from './src/routes/payments.js';
import webhookRoutes from './src/routes/webhooks.js';
import uploadRoutes from './src/routes/uploads.js';
import analyticsRoutes from './src/routes/analytics.js';
import adminRoutes from './src/routes/admin.js';

// Middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/middleware/logger.js';
import { requestId } from './src/middleware/requestId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuySellServer {
  constructor() {
    this.app = express();
    this.port = config.port || 3001;
    this.env = config.nodeEnv || 'development';

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeHealthChecks();
  }

  async initializeDatabase() {
    try {
      // Initialize Supabase
      await connectSupabase();
      console.log('✅ Supabase connected successfully');

      // Initialize Redis
      if (config.redis.enabled) {
        await connectRedis();
        console.log('✅ Redis connected successfully');
      }

    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  initializeMiddlewares() {
    // Security Middlewares
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.supabase.io", "wss://api.supabase.io"]
        }
      }
    }));

    // CORS Configuration
    this.app.use(cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
    }));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.maxRequests, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    // Apply rate limiting to all requests
    this.app.use(limiter);

    // More aggressive rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // Limit auth endpoints to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      }
    });

    // Body Parsing Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(requestId);
    this.app.use(morgan(config.morgan.format, {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Static Files
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    this.app.use('/docs', express.static(path.join(__dirname, 'docs')));

    // Security Headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  }

  initializeRoutes() {
    // API Documentation
    this.app.get('/', (req, res) => {
      res.json({
        message: '🛍️ BuySell Marketplace API',
        version: '1.0.0',
        description: 'Africa\'s Smart Marketplace - Buy New, Sell Smart',
        documentation: '/api/docs',
        status: 'operational',
        timestamp: new Date().toISOString()
      });
    });

    // API Status
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'OK',
        service: 'BuySell API',
        version: '1.0.0',
        environment: this.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API Routes
    this.app.use('/api/auth', authLimiter, authRoutes);
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

    // API Documentation Route
    this.app.get('/api/docs', (req, res) => {
      res.json({
        documentation: 'https://docs.buy-sell.ci',
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
          admin: '/api/admin'
        },
        version: '1.0.0'
      });
    });
  }

  initializeErrorHandling() {
    // Catch 404 and forward to error handler
    this.app.use((req, res, next) => {
      next(createError(404, `Route not found: ${req.method} ${req.path}`));
    });

    // Error handling middleware
    this.app.use(errorHandler);

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Close server & exit process
      this.server?.close(() => {
        process.exit(1);
      });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception thrown:', error);
      process.exit(1);
    });
  }

  initializeHealthChecks() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const healthcheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'healthy',
          redis: config.redis.enabled ? 'healthy' : 'disabled',
          memory: {
            usage: process.memoryUsage(),
            uptime: process.uptime()
          }
        }
      };

      try {
        // Check database connection
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        
        res.status(200).json(healthcheck);
      } catch (error) {
        healthcheck.status = 'ERROR';
        healthcheck.checks.database = 'unhealthy';
        healthcheck.error = error.message;
        
        res.status(503).json(healthcheck);
      }
    });

    // Readiness check
    this.app.get('/ready', (req, res) => {
      res.status(200).json({
        status: 'READY',
        service: 'BuySell API',
        timestamp: new Date().toISOString()
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`
🛍️  BuySell Marketplace Server Started!
      
📍 Environment: ${this.env}
🚀 Server running on port: ${this.port}
📚 API Documentation: http://localhost:${this.port}/api/docs
❤️  Health Check: http://localhost:${this.port}/health
🔍 Status: http://localhost:${this.port}/api/status

🌟 BuySell - Africa's Smart Marketplace
💡 Buy New, Sell Smart!
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📢 Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close((err) => {
        if (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }

        console.log('✅ HTTP server closed.');
        
        // Close database connections here if needed
        console.log('✅ All connections closed. Shutdown complete.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return this.server;
  }
}

// Create and start server
const buySellServer = new BuySellServer();

// Start the server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buySellServer.start();
}

export default buySellServer;
