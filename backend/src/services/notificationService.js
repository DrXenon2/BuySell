const database = require('../config/database');
const logger = require('../utils/logger');
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.supabase = require('../config/supabase').getClient();
  }

  /**
   * Envoyer une notification
   */
  async sendNotification(notificationData) {
    try {
      const {
        userId,
        type,
        title,
        message,
        priority = 'medium',
        actionUrl = null,
        metadata = {}
      } = notificationData;

      // Créer la notification en base
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          priority,
          action_url: actionUrl,
          metadata,
          created_at: new Date(),
          read_at: null
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer les notifications push/email selon les préférences
      await this.deliverNotification(notification);

      logger.info('Notification envoyée', {
        userId,
        type,
        notificationId: notification.id
      });

      return notification;

    } catch (error) {
      logger.error('Erreur service notification sendNotification:', error);
      throw error;
    }
  }

  /**
   * Livrer la notification via différents canaux
   */
  async deliverNotification(notification) {
    try {
      // Récupérer les préférences de l'utilisateur
      const preferences = await this.getUserPreferences(notification.user_id);

      // Notification in-app (toujours envoyée)
      await this.sendInAppNotification(notification);

      // Email
      if (preferences.email_notifications && this.shouldSendEmail(notification)) {
        await this.sendEmailNotification(notification);
      }

      // Push (si implémenté)
      if (preferences.push_notifications) {
        await this.sendPushNotification(notification);
      }

      // SMS (si implémenté)
      if (preferences.sms_notifications && this.isHighPriority(notification)) {
        await this.sendSmsNotification(notification);
      }

    } catch (error) {
      logger.error('Erreur service notification deliverNotification:', error);
    }
  }

  /**
   * Notification in-app
   */
  async sendInAppNotification(notification) {
    // Déjà créée en base, rien de plus à faire
    logger.debug('Notification in-app créée', {
      notificationId: notification.id,
      userId: notification.user_id
    });
  }

  /**
   * Notification email
   */
  async sendEmailNotification(notification) {
    try {
      const user = await this.getUser(notification.user_id);
      if (!user) return;

      const subject = notification.title;
      const html = this.generateEmailTemplate(notification, user);

      await emailService.sendEmail(user.email, subject, html);

      logger.debug('Notification email envoyée', {
        notificationId: notification.id,
        email: user.email
      });

    } catch (error) {
      logger.error('Erreur envoi notification email:', error);
    }
  }

  /**
   * Notification push (stub)
   */
  async sendPushNotification(notification) {
    // Implémentation avec Firebase Cloud Messaging ou service similaire
    logger.debug('Notification push (non implémentée)', {
      notificationId: notification.id
    });
  }

  /**
   * Notification SMS (stub)
   */
  async sendSmsNotification(notification) {
    // Implémentation avec Twilio ou service similaire
    logger.debug('Notification SMS (non implémentée)', {
      notificationId: notification.id
    });
  }

  /**
   * Obtenir les préférences utilisateur
   */
  async getUserPreferences(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Retourner les préférences par défaut
        return {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          marketing_emails: false
        };
      }

      return data;

    } catch (error) {
      logger.error('Erreur récupération préférences:', error);
      return {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        marketing_emails: false
      };
    }
  }

  /**
   * Obtenir les informations utilisateur
   */
  async getUser(userId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  /**
   * Générer le template email
   */
  generateEmailTemplate(notification, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle notification</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.first_name},</h2>
            <h3>${notification.title}</h3>
            <p>${notification.message}</p>
            ${notification.action_url ? `
              <p style="text-align: center;">
                <a href="${notification.action_url}" class="button">Voir les détails</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>Vous recevez cet email car vous avez activé les notifications email dans vos préférences.</p>
            <p><a href="${process.env.APP_URL}/profile/notifications">Gérer mes préférences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifications système prédéfinies
   */

  // Nouvelle commande
  async notifyNewOrder(order, customer) {
    const sellers = await this.getOrderSellers(order.id);

    for (const seller of sellers) {
      await this.sendNotification({
        userId: seller.id,
        type: 'NEW_ORDER',
        title: 'Nouvelle commande reçue! 🎉',
        message: `Vous avez reçu une nouvelle commande #${order.order_number} de ${customer.first_name} ${customer.last_name}.`,
        priority: 'high',
        actionUrl: `${process.env.APP_URL}/seller/orders/${order.id}`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          customer_name: `${customer.first_name} ${customer.last_name}`,
          total_amount: order.total_amount
        }
      });
    }

    // Notification client
    await this.sendNotification({
      userId: customer.id,
      type: 'ORDER_CONFIRMED',
      title: 'Commande confirmée! ✅',
      message: `Votre commande #${order.order_number} a été confirmée. Nous vous tiendrons informé de son avancement.`,
      priority: 'medium',
      actionUrl: `${process.env.APP_URL}/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number
      }
    });
  }

  // Statut de commande mis à jour
  async notifyOrderStatusUpdate(order, customer, newStatus) {
    const statusMessages = {
      'processing': 'est en cours de préparation',
      'shipped': 'a été expédiée',
      'delivered': 'a été livrée',
      'cancelled': 'a été annulée'
    };

    const message = statusMessages[newStatus] || 'a été mise à jour';

    await this.sendNotification({
      userId: customer.id,
      type: 'ORDER_STATUS_UPDATE',
      title: `Mise à jour de votre commande #${order.order_number}`,
      message: `Votre commande ${message}.`,
      priority: 'medium',
      actionUrl: `${process.env.APP_URL}/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        new_status: newStatus
      }
    });
  }

  // Paiement réussi
  async notifyPaymentSuccess(payment, customer) {
    await this.sendNotification({
      userId: customer.id,
      type: 'PAYMENT_SUCCESS',
      title: 'Paiement confirmé! 💳',
      message: `Votre paiement pour la commande #${payment.order.order_number} a été confirmé.`,
      priority: 'high',
      actionUrl: `${process.env.APP_URL}/orders/${payment.order_id}`,
      metadata: {
        payment_id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount
      }
    });
  }

  // Stock faible
  async notifyLowStock(product, seller) {
    await this.sendNotification({
      userId: seller.id,
      type: 'LOW_STOCK',
      title: 'Stock faible ⚠️',
      message: `Le produit "${product.name}" est en stock faible (${product.quantity} restants).`,
      priority: 'medium',
      actionUrl: `${process.env.APP_URL}/seller/products/${product.id}`,
      metadata: {
        product_id: product.id,
        product_name: product.name,
        current_stock: product.quantity
      }
    });
  }

  // Nouvel avis
  async notifyNewReview(review, seller) {
    await this.sendNotification({
      userId: seller.id,
      type: 'NEW_REVIEW',
      title: 'Nouvel avis reçu ⭐',
      message: `Votre produit "${review.product.name}" a reçu un nouvel avis de ${review.user.first_name}.`,
      priority: 'low',
      actionUrl: `${process.env.APP_URL}/seller/products/${review.product_id}/reviews`,
      metadata: {
        review_id: review.id,
        product_id: review.product_id,
        product_name: review.product.name,
        rating: review.rating
      }
    });
  }

  /**
   * Méthodes utilitaires
   */

  // Obtenir les vendeurs d'une commande
  async getOrderSellers(orderId) {
    const { data, error } = await this.supabase
      .from('order_items')
      .select(`
        product:products(
          seller:profiles(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('order_id', orderId);

    if (error) throw error;

    const sellers = new Map();
    data.forEach(item => {
      if (item.product.seller) {
        sellers.set(item.product.seller.id, item.product.seller);
      }
    });

    return Array.from(sellers.values());
  }

  // Vérifier si on doit envoyer un email
  shouldSendEmail(notification) {
    const emailTypes = [
      'ORDER_CONFIRMED',
      'ORDER_STATUS_UPDATE',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SHIPPING_UPDATE'
    ];

    return emailTypes.includes(notification.type) || notification.priority === 'high';
  }

  // Vérifier si haute priorité
  isHighPriority(notification) {
    return notification.priority === 'high';
  }

  /**
   * Gestion des notifications existantes
   */

  // Marquer comme lue
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          read_at: new Date(),
          updated_at: new Date()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur service notification markAsRead:', error);
      throw error;
    }
  }

  // Marquer toutes comme lues
  async markAllAsRead(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          read_at: new Date(),
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .is('read_at', null)
        .select();

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur service notification markAllAsRead:', error);
      throw error;
    }
  }

  // Obtenir les notifications non lues
  async getUnreadNotifications(userId, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur service notification getUnreadNotifications:', error);
      throw error;
    }
  }

  // Supprimer les anciennes notifications
  async cleanupOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      logger.info(`Notifications nettoyées: plus anciennes que ${days} jours`);

    } catch (error) {
      logger.error('Erreur service notification cleanupOldNotifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
