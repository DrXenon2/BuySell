const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Notification pour la gestion des notifications
 */
class Notification {
  constructor() {
    this.table = 'notifications';
  }

  // Créer une notification
  async create(notificationData) {
    const notification = {
      ...notificationData,
      created_at: new Date(),
      read_at: null
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Créer plusieurs notifications
  async createMultiple(notificationsData) {
    const notifications = notificationsData.map(notification => ({
      ...notification,
      created_at: new Date(),
      read_at: null
    }));

    const { data, error } = await supabase
      .from(this.table)
      .insert(notifications)
      .select();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(notificationId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error) throw error;
    return data;
  }

  // Notifications d'un utilisateur
  async findByUserId(userId, query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Filtres
    if (query.type) {
      supabaseQuery = supabaseQuery.eq('type', query.type);
    }

    if (query.priority) {
      supabaseQuery = supabaseQuery.eq('priority', query.priority);
    }

    if (query.is_read !== undefined) {
      if (query.is_read) {
        supabaseQuery = supabaseQuery.not('read_at', 'is', null);
      } else {
        supabaseQuery = supabaseQuery.is('read_at', null);
      }
    }

    // Tri
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

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
  }

  // Marquer comme lu
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        read_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Marquer plusieurs comme lus
  async markMultipleAsRead(notificationIds) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        read_at: new Date(),
        updated_at: new Date()
      })
      .in('id', notificationIds)
      .select();

    if (error) throw error;
    return data;
  }

  // Marquer toutes comme lues
  async markAllAsRead(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        read_at: new Date(),
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .is('read_at', null)
      .select();

    if (error) throw error;
    return data;
  }

  // Supprimer une notification
  async delete(notificationId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  }

  // Supprimer les notifications anciennes
  async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error } = await supabase
      .from(this.table)
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    logger.info(`Notifications nettoyées: plus anciennes que ${days} jours`);
    return true;
  }

  // Compter les notifications non lues
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;
    return count;
  }

  // Types de notifications prédéfinis
  async sendOrderNotification(userId, order, type) {
    const notificationTemplates = {
      ORDER_CONFIRMED: {
        title: 'Commande confirmée! ✅',
        message: `Votre commande #${order.order_number} a été confirmée.`,
        type: 'ORDER_UPDATE',
        priority: 'high',
        action_url: `/orders/${order.id}`
      },
      ORDER_SHIPPED: {
        title: 'Commande expédiée! 🚚',
        message: `Votre commande #${order.order_number} a été expédiée.`,
        type: 'ORDER_UPDATE',
        priority: 'medium',
        action_url: `/orders/${order.id}/tracking`
      },
      ORDER_DELIVERED: {
        title: 'Commande livrée! 📦',
        message: `Votre commande #${order.order_number} a été livrée.`,
        type: 'ORDER_UPDATE',
        priority: 'medium',
        action_url: `/orders/${order.id}`
      },
      PAYMENT_SUCCESS: {
        title: 'Paiement confirmé! 💳',
        message: `Votre paiement pour la commande #${order.order_number} a été confirmé.`,
        type: 'PAYMENT_UPDATE',
        priority: 'high',
        action_url: `/orders/${order.id}`
      },
      PAYMENT_FAILED: {
        title: 'Échec du paiement ❌',
        message: `Le paiement pour la commande #${order.order_number} a échoué.`,
        type: 'PAYMENT_UPDATE',
        priority: 'high',
        action_url: `/checkout/payment/${order.id}`
      }
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Type de notification non supporté: ${type}`);
    }

    return await this.create({
      user_id: userId,
      ...template
    });
  }

  // Notification pour les vendeurs
  async sendSellerNotification(sellerId, type, data) {
    const notificationTemplates = {
      NEW_ORDER: {
        title: 'Nouvelle commande! 🎉',
        message: `Vous avez reçu une nouvelle commande #${data.order_number}.`,
        type: 'SELLER_ORDER',
        priority: 'high',
        action_url: `/seller/orders/${data.order_id}`
      },
      LOW_STOCK: {
        title: 'Stock faible ⚠️',
        message: `Le produit "${data.product_name}" est en stock faible.`,
        type: 'INVENTORY_ALERT',
        priority: 'medium',
        action_url: `/seller/products/${data.product_id}`
      },
      REVIEW_RECEIVED: {
        title: 'Nouvel avis reçu ⭐',
        message: `Votre produit "${data.product_name}" a reçu un nouvel avis.`,
        type: 'PRODUCT_REVIEW',
        priority: 'low',
        action_url: `/seller/products/${data.product_id}/reviews`
      }
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Type de notification vendeur non supporté: ${type}`);
    }

    return await this.create({
      user_id: sellerId,
      ...template
    });
  }

  // Notifications système
  async sendSystemNotification(userIds, title, message, type = 'SYSTEM', priority = 'medium') {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      priority,
      created_at: new Date(),
      read_at: null
    }));

    return await this.createMultiple(notifications);
  }
}

module.exports = new Notification();
