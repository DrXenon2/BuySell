const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

class NotificationJobs {
  /**
   * Envoie des notifications pour les paniers abandonnés
   */
  async sendAbandonedCartNotifications() {
    try {
      logger.info('🛒 Recherche des paniers abandonnés...');

      // Paniers modifiés il y a plus de 1 heure mais moins de 24 heures
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: abandonedCarts, error } = await supabase
        .from('cart_items')
        .select(`
          user_id,
          profiles (
            email,
            first_name,
            last_name
          ),
          products (
            name,
            price
          )
        `)
        .lt('updated_at', oneHourAgo)
        .gt('updated_at', twentyFourHoursAgo)
        .is('abandonment_notification_sent', false);

      if (error) {
        throw error;
      }

      // Grouper par utilisateur
      const cartsByUser = this.groupCartsByUser(abandonedCarts);

      logger.info(`📧 ${Object.keys(cartsByUser).length} notifications panier abandonné à envoyer`);

      let sentCount = 0;
      for (const [userId, cartData] of Object.entries(cartsByUser)) {
        try {
          await emailService.sendAbandonedCartReminder({
            to: cartData.user.email,
            name: `${cartData.user.first_name} ${cartData.user.last_name}`,
            cartItems: cartData.items,
            cartTotal: cartData.items.reduce((sum, item) => sum + parseFloat(item.price), 0)
          });

          // Marquer comme notifié
          await supabase
            .from('cart_items')
            .update({ abandonment_notification_sent: true })
            .eq('user_id', userId)
            .lt('updated_at', oneHourAgo)
            .gt('updated_at', twentyFourHoursAgo);

          sentCount++;
          logger.debug(`✅ Notification panier envoyée à ${cartData.user.email}`);

        } catch (error) {
          logger.error(`❌ Erreur notification panier pour ${userId}:`, error);
        }
      }

      logger.info(`✅ ${sentCount}/${Object.keys(cartsByUser).length} notifications panier envoyées`);

    } catch (error) {
      logger.error('❌ Erreur job sendAbandonedCartNotifications:', error);
      throw error;
    }
  }

  /**
   * Vérifie les stocks bas et notifie les vendeurs
   */
  async checkLowStock() {
    try {
      logger.info('📦 Vérification des stocks bas...');

      const { data: lowStockProducts, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          low_stock_threshold,
          seller_id,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .lt('stock_quantity', supabase.raw('low_stock_threshold'))
        .gt('stock_quantity', 0)
        .eq('is_active', true)
        .is('low_stock_notification_sent', false);

      if (error) {
        throw error;
      }

      // Grouper par vendeur
      const productsBySeller = this.groupProductsBySeller(lowStockProducts);

      logger.info(`⚠️  ${Object.keys(productsBySeller).length} vendeurs à notifier pour stocks bas`);

      let notifiedSellers = 0;
      for (const [sellerId, sellerData] of Object.entries(productsBySeller)) {
        try {
          await emailService.sendLowStockAlert({
            to: sellerData.seller.email,
            name: `${sellerData.seller.first_name} ${sellerData.seller.last_name}`,
            products: sellerData.products
          });

          // Marquer les produits comme notifiés
          const productIds = sellerData.products.map(p => p.id);
          await supabase
            .from('products')
            .update({ low_stock_notification_sent: true })
            .in('id', productIds);

          notifiedSellers++;
          logger.debug(`✅ Alerte stock bas envoyée à ${sellerData.seller.email}`);

        } catch (error) {
          logger.error(`❌ Erreur alerte stock bas pour vendeur ${sellerId}:`, error);
        }
      }

      logger.info(`✅ ${notifiedSellers}/${Object.keys(productsBySeller).length} vendeurs notifiés`);

    } catch (error) {
      logger.error('❌ Erreur job checkLowStock:', error);
      throw error;
    }
  }

  /**
   * Vérifie les avis en attente de modération
   */
  async checkPendingReviews() {
    try {
      logger.info('⭐ Vérification des avis en attente de modération...');

      const { data: pendingReviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          created_at,
          products (
            name
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('status', 'pending')
        .is('moderation_notification_sent', false);

      if (error) {
        throw error;
      }

      if (pendingReviews.length > 0) {
        // Notifier les administrateurs
        const { data: admins } = await supabase
          .from('profiles')
          .select('email, first_name')
          .eq('role', 'admin')
          .eq('is_active', true);

        for (const admin of admins) {
          try {
            await emailService.sendPendingReviewsNotification({
              to: admin.email,
              name: admin.first_name,
              pendingReviews: pendingReviews.length,
              reviews: pendingReviews.slice(0, 5) // 5 premiers pour l'email
            });
          } catch (error) {
            logger.error(`❌ Erreur notification avis en attente pour ${admin.email}:`, error);
          }
        }

        // Marquer comme notifié
        const reviewIds = pendingReviews.map(r => r.id);
        await supabase
          .from('reviews')
          .update({ moderation_notification_sent: true })
          .in('id', reviewIds);

        logger.info(`📨 ${admins.length} administrateurs notifiés pour ${pendingReviews.length} avis en attente`);
      } else {
        logger.debug('✅ Aucun avis en attente de modération');
      }

    } catch (error) {
      logger.error('❌ Erreur job checkPendingReviews:', error);
      throw error;
    }
  }

  // Méthodes helpers
  groupCartsByUser(cartItems) {
    return cartItems.reduce((result, item) => {
      if (!result[item.user_id]) {
        result[item.user_id] = {
          user: item.profiles,
          items: []
        };
      }
      result[item.user_id].items.push({
        name: item.products.name,
        price: item.products.price
      });
      return result;
    }, {});
  }

  groupProductsBySeller(products) {
    return products.reduce((result, product) => {
      if (!result[product.seller_id]) {
        result[product.seller_id] = {
          seller: product.profiles,
          products: []
        };
      }
      result[product.seller_id].products.push({
        id: product.id,
        name: product.name,
        stock: product.stock_quantity,
        threshold: product.low_stock_threshold
      });
      return result;
    }, {});
  }
}

module.exports = new NotificationJobs();
