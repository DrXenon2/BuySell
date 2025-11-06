const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    try {
      const connectionConfig = {
        connectionString: config.supabase.dbUrl,
        ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // nombre max de clients dans le pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        maxUses: 7500, // fermer et recréer la connexion après 7500 requêtes
      };

      this.pool = new Pool(connectionConfig);

      // Test de connexion
      this.testConnection();

      logger.info('✅ Pool de connexion PostgreSQL initialisé');

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      
      logger.info('✅ Connexion PostgreSQL établie:', {
        time: result.rows[0].current_time,
        version: result.rows[0].version.split(' ').slice(0, 4).join(' ')
      });
    } catch (error) {
      logger.error('❌ Erreur de connexion PostgreSQL:', error);
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log des requêtes lentes (plus de 1 seconde)
      if (duration > 1000) {
        logger.warn('🐌 Requête lente détectée:', {
          duration: `${duration}ms`,
          query: text,
          params: params || []
        });
      }

      return result;
    } catch (error) {
      logger.error('❌ Erreur de requête PostgreSQL:', {
        query: text,
        params: params || [],
        error: error.message
      });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Erreur de transaction:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    
    // Patch pour libérer automatiquement le client après utilisation
    const release = client.release;
    client.release = () => {
      client.release = release;
      return release.call(client);
    };

    return client;
  }

  // Méthodes utilitaires pour les opérations courantes
  async findOne(table, where = {}, columns = ['*']) {
    const whereClause = Object.keys(where).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const queryText = `SELECT ${columns.join(', ')} FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const values = Object.values(where);
    
    const result = await this.query(queryText, values);
    return result.rows[0] || null;
  }

  async findMany(table, where = {}, options = {}) {
    const {
      columns = ['*'],
      limit = 100,
      offset = 0,
      orderBy = 'created_at',
      order = 'DESC'
    } = options;

    const whereClause = Object.keys(where).length > 0 
      ? `WHERE ${Object.keys(where).map((key, index) => `${key} = $${index + 1}`).join(' AND ')}`
      : '';

    const queryText = `
      SELECT ${columns.join(', ')} FROM ${table} 
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${Object.keys(where).length + 1} 
      OFFSET $${Object.keys(where).length + 2}
    `;
    
    const values = [...Object.values(where), limit, offset];
    const result = await this.query(queryText, values);
    return result.rows;
  }

  async insert(table, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = Object.values(data);

    const queryText = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query(queryText, values);
    return result.rows[0];
  }

  async update(table, where, data) {
    const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const whereClause = Object.keys(where).map((key, index) => `${key} = $${index + Object.keys(data).length + 1}`).join(' AND ');
    
    const values = [...Object.values(data), ...Object.values(where)];

    const queryText = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = NOW()
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query(queryText, values);
    return result.rows[0] || null;
  }

  async delete(table, where) {
    const whereClause = Object.keys(where).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const values = Object.values(where);

    const queryText = `
      DELETE FROM ${table} 
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query(queryText, values);
    return result.rows[0] || null;
  }

  // Méthode pour fermer le pool (à appeler à l'arrêt de l'application)
  async close() {
    try {
      await this.pool.end();
      logger.info('✅ Pool de connexion PostgreSQL fermé');
    } catch (error) {
      logger.error('❌ Erreur lors de la fermeture du pool PostgreSQL:', error);
      throw error;
    }
  }
}

// Instance singleton
const database = new Database();

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await database.close();
  process.exit(0);
});

module.exports = database;
