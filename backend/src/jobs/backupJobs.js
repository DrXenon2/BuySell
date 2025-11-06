const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const config = require('../config');

class BackupJobs {
  /**
   * Sauvegarde quotidienne de la base de données
   */
  async dailyBackup() {
    try {
      logger.info('💾 Début de la sauvegarde quotidienne...');

      const backupData = {
        timestamp: new Date().toISOString(),
        tables: {}
      };

      // Tables à sauvegarder
      const tablesToBackup = [
        'products', 'categories', 'orders', 'order_items', 
        'payments', 'reviews', 'profiles', 'promotions'
      ];

      for (const table of tablesToBackup) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1000); // Limite pour éviter les problèmes de mémoire

          if (error) {
            logger.warn(`⚠️ Erreur sauvegarde table ${table}:`, error);
            continue;
          }

          backupData.tables[table] = {
            count: data.length,
            data: data
          };

          logger.debug(`✅ Table ${table} sauvegardée: ${data.length} enregistrements`);

        } catch (error) {
          logger.error(`❌ Erreur sauvegarde table ${table}:`, error);
        }
      }

      // Sauvegarder dans Supabase Storage
      await this.saveBackupToStorage(backupData);

      // Nettoyer les vieilles sauvegardes
      await this.cleanupOldBackups();

      logger.info('✅ Sauvegarde quotidienne terminée avec succès');

    } catch (error) {
      logger.error('❌ Erreur job dailyBackup:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde les données dans Supabase Storage
   */
  async saveBackupToStorage(backupData) {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `backups/daily-${timestamp}.json`;

      // Convertir en JSON
      const backupJson = JSON.stringify(backupData, null, 2);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('backups')
        .upload(fileName, backupJson, {
          contentType: 'application/json',
          upsert: false
        });

      if (error) {
        throw error;
      }

      logger.info(`📁 Sauvegarde enregistrée: ${fileName}`);

      // Enregistrer dans la table des sauvegardes
      await supabase
        .from('backups')
        .insert({
          filename: fileName,
          size: Buffer.byteLength(backupJson, 'utf8'),
          table_counts: Object.keys(backupData.tables).reduce((acc, table) => {
            acc[table] = backupData.tables[table].count;
            return acc;
          }, {}),
          created_at: new Date().toISOString()
        });

    } catch (error) {
      logger.error('❌ Erreur saveBackupToStorage:', error);
      throw error;
    }
  }

  /**
   * Nettoie les sauvegardes de plus de 30 jours
   */
  async cleanupOldBackups() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Récupérer les vieilles sauvegardes
      const { data: oldBackups, error } = await supabase
        .from('backups')
        .select('id, filename')
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        throw error;
      }

      if (oldBackups.length > 0) {
        // Supprimer des fichiers storage
        const filesToDelete = oldBackups.map(backup => backup.filename);
        
        const { error: storageError } = await supabase.storage
          .from('backups')
          .remove(filesToDelete);

        if (storageError) {
          logger.warn('⚠️ Erreur suppression fichiers backup:', storageError);
        }

        // Supprimer des enregistrements
        const { error: deleteError } = await supabase
          .from('backups')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString());

        if (deleteError) {
          throw deleteError;
        }

        logger.info(`🗑️  ${oldBackups.length} vieilles sauvegardes nettoyées`);
      } else {
        logger.debug('✅ Aucune vieille sauvegarde à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupOldBackups:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde d'urgence (peut être déclenchée manuellement)
   */
  async emergencyBackup() {
    try {
      logger.warn('🚨 Début de la sauvegarde d\'urgence...');

      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'emergency',
        tables: {}
      };

      // Tables critiques seulement
      const criticalTables = ['profiles', 'products', 'orders', 'payments'];

      for (const table of criticalTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(500);

        if (!error && data) {
          backupData.tables[table] = {
            count: data.length,
            data: data
          };
        }
      }

      // Sauvegarder avec un nom d'urgence
      const fileName = `backups/emergency-${Date.now()}.json`;
      const backupJson = JSON.stringify(backupData, null, 2);

      await supabase.storage
        .from('backups')
        .upload(fileName, backupJson, {
          contentType: 'application/json',
          upsert: true
        });

      logger.warn('🚨 Sauvegarde d\'urgence terminée');

    } catch (error) {
      logger.error('❌ ERREUR CRITIQUE - Sauvegarde d\'urgence échouée:', error);
      throw error;
    }
  }
}

module.exports = new BackupJobs();
