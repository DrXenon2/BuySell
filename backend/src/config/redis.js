/**
 * Configuration Redis
 */

const Redis = require('ioredis');
const config = require('../../config');
const logger = require('../utils/logger');

let redisClient = null;

if (config.redis.url || config.redis.host) {
  try {
    const redisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
      lazyConnect: true
    };

    // Utiliser l'URL Redis si disponible
    if (config.redis.url) {
      redisClient = new Redis(config.redis.url, redisOptions);
    } else {
      redisClient = new Redis(redisOptions);
    }

    // Gestion des événements Redis
    redisClient.on('connect', () => {
      logger.info('🔗 Connecté à Redis');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis prêt');
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Erreur Redis:', error);
    });

    redisClient.on('close', () => {
      logger.warn('🔌 Connexion Redis fermée');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Reconnexion à Redis...');
    });

  } catch (error) {
    logger.error('❌ Échec de la connexion Redis:', error);
    redisClient = null;
  }
} else {
  logger.warn('⚠️ Redis non configuré - utilisation du cache mémoire');
}

// Mock pour les environnements de test
if (config.env === 'test' && !redisClient) {
  redisClient = {
    async get() { return null; },
    async set() { return 'OK'; },
    async del() { return 1; },
    async quit() { return 'OK'; },
    async ping() { return 'PONG'; },
    async exists() { return 0; },
    async expire() { return 1; },
    async ttl() { return -1; }
  };
}

module.exports = redisClient;
