require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

const App = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const supabase = require('./config/supabase');
const database = require('./config/database');

class Server {
  constructor() {
    this.app = new App();
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing BuySell Platform Server...');

      // Validate required environment variables
      this.validateEnvironment();

      // Initialize database connection
      await this.initializeDatabase();

      // Initialize Supabase
      await this.initializeSupabase();

      logger.info('✅ All services initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize server:', error);
      process.exit(1);
    }
  }

  validateEnvironment() {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET',
      'CLIENT_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info('✅ Environment variables validated');
  }

  async initializeDatabase() {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      logger.info('✅ Database connection established');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async initializeSupabase() {
    try {
      // Test Supabase connection with a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      logger.info('✅ Supabase connection established');
    } catch (error) {
      logger.error('❌ Supabase connection failed:', error);
      throw error;
    }
  }

  startCluster() {
    const numCPUs = os.cpus().length;

    if (cluster.isPrimary) {
      logger.info(`🎯 Master ${process.pid} is running`);
      logger.info(`🔧 Starting ${numCPUs} workers`);

      // Fork workers
      for (let i = 0; i < Math.min(numCPUs, 4); i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`⚠️ Worker ${worker.process.pid} died. Forking new worker...`);
        cluster.fork();
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } else {
      this.startWorker();
    }
  }

  async startWorker() {
    try {
      await this.initialize();
      await this.app.start();
      
      logger.info(`👷 Worker ${process.pid} started`);
    } catch (error) {
      logger.error(`❌ Worker ${process.pid} failed to start:`, error);
      process.exit(1);
    }
  }

  async startSingle() {
    try {
      await this.initialize();
      await this.app.start();
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      logger.info(`\n📞 ${signal} received. Starting graceful shutdown...`);

      setTimeout(() => {
        logger.warn('⚠️ Forcing shutdown after 30 seconds');
        process.exit(1);
      }, 30000).unref();

      // Close all workers
      for (const id in cluster.workers) {
        cluster.workers[id].process.kill();
      }

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
  }

  // Start server based on environment
  async start() {
    if (config.NODE_ENV === 'production' && config.USE_CLUSTER === 'true') {
      this.startCluster();
    } else {
      await this.startSingle();
    }
  }
}

// Create and start server
const server = new Server();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  server.start();
}

module.exports = server;
