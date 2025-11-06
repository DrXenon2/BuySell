const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey);
    this.adminClient = config.supabase.serviceRoleKey 
      ? createClient(config.supabase.url, config.supabase.serviceRoleKey)
      : null;
  }

  /**
   * Vérifier la connexion à Supabase
   */
  async checkConnection() {
    try {
      const { data, error } = await this.client.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      logger.info('✅ Connexion Supabase établie');
      return {
        connected: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Erreur connexion Supabase:', error);
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Exécuter une requête SQL brute (via RPC)
   */
  async executeSql(query, params = []) {
    try {
      // Note: Supabase limite l'exécution SQL directe pour des raisons de sécurité
      // Cette méthode utilise les fonctions RPC pré-définies
      const { data, error } = await this.client.rpc('execute_custom_query', {
        query_text: query,
        query_params: params
      });

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur service supabase executeSql:', error);
      throw new Error(`Erreur exécution SQL: ${error.message}`);
    }
  }

  /**
   * Sauvegarder la base de données
   */
  async backupDatabase() {
    try {
      if (!this.adminClient) {
        throw new Error('Client admin non configuré pour la sauvegarde');
      }

      // Cette fonctionnalité nécessite des droits admin
      const { data, error } = await this.adminClient.rpc('create_database_backup');

      if (error) throw error;

      logger.info('Sauvegarde base de données créée');
      return data;

    } catch (error) {
      logger.error('Erreur service supabase backupDatabase:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de la base de données
   */
  async getDatabaseStats() {
    try {
      const { data, error } = await this.client.rpc('get_database_statistics');

      if (error) throw error;

      return {
        ...data,
        timestamp: new Date().toISOString(),
        supabase_url: config.supabase.url
      };

    } catch (error) {
      logger.error('Erreur service supabase getDatabaseStats:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les données anciennes
   */
  async cleanupOldData() {
    try {
      const tasks = [
        this.cleanupOldSessions(),
        this.cleanupOldAuditLogs(),
        this.cleanupOldNotifications(),
        this.cleanupOldAnalytics()
      ];

      const results = await Promise.allSettled(tasks);

      const summary = results.map((result, index) => ({
        task: tasks[index].name,
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : result.reason
      }));

      logger.info('Nettoyage données anciennes terminé', { summary });

      return summary;

    } catch (error) {
      logger.error('Erreur service supabase cleanupOldData:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les sessions anciennes
   */
  async cleanupOldSessions(days = 30) {
    try {
      const { data, error } = await this.client.rpc('cleanup_old_sessions', {
        older_than_days: days
      });

      if (error) throw error;

      logger.info(`Sessions nettoyées: plus anciennes que ${days} jours`, { cleaned: data });
      return { cleaned: data };

    } catch (error) {
      logger.error('Erreur nettoyage sessions:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les logs d'audit anciens
   */
  async cleanupOldAuditLogs(days = 90) {
    try {
      const { data, error } = await this.client.rpc('cleanup_old_audit_logs', {
        older_than_days: days
      });

      if (error) throw error;

      logger.info(`Logs d'audit nettoyés: plus anciens que ${days} jours`, { cleaned: data });
      return { cleaned: data };

    } catch (error) {
      logger.error('Erreur nettoyage logs audit:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les notifications anciennes
   */
  async cleanupOldNotifications(days = 30) {
    try {
      const { data, error } = await this.client.rpc('cleanup_old_notifications', {
        older_than_days: days
      });

      if (error) throw error;

      logger.info(`Notifications nettoyées: plus anciennes que ${days} jours`, { cleaned: data });
      return { cleaned: data };

    } catch (error) {
      logger.error('Erreur nettoyage notifications:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les données analytics anciennes
   */
  async cleanupOldAnalytics(days = 365) {
    try {
      const { data, error } = await this.client.rpc('cleanup_old_analytics', {
        older_than_days: days
      });

      if (error) throw error;

      logger.info(`Données analytics nettoyées: plus anciennes que ${days} jours`, { cleaned: data });
      return { cleaned: data };

    } catch (error) {
      logger.error('Erreur nettoyage analytics:', error);
      throw error;
    }
  }

  /**
   * Réindexer la base de données
   */
  async reindexDatabase() {
    try {
      const { data, error } = await this.client.rpc('reindex_database');

      if (error) throw error;

      logger.info('Base de données réindexée');
      return data;

    } catch (error) {
      logger.error('Erreur service supabase reindexDatabase:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'intégrité des données
   */
  async checkDataIntegrity() {
    try {
      const checks = [
        this.checkOrphanedRecords(),
        this.checkDataConsistency(),
        this.checkForeignKeyConstraints()
      ];

      const results = await Promise.allSettled(checks);

      const integrityReport = results.map((result, index) => ({
        check: checks[index].name,
        status: result.status,
        result: result.status === 'fulfilled' ? result.value : { error: result.reason.message }
      }));

      const allPassed = integrityReport.every(item => item.status === 'fulfilled' && item.result.valid);

      return {
        valid: allPassed,
        checks: integrityReport,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur service supabase checkDataIntegrity:', error);
      throw error;
    }
  }

  /**
   * Vérifier les enregistrements orphelins
   */
  async checkOrphanedRecords() {
    try {
      const { data, error } = await this.client.rpc('check_orphaned_records');

      if (error) throw error;

      return {
        valid: data.orphaned_count === 0,
        orphaned_count: data.orphaned_count,
        details: data.details
      };

    } catch (error) {
      logger.error('Erreur vérification enregistrements orphelins:', error);
      throw error;
    }
  }

  /**
   * Vérifier la cohérence des données
   */
  async checkDataConsistency() {
    try {
      const { data, error } = await this.client.rpc('check_data_consistency');

      if (error) throw error;

      return {
        valid: data.is_consistent,
        inconsistencies: data.inconsistencies,
        details: data.details
      };

    } catch (error) {
      logger.error('Erreur vérification cohérence données:', error);
      throw error;
    }
  }

  /**
   * Vérifier les contraintes de clés étrangères
   */
  async checkForeignKeyConstraints() {
    try {
      const { data, error } = await this.client.rpc('check_foreign_key_constraints');

      if (error) throw error;

      return {
        valid: data.violation_count === 0,
        violation_count: data.violation_count,
        violations: data.violations
      };

    } catch (error) {
      logger.error('Erreur vérification contraintes clés étrangères:', error);
      throw error;
    }
  }

  /**
   * Migrer les données
   */
  async migrateData(migrationScript) {
    try {
      // Exécuter un script de migration via RPC
      const { data, error } = await this.client.rpc('execute_data_migration', {
        migration_script: migrationScript
      });

      if (error) throw error;

      logger.info('Migration données exécutée', { script: migrationScript });
      return data;

    } catch (error) {
      logger.error('Erreur service supabase migrateData:', error);
      throw error;
    }
  }

  /**
   * Exporter les données
   */
  async exportData(tables = [], format = 'json') {
    try {
      const { data, error } = await this.client.rpc('export_database_data', {
        table_names: tables,
        export_format: format
      });

      if (error) throw error;

      logger.info('Données exportées', { tables, format, record_count: data?.length || 0 });
      return data;

    } catch (error) {
      logger.error('Erreur service supabase exportData:', error);
      throw error;
    }
  }

  /**
   * Importer les données
   */
  async importData(data, tableName) {
    try {
      const { data: result, error } = await this.client
        .from(tableName)
        .insert(data)
        .select();

      if (error) throw error;

      logger.info('Données importées', { 
        table: tableName, 
        record_count: result.length 
      });

      return result;

    } catch (error) {
      logger.error('Erreur service supabase importData:', error);
      throw error;
    }
  }

  /**
   * Surveiller les performances
   */
  async monitorPerformance() {
    try {
      const { data, error } = await this.client.rpc('get_performance_metrics');

      if (error) throw error;

      const metrics = {
        ...data,
        timestamp: new Date().toISOString(),
        database_size: data.database_size,
        active_connections: data.active_connections,
        query_performance: data.query_performance
      };

      // Alertes si nécessaire
      if (data.active_connections > 50) {
        logger.warn('Nombre élevé de connexions actives', { connections: data.active_connections });
      }

      if (data.slow_queries > 10) {
        logger.warn('Nombre élevé de requêtes lentes', { slow_queries: data.slow_queries });
      }

      return metrics;

    } catch (error) {
      logger.error('Erreur service supabase monitorPerformance:', error);
      throw error;
    }
  }

  /**
   * Gérer les utilisateurs
   */
  async manageUsers(action, userId, data = {}) {
    try {
      if (!this.adminClient) {
        throw new Error('Client admin requis pour la gestion des utilisateurs');
      }

      let result;

      switch (action) {
        case 'create':
          result = await this.adminClient.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: data.metadata
          });
          break;

        case 'update':
          result = await this.adminClient.auth.admin.updateUserById(userId, data.updates);
          break;

        case 'delete':
          result = await this.adminClient.auth.admin.deleteUser(userId);
          break;

        case 'invite':
          result = await this.adminClient.auth.admin.inviteUserByEmail(data.email, {
            data: data.metadata
          });
          break;

        default:
          throw new Error(`Action non supportée: ${action}`);
      }

      if (result.error) throw result.error;

      logger.info(`Utilisateur ${action}`, { userId, email: data.email });
      return result.data;

    } catch (error) {
      logger.error('Erreur service supabase manageUsers:', error);
      throw error;
    }
  }

  /**
   * Gérer les politiques RLS (Row Level Security)
   */
  async manageRLSPolicies(action, tableName, policyName, policyDefinition = {}) {
    try {
      const { data, error } = await this.client.rpc('manage_rls_policies', {
        p_action: action,
        p_table_name: tableName,
        p_policy_name: policyName,
        p_policy_definition: policyDefinition
      });

      if (error) throw error;

      logger.info(`Politique RLS ${action}`, { table: tableName, policy: policyName });
      return data;

    } catch (error) {
      logger.error('Erreur service supabase manageRLSPolicies:', error);
      throw error;
    }
  }

  /**
   * Journaliser les opérations
   */
  async logAuditEvent(userId, action, resourceType, resourceId, details = {}) {
    try {
      const { data, error } = await this.client
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details,
          ip_address: details.ip_address,
          user_agent: details.user_agent,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      logger.error('Erreur service supabase logAuditEvent:', error);
      throw error;
    }
  }

  /**
   * Obtenir les logs d'audit
   */
  async getAuditLogs(filters = {}) {
    try {
      let query = this.client
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('Erreur service supabase getAuditLogs:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();
