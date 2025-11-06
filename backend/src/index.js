/**
 * Point d'entrée principal de l'application BuySell Platform
 * Gère le démarrage en mode cluster ou single process
 * Initialise tous les services et gère l'arrêt gracieux
 */

require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Charger la configuration
const config = require('../config');
const logger = require('./utils/logger');

class Server {
  constructor() {
    this.App = require('./app');
    this.isClusterMode = this.shouldUseCluster();
    this.workers = [];
    this.server = null;
  }

  /**
   * Détermine si le mode cluster doit être utilisé
   */
  shouldUseCluster() {
    if (config.env !== 'production') return false;
    if (process.env.USE_CLUSTER === 'false') return false;
    return process.env.USE_CLUSTER === 'true' || config.server.cluster.enabled;
  }

  /**
   * Initialise tous les services nécessaires
   */
  async initialize() {
    try {
      logger.info('='.repeat(60));
      logger.info(`🚀 Initialisation de ${config.app.name} v${config.app.version}`);
      logger.info(`📍 Environnement: ${config.env}`);
      logger.info(`🔧 Mode: ${this.isClusterMode ? 'Cluster' : 'Single Process'}`);
      logger.info(`📊 PID: ${process.pid}`);
      logger.info('='.repeat(60));

      // Validation de l'environnement
      this.validateEnvironment();

      // Initialiser les services critiques
      await this.initializeCriticalServices();

      // Initialiser les services optionnels
      await this.initializeOptionalServices();

      // Vérifier l'état du système
      await this.performSystemChecks();

      logger.info('✅ Tous les services initialisés avec succès');
      logger.info('='.repeat(60));

    } catch (error) {
      logger.error('❌ Échec critique lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Validation des variables d'environnement
   */
  validateEnvironment() {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Variables d'environnement manquantes: ${missingEnvVars.join(', ')}. ` +
        'Veuillez vérifier votre fichier .env'
      );
    }

    logger.info('✅ Variables d\'environnement validées');
  }

  /**
   * Initialise les services critiques
   */
  async initializeCriticalServices() {
    logger.info('🔧 Initialisation des services critiques...');

    // 1. Base de données Supabase
    await this.initializeDatabase();

    // 2. Système d'authentification
    await this.initializeAuth();

    // 3. Stockage fichiers
    await this.initializeStorage();

    logger.info('✅ Services critiques initialisés');
  }

  /**
   * Initialise les services optionnels
   */
  async initializeOptionalServices() {
    logger.info('🔧 Initialisation des services optionnels...');

    const services = [
      { name: 'Stripe', method: this.initializeStripe.bind(this) },
      { name: 'Email', method: this.initializeEmail.bind(this) },
      { name: 'Cache', method: this.initializeCache.bind(this) },
      { name: 'Documentation', method: this.initializeDocumentation.bind(this) }
    ];

    for (const service of services) {
      try {
        await service.method();
        logger.debug(`✅ Service ${service.name} initialisé`);
      } catch (error) {
        logger.warn(`⚠️ Service ${service.name} non disponible: ${error.message}`);
      }
    }

    logger.info('✅ Services optionnels initialisés');
  }

  /**
   * Vérifications système
   */
  async performSystemChecks() {
    logger.info('🔍 Vérifications système...');

    const checks = [
      { name: 'Mémoire disponible', check: this.checkMemory.bind(this) },
      { name: 'Variables d\'environnement', check: this.checkEnvironment.bind(this) },
      { name: 'Permissions fichiers', check: this.checkFilePermissions.bind(this) },
      { name: 'Dossiers requis', check: this.checkRequiredFolders.bind(this) }
    ];

    for (const check of checks) {
      try {
        await check.check();
        logger.debug(`✅ ${check.name} - OK`);
      } catch (error) {
        logger.warn(`⚠️ ${check.name} - Attention: ${error.message}`);
      }
    }

    logger.info('✅ Vérifications système terminées');
  }

  /**
   * Initialisation de la base de données
   */
  async initializeDatabase() {
    try {
      logger.info('🗄️  Connexion à la base de données Supabase...');

      const { supabase } = require('./config/supabase');

      // Test de connexion basique
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        // Si la table profiles n'existe pas encore (premier démarrage)
        if (error.code === 'PGRST116') {
          logger.warn('⚠️ Table profiles non trouvée - premières migrations nécessaires');
        } else {
          throw new Error(`Erreur de connexion: ${error.message}`);
        }
      } else {
        logger.info('✅ Base de données connectée avec succès');
      }

    } catch (error) {
      logger.error('❌ Échec de la connexion à la base de données:', error);
      throw error;
    }
  }

  /**
   * Initialisation du système d'authentification
   */
  async initializeAuth() {
    try {
      logger.info('🔐 Vérification du système d\'authentification...');

      const { supabase } = require('./config/supabase');
      const { data: session, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(`Erreur d'authentification: ${error.message}`);
      }

      logger.info('✅ Système d\'authentification opérationnel');

    } catch (error) {
      logger.error('❌ Échec de l\'initialisation de l\'authentification:', error);
      throw error;
    }
  }

  /**
   * Initialisation du stockage
   */
  async initializeStorage() {
    try {
      logger.info('📦 Vérification du stockage...');

      const { supabase } = require('./config/supabase');
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        throw new Error(`Erreur de stockage: ${error.message}`);
      }

      // Vérifier que le bucket 'uploads' existe
      const uploadsBucket = buckets.find(bucket => bucket.name === 'uploads');
      if (!uploadsBucket) {
        logger.warn('⚠️ Bucket "uploads" non trouvé - création nécessaire');
      } else {
        logger.info('✅ Service de stockage opérationnel');
      }

    } catch (error) {
      logger.error('❌ Échec de l\'initialisation du stockage:', error);
      throw error;
    }
  }

  /**
   * Initialisation de Stripe
   */
  async initializeStripe() {
    if (!config.stripe.secretKey) {
      throw new Error('Clé Stripe non configurée');
    }

    try {
      const stripe = require('stripe')(config.stripe.secretKey);
      await stripe.balance.retrieve();
      logger.info('✅ Service Stripe opérationnel');
    } catch (error) {
      throw new Error(`Erreur Stripe: ${error.message}`);
    }
  }

  /**
   * Initialisation du service email
   */
  async initializeEmail() {
    if (!config.email.resend.apiKey) {
      throw new Error('Clé Resend non configurée');
    }
    logger.info('✅ Service email configuré');
  }

  /**
   * Initialisation du cache
   */
  async initializeCache() {
    if (config.redis.url || config.redis.host) {
      try {
        const redis = require('./config/redis');
        await redis.ping();
        logger.info('✅ Cache Redis opérationnel');
      } catch (error) {
        throw new Error(`Erreur Redis: ${error.message}`);
      }
    } else {
      logger.info('✅ Cache mémoire activé');
    }
  }

  /**
   * Initialisation de la documentation
   */
  async initializeDocumentation() {
    if (!config.docs.enabled) {
      throw new Error('Documentation désactivée');
    }

    try {
      const { checkDocumentationHealth } = require('./docs/healthcheck');
      const result = checkDocumentationHealth();
      
      if (result.healthy) {
        logger.info(`✅ Documentation Swagger prête (${result.stats.endpoints} endpoints)`);
      } else {
        logger.warn('⚠️ Documentation avec problèmes:', result.issues);
      }
    } catch (error) {
      throw new Error(`Erreur documentation: ${error.message}`);
    }
  }

  /**
   * Vérification mémoire
   */
  async checkMemory() {
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    if (memoryUsage > 90) {
      throw new Error(`Mémoire utilisée à ${memoryUsage.toFixed(1)}%`);
    }

    logger.debug(`📊 Mémoire: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB libre / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB total`);
  }

  /**
   * Vérification environnement
   */
  async checkEnvironment() {
    // Déjà fait dans validateEnvironment()
    return true;
  }

  /**
   * Vérification permissions fichiers
   */
  async checkFilePermissions() {
    const uploadDir = config.upload.uploadDir;
    const logDir = config.logging.dir;

    const directories = [uploadDir, logDir];

    for (const dir of directories) {
      try {
        require('fs').accessSync(dir, require('fs').constants.W_OK);
      } catch (error) {
        // Créer le dossier s'il n'existe pas
        try {
          require('fs').mkdirSync(dir, { recursive: true });
          logger.debug(`📁 Dossier créé: ${dir}`);
        } catch (mkdirError) {
          throw new Error(`Droits d'écriture manquants pour ${dir}: ${mkdirError.message}`);
        }
      }
    }
  }

  /**
   * Vérification des dossiers requis
   */
  async checkRequiredFolders() {
    const folders = [
      config.upload.uploadDir,
      config.upload.tempDir,
      config.logging.dir,
      path.join(__dirname, '..', 'exports')
    ];

    for (const folder of folders) {
      try {
        require('fs').mkdirSync(folder, { recursive: true });
        logger.debug(`📁 Dossier vérifié: ${folder}`);
      } catch (error) {
        throw new Error(`Impossible de créer le dossier ${folder}: ${error.message}`);
      }
    }
  }

  /**
   * Démarrage en mode cluster
   */
  startCluster() {
    const numCPUs = os.cpus().length;
    const numWorkers = Math.min(numCPUs, config.server.cluster.maxWorkers);

    if (cluster.isPrimary) {
      logger.info(`🎯 Processus principal ${process.pid} démarré`);
      logger.info(`🔧 Démarrage de ${numWorkers} workers sur ${numCPUs} CPUs disponibles`);

      // Créer les workers
      for (let i = 0; i < numWorkers; i++) {
        this.createWorker(i);
      }

      // Gestion des événements cluster
      this.setupClusterEvents();

      // Arrêt gracieux
      this.setupGracefulShutdown();

      logger.info(`👑 Cluster opérationnel avec ${numWorkers} workers`);

    } else {
      this.startWorker();
    }
  }

  /**
   * Crée un worker
   */
  createWorker(workerId) {
    const worker = cluster.fork({
      WORKER_ID: workerId,
      WORKER_NAME: `worker-${workerId}`,
      NODE_ENV: config.env
    });

    this.workers.push(worker);

    worker.on('message', (message) => {
      logger.debug(`📨 Message de worker ${worker.id}:`, message);
    });
  }

  /**
   * Configuration des événements cluster
   */
  setupClusterEvents() {
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`⚰️  Worker ${worker.process.pid} arrêté (${signal || code})`);

      // Retirer le worker de la liste
      this.workers = this.workers.filter(w => w.id !== worker.id);

      // Redémarrer le worker après un délai
      setTimeout(() => {
        logger.info(`🔄 Redémarrage du worker ${worker.process.pid}...`);
        this.createWorker(this.workers.length);
      }, 1000);
    });

    cluster.on('online', (worker) => {
      logger.info(`👷 Worker ${worker.process.pid} démarré`);
    });

    cluster.on('listening', (worker, address) => {
      logger.info(`🎧 Worker ${worker.process.pid} écoute sur le port ${address.port}`);
    });
  }

  /**
   * Démarrage d'un worker
   */
  async startWorker() {
    try {
      const workerId = process.env.WORKER_ID || '0';
      const workerName = process.env.WORKER_NAME || `worker-${workerId}`;

      process.title = `${config.app.name} - ${workerName}`;

      await this.initialize();
      
      // Créer une nouvelle instance d'application pour chaque worker
      const appInstance = new this.App();
      this.server = await appInstance.start();

      logger.info(`🎯 ${workerName} (${process.pid}) prêt et opérationnel`);

      // Configuration spécifique au worker
      this.setupWorkerShutdown(this.server);

    } catch (error) {
      logger.error(`❌ Échec du démarrage du worker ${process.pid}:`, error);
      process.exit(1);
    }
  }

  /**
   * Démarrage en mode single process
   */
  async startSingle() {
    try {
      process.title = `${config.app.name} - Single Process`;

      await this.initialize();
      
      // Créer l'instance d'application
      const appInstance = new this.App();
      this.server = await appInstance.start();

      logger.info('🎯 Serveur single process prêt et opérationnel');

      // Arrêt gracieux
      this.setupGracefulShutdown(this.server);

      return this.server;

    } catch (error) {
      logger.error('❌ Échec du démarrage du serveur single process:', error);
      throw error;
    }
  }

  /**
   * Configuration de l'arrêt gracieux
   */
  setupGracefulShutdown(server = null) {
    const gracefulShutdown = async (signal) => {
      logger.info(`\n📞 Signal ${signal} reçu. Début de l'arrêt gracieux...`);

      // 1. Arrêter d'accepter de nouvelles connexions
      if (server) {
        server.close(() => {
          logger.info('✅ Serveur HTTP fermé');
        });
      }

      // 2. Fermer les connexions de base de données
      await this.closeDatabaseConnections();

      // 3. Attendre que les requêtes en cours se terminent
      setTimeout(() => {
        logger.info('🎉 Arrêt gracieux terminé');
        process.exit(0);
      }, 5000);

      // Forcer l'arrêt après 30 secondes
      setTimeout(() => {
        logger.error('⏰ Arrêt forcé après 30 secondes');
        process.exit(1);
      }, 30000).unref();
    };

    // Signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon
  }

  /**
   * Configuration de l'arrêt pour les workers
   */
  setupWorkerShutdown(server) {
    process.on('SIGTERM', () => {
      logger.info(`👷 Worker ${process.pid} reçoit SIGTERM`);
      server.close(() => {
        process.exit(0);
      });
    });
  }

  /**
   * Fermeture des connexions base de données
   */
  async closeDatabaseConnections() {
    try {
      logger.info('🔌 Fermeture des connexions base de données...');
      
      // Fermer Redis si configuré
      if (config.redis.url || config.redis.host) {
        const redis = require('./config/redis');
        if (redis && typeof redis.quit === 'function') {
          await redis.quit();
          logger.info('✅ Connexion Redis fermée');
        }
      }
      
      logger.info('✅ Toutes les connexions fermées');
    } catch (error) {
      logger.error('❌ Erreur lors de la fermeture des connexions:', error);
    }
  }

  /**
   * Point d'entrée principal
   */
  async start() {
    try {
      if (this.isClusterMode) {
        this.startCluster();
      } else {
        await this.startSingle();
      }
    } catch (error) {
      logger.error('💥 Erreur critique lors du démarrage:', error);
      throw error;
    }
  }

  /**
   * Fermeture propre de l'application
   */
  async close() {
    logger.info('🔚 Fermeture de l\'application...');
    
    if (this.server) {
      this.server.close();
    }
    
    await this.closeDatabaseConnections();
    
    logger.info('✅ Application fermée');
  }
}

// =============================================================================
// DÉMARRAGE DE L'APPLICATION
// =============================================================================

// Créer l'instance du serveur
const server = new Server();

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  logger.error('💥 EXCEPTION NON CAPTURÉE:', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  
  // En production, on laisse le cluster redémarrer le processus
  if (config.env === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 REJET NON GÉRÉ:', {
    promise: promise.toString(),
    reason: reason?.message || reason,
    pid: process.pid
  });
  
  // En production, on laisse le cluster redémarrer le processus
  if (config.env === 'production') {
    process.exit(1);
  }
});

// Démarrer le serveur seulement si c'est le script principal
if (require.main === module) {
  logger.info('🎬 Démarrage de l\'application BuySell Platform...');
  
  server.start().catch(error => {
    logger.error('💥 ERREUR CRITIQUE - Arrêt de l\'application:', error);
    process.exit(1);
  });
}

// Export pour les tests
module.exports = {
  Server,
  serverInstance: server,
  getApp: () => {
    const appInstance = new server.App();
    return appInstance.getApp();
  }
};
