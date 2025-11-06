const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class CleanupJobs {
  /**
   * Nettoyage quotidien de la base de données
   */
  async dailyCleanup() {
    try {
      logger.info('🧹 Début du nettoyage quotidien...');

      const tasks = [
        this.cleanupExpiredCarts(),
        this.cleanupOldSessions(),
        this.cleanupTemporaryFiles(),
        this.cleanupOrphanedRecords(),
        this.cleanupExpiredPromotions()
      ];

      const results = await Promise.allSettled(tasks);

      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          logger.error(`❌ Tâche de nettoyage ${index} échouée:`, result.reason);
        }
      });

      logger.info(`✅ Nettoyage quotidien terminé: ${successCount}/${tasks.length} tâches réussies`);

    } catch (error) {
      logger.error('❌ Erreur job dailyCleanup:', error);
      throw error;
    }
  }

  /**
   * Nettoie les paniers expirés (plus de 30 jours)
   */
  async cleanupExpiredCarts() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: expiredCarts, error } = await supabase
        .from('cart_items')
        .select('id')
        .lt('updated_at', thirtyDaysAgo);

      if (error) {
        throw error;
      }

      if (expiredCarts.length > 0) {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .lt('updated_at', thirtyDaysAgo);

        if (deleteError) {
          throw deleteError;
        }

        logger.info(`🗑️  ${expiredCarts.length} paniers expirés nettoyés`);
      } else {
        logger.debug('✅ Aucun panier expiré à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupExpiredCarts:', error);
      throw error;
    }
  }

  /**
   * Nettoie les sessions expirées
   */
  async cleanupOldSessions() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: oldSessions, error } = await supabase
        .from('sessions')
        .select('id')
        .lt('expires_at', sevenDaysAgo);

      if (error) {
        throw error;
      }

      if (oldSessions.length > 0) {
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .lt('expires_at', sevenDaysAgo);

        if (deleteError) {
          throw deleteError;
        }

        logger.info(`🔐 ${oldSessions.length} sessions expirées nettoyées`);
      } else {
        logger.debug('✅ Aucune session expirée à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupOldSessions:', error);
      throw error;
    }
  }

  /**
   * Nettoie les tokens expirés
   */
  async cleanupExpiredTokens() {
    try {
      const now = new Date().toISOString();

      const { data: expiredTokens, error } = await supabase
        .from('tokens')
        .select('id')
        .lt('expires_at', now);

      if (error) {
        throw error;
      }

      if (expiredTokens.length > 0) {
        const { error: deleteError } = await supabase
          .from('tokens')
          .delete()
          .lt('expires_at', now);

        if (deleteError) {
          throw deleteError;
        }

        logger.info(`🔑 ${expiredTokens.length} tokens expirés nettoyés`);
      } else {
        logger.debug('✅ Aucun token expiré à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupExpiredTokens:', error);
      throw error;
    }
  }

  /**
   * Nettoie les fichiers temporaires
   */
  async cleanupTemporaryFiles() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: tempFiles, error } = await supabase
        .from('temporary_files')
        .select('id, file_path')
        .lt('created_at', twentyFourHoursAgo);

      if (error) {
        throw error;
      }

      if (tempFiles.length > 0) {
        // Supprimer les fichiers du stockage
        const filesToDelete = tempFiles.map(file => file.file_path);

        const { error: storageError } = await supabase.storage
          .from('uploads')
          .remove(filesToDelete);

        if (storageError) {
          logger.warn('⚠️ Erreur suppression fichiers storage:', storageError);
        }

        // Supprimer les enregistrements
        const { error: deleteError } = await supabase
          .from('temporary_files')
          .delete()
          .lt('created_at', twentyFourHoursAgo);

        if (deleteError) {
          throw deleteError;
        }

        logger.info(`📁 ${tempFiles.length} fichiers temporaires nettoyés`);
      } else {
        logger.debug('✅ Aucun fichier temporaire à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupTemporaryFiles:', error);
      throw error;
    }
  }

  /**
   * Nettoie les enregistrements orphelins
   */
  async cleanupOrphanedRecords() {
    try {
      // Nettoyer les order_items sans order
      const { data: orphanedOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id')
        .is('order_id', null);

      if (!itemsError && orphanedOrderItems.length > 0) {
        await supabase
          .from('order_items')
          .delete()
          .is('order_id', null);

        logger.info(`🛒 ${orphanedOrderItems.length} order_items orphelins nettoyés`);
      }

      // Nettoyer les reviews sans produit
      const { data: orphanedReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id')
        .is('product_id', null);

      if (!reviewsError && orphanedReviews.length > 0) {
        await supabase
          .from('reviews')
          .delete()
          .is('product_id', null);

        logger.info(`⭐ ${orphanedReviews.length} avis orphelins nettoyés`);
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupOrphanedRecords:', error);
      throw error;
    }
  }

  /**
   * Nettoie les promotions expirées
   */
  async cleanupExpiredPromotions() {
    try {
      const now = new Date().toISOString();

      const { data: expiredPromos, error } = await supabase
        .from('promotions')
        .select('id, code')
        .lt('expires_at', now)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      if (expiredPromos.length > 0) {
        const { error: updateError } = await supabase
          .from('promotions')
          .update({ is_active: false })
          .lt('expires_at', now);

        if (updateError) {
          throw updateError;
        }

        logger.info(`🎫 ${expiredPromos.length} promotions expirées désactivées`);
      } else {
        logger.debug('✅ Aucune promotion expirée à nettoyer');
      }

    } catch (error) {
      logger.error('❌ Erreur cleanupExpiredPromotions:', error);
      throw error;
    }
  }
}

module.exports = new CleanupJobs();
