const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

class EmailJobs {
  /**
   * Envoie les rappels de paiement pour les commandes en attente
   */
  async sendPaymentReminders() {
    try {
      logger.info('💳 Recherche des commandes en attente de paiement...');

      // Commandes en attente depuis plus de 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          user_id,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .eq('status', 'pending')
        .lt('created_at', twentyFourHoursAgo)
        .is('payment_reminder_sent', false);

      if (error) {
        throw error;
      }

      logger.info(`📧 ${orders.length} rappels de paiement à envoyer`);

      let sentCount = 0;
      for (const order of orders) {
        try {
          await emailService.sendPaymentReminder({
            to: order.profiles.email,
            name: `${order.profiles.first_name} ${order.profiles.last_name}`,
            orderNumber: order.order_number,
            amount: order.total_amount,
            orderId: order.id
          });

          // Marquer comme envoyé
          await supabase
            .from('orders')
            .update({ payment_reminder_sent: true })
            .eq('id', order.id);

          sentCount++;
          logger.debug(`✅ Rappel envoyé pour la commande ${order.order_number}`);

        } catch (error) {
          logger.error(`❌ Erreur envoi rappel commande ${order.order_number}:`, error);
        }
      }

      logger.info(`✅ ${sentCount}/${orders.length} rappels de paiement envoyés`);

    } catch (error) {
      logger.error('❌ Erreur job sendPaymentReminders:', error);
      throw error;
    }
  }

  /**
   * Envoie les confirmations de commande en retard
   */
  async sendDelayedOrderConfirmations() {
    try {
      logger.info('📦 Recherche des confirmations de commande non envoyées...');

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          user_id,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .eq('status', 'confirmed')
        .is('confirmation_sent', false)
        .lt('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()); // > 1h

      if (error) {
        throw error;
      }

      logger.info(`📨 ${orders.length} confirmations de commande à envoyer`);

      let sentCount = 0;
      for (const order of orders) {
        try {
          await emailService.sendOrderConfirmation({
            to: order.profiles.email,
            name: `${order.profiles.first_name} ${order.profiles.last_name}`,
            orderNumber: order.order_number,
            amount: order.total_amount,
            orderId: order.id
          });

          await supabase
            .from('orders')
            .update({ confirmation_sent: true })
            .eq('id', order.id);

          sentCount++;
          logger.debug(`✅ Confirmation envoyée pour la commande ${order.order_number}`);

        } catch (error) {
          logger.error(`❌ Erreur envoi confirmation ${order.order_number}:`, error);
        }
      }

      logger.info(`✅ ${sentCount}/${orders.length} confirmations envoyées`);

    } catch (error) {
      logger.error('❌ Erreur job sendDelayedOrderConfirmations:', error);
      throw error;
    }
  }

  /**
   * Envoie les newsletters hebdomadaires
   */
  async sendWeeklyNewsletters() {
    try {
      logger.info('📰 Début de l\'envoi des newsletters hebdomadaires...');

      // Récupérer les utilisateurs abonnés à la newsletter
      const { data: subscribers, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, preferences')
        .eq('newsletter_subscribed', true)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      logger.info(`📧 ${subscribers.length} newsletters à envoyer`);

      // Récupérer les produits populaires de la semaine
      const { data: popularProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('views_count', { ascending: false })
        .limit(5);

      let sentCount = 0;
      for (const subscriber of subscribers) {
        try {
          await emailService.sendNewsletter({
            to: subscriber.email,
            name: `${subscriber.first_name} ${subscriber.last_name}`,
            products: popularProducts,
            preferences: subscriber.preferences
          });

          sentCount++;
          logger.debug(`✅ Newsletter envoyée à ${subscriber.email}`);

        } catch (error) {
          logger.error(`❌ Erreur envoi newsletter à ${subscriber.email}:`, error);
        }
      }

      logger.info(`✅ ${sentCount}/${subscribers.length} newsletters envoyées`);

    } catch (error) {
      logger.error('❌ Erreur job sendWeeklyNewsletters:', error);
      throw error;
    }
  }
}

module.exports = new EmailJobs();
