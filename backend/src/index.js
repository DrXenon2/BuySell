require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

const App = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const supabase = require('./config/supabase');

class Server {
  constructor() {
    this.app = new App();
  }

  async initialize() {
    try {
      logger.info(`🚀 Initialisation de ${config.app.name}...`);

      // Initialiser la base de données
      await this.initializeDatabase();

      // Initialiser Supabase
      await this.initializeSupabase();

      logger.info('✅ Tous les services initialisés avec succès');

    } catch (error) {
      logger.error('❌ Échec de l\'initialisation du serveur:', error);
      process.exit(1);
    }
  }

  async initializeDatabase() {
    try {
      // Tester la connexion à la base de données
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      logger.info('✅ Connexion à la base de données établie');
    } catch (error) {
      logger.error('❌ Échec de la connexion à la base de données:', error);
      throw error;
    }
  }

  async initializeSupabase() {
    try {
      // Tester la connexion Supabase avec une requête simple
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      logger.info('✅ Connexion Supabase établie');
    } catch (error) {
      logger.error('❌ Échec de la connexion Supabase:', error);
      throw error;
    }
  }

  startCluster() {
    const numCPUs = os.cpus().length;

    if (cluster.isPrimary) {
      logger.info(`🎯 Processus principal ${process.pid} démarré`);
      logger.info(`🔧 Démarrage de ${numCPUs} workers`);

      // Créer les workers
      for (let i = 0; i < Math.min(numCPUs, 4); i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`⚠️ Worker ${worker.process.pid} arrêté. Redémarrage...`);
        cluster.fork();
      });

      // Arrêt gracieux
      this.setupGracefulShutdown();

    } else {
      this.startWorker();
    }
  }

  async startWorker() {
    try {
      await this.initialize();
      await this.app.start();
      
      logger.info(`👷 Worker ${process.pid} démarré`);
    } catch (error) {
      logger.error(`❌ Échec du démarrage du worker ${process.pid}:`, error);
      process.exit(1);
    }
  }

  async startSingle() {
    try {
      await this.initialize();
      await this.app.start();
    } catch (error) {
      logger.error('❌ Échec du démarrage du serveur:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      logger.info(`\n📞 ${signal} reçu. Début de l'arrêt gracieux...`);

      setTimeout(() => {
        logger.warn('⚠️ Arrêt forcé après 30 secondes');
        process.exit(1);
      }, 30000).unref();

      // Arrêter tous les workers
      for (const id in cluster.workers) {
        cluster.workers[id].process.kill();
      }

      logger.info('✅ Arrêt gracieux terminé');
      process.exit(0);
    };

    // Gérer les différents signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Pour nodemon
  }

  // Démarrer le serveur selon l'environnement
  async start() {
    if (config.env === 'production' && process.env.USE_CLUSTER === 'true') {
      this.startCluster();
    } else {
      await this.startSingle();
    }
  }
}

// Créer et démarrer le serveur
const server = new Server();

// Gérer les exceptions non capturées
process.on('uncaughtException', (error) => {
  logger.error('💥 Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Rejet non géré:', { promise, reason });
  process.exit(1);
});

// Démarrer le serveur
if (require.main === module) {
  server.start().catch(error => {
    logger.error('💥 Erreur critique lors du démarrage:', error);
    process.exit(1);
  });
}

module.exports = server;
