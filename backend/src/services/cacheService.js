const NodeCache = require('node-cache');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.memoryCache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: 600,
      useClones: false
    });

    this.redisClient = null;
    this.useRedis = config.redis.url && config.cache.enabled;

    if (this.useRedis) {
      this.initRedis();
    }

    logger.info(`Service cache initialisé (${this.useRedis ? 'Redis' : 'Memory'})`);
  }

  /**
   * Initialiser Redis
   */
  initRedis() {
    try {
      this.redisClient = new Redis(config.redis.url, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.redisClient.on('connect', () => {
        logger.info('✅ Connecté à Redis');
      });

      this.redisClient.on('error', (error) => {
        logger.error('❌ Erreur Redis:', error);
        this.useRedis = false;
      });

    } catch (error) {
      logger.error('❌ Échec connexion Redis, utilisation du cache mémoire:', error);
      this.useRedis = false;
    }
  }

  /**
   * Obtenir une valeur du cache
   */
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }

      return this.memoryCache.get(key);

    } catch (error) {
      logger.error('Erreur service cache get:', error);
      return this.memoryCache.get(key);
    }
  }

  /**
   * Définir une valeur dans le cache
   */
  async set(key, value, ttl = config.cache.ttl) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (this.useRedis && this.redisClient) {
        if (ttl) {
          await this.redisClient.setex(key, ttl, stringValue);
        } else {
          await this.redisClient.set(key, stringValue);
        }
      }

      this.memoryCache.set(key, value, ttl);

    } catch (error) {
      logger.error('Erreur service cache set:', error);
      this.memoryCache.set(key, value, ttl);
    }
  }

  /**
   * Supprimer une clé du cache
   */
  async del(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      }

      this.memoryCache.del(key);

    } catch (error) {
      logger.error('Erreur service cache del:', error);
      this.memoryCache.del(key);
    }
  }

  /**
   * Supprimer par pattern
   */
  async delPattern(pattern) {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }

      const memoryKeys = this.memoryCache.keys().filter(key => key.includes(pattern));
      this.memoryCache.del(memoryKeys);

    } catch (error) {
      logger.error('Erreur service cache delPattern:', error);
    }
  }

  /**
   * Incrémenter une valeur
   */
  async incr(key, value = 1) {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.incrby(key, value);
      }

      const current = this.memoryCache.get(key) || 0;
      const newValue = current + value;
      this.memoryCache.set(key, newValue);
      return newValue;

    } catch (error) {
      logger.error('Erreur service cache incr:', error);
      const current = this.memoryCache.get(key) || 0;
      const newValue = current + value;
      this.memoryCache.set(key, newValue);
      return newValue;
    }
  }

  /**
   * Décrémenter une valeur
   */
  async decr(key, value = 1) {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.decrby(key, value);
      }

      const current = this.memoryCache.get(key) || 0;
      const newValue = Math.max(0, current - value);
      this.memoryCache.set(key, newValue);
      return newValue;

    } catch (error) {
      logger.error('Erreur service cache decr:', error);
      const current = this.memoryCache.get(key) || 0;
      const newValue = Math.max(0, current - value);
      this.memoryCache.set(key, newValue);
      return newValue;
    }
  }

  /**
   * Obtenir plusieurs clés
   */
  async mget(keys) {
    try {
      if (this.useRedis && this.redisClient) {
        const values = await this.redisClient.mget(keys);
        return values.map(value => {
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        });
      }

      return keys.map(key => this.memoryCache.get(key));

    } catch (error) {
      logger.error('Erreur service cache mget:', error);
      return keys.map(key => this.memoryCache.get(key));
    }
  }

  /**
   * Définir plusieurs valeurs
   */
  async mset(keyValuePairs, ttl = config.cache.ttl) {
    try {
      if (this.useRedis && this.redisClient) {
        const pipeline = this.redisClient.pipeline();
        
        keyValuePairs.forEach(([key, value]) => {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          if (ttl) {
            pipeline.setex(key, ttl, stringValue);
          } else {
            pipeline.set(key, stringValue);
          }
        });

        await pipeline.exec();
      }

      keyValuePairs.forEach(([key, value]) => {
        this.memoryCache.set(key, value, ttl);
      });

    } catch (error) {
      logger.error('Erreur service cache mset:', error);
      keyValuePairs.forEach(([key, value]) => {
        this.memoryCache.set(key, value, ttl);
      });
    }
  }

  /**
   * Vérifier si une clé existe
   */
  async exists(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.exists(key);
        return result === 1;
      }

      return this.memoryCache.has(key);

    } catch (error) {
      logger.error('Erreur service cache exists:', error);
      return this.memoryCache.has(key);
    }
  }

  /**
   * Obtenir les clés par pattern
   */
  async keys(pattern = '*') {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.keys(pattern);
      }

      return this.memoryCache.keys().filter(key => key.includes(pattern));

    } catch (error) {
      logger.error('Erreur service cache keys:', error);
      return this.memoryCache.keys().filter(key => key.includes(pattern));
    }
  }

  /**
   * Vider le cache
   */
  async flush() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
      }

      this.memoryCache.flushAll();
      logger.info('Cache vidé');

    } catch (error) {
      logger.error('Erreur service cache flush:', error);
      this.memoryCache.flushAll();
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats() {
    try {
      const memoryStats = this.memoryCache.getStats();
      let redisStats = {};

      if (this.useRedis && this.redisClient) {
        const info = await this.redisClient.info();
        redisStats = this.parseRedisInfo(info);
      }

      return {
        memory: memoryStats,
        redis: redisStats,
        using_redis: this.useRedis
      };

    } catch (error) {
      logger.error('Erreur service cache getStats:', error);
      return {
        memory: this.memoryCache.getStats(),
        redis: {},
        using_redis: false
      };
    }
  }

  /**
   * Parser les infos Redis
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};

    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    return stats;
  }

  /**
   * Cache avec fallback
   */
  async withCache(key, fetchFunction, ttl = config.cache.ttl) {
    try {
      // Essayer de récupérer du cache
      const cached = await this.get(key);
      if (cached !== undefined && cached !== null) {
        logger.debug('Cache hit:', { key });
        return cached;
      }

      // Si pas en cache, exécuter la fonction
      logger.debug('Cache miss:', { key });
      const result = await fetchFunction();

      // Mettre en cache le résultat
      if (result !== undefined && result !== null) {
        await this.set(key, result, ttl);
      }

      return result;

    } catch (error) {
      logger.error('Erreur service cache withCache:', error);
      // En cas d'erreur, exécuter quand même la fonction
      return await fetchFunction();
    }
  }
}

module.exports = new CacheService();
