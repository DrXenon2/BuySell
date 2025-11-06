
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const crypto = require('crypto');

class WebhookController {
  // Webhook Stripe pour les paiements
  async stripeWebhook(req, res) {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      // Vérifier la signature (à implémenter selon votre configuration Stripe)
      const isValid = this.verifyStripeSignature(payload, signature);
      
      if (!isValid) {
        logger.warn('Signature webhook Stripe invalide');
        return res.status(400).send('Signature invalide');
      }

      const event = payload;

      // Journaliser la réception du webhook
      await supabase
        .from('webhook_logs')
        .insert({
          provider: 'stripe',
          event_type: event.type,
          payload: event
        });

      // Traiter l'événement selon son type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        
        default:
          logger.info(`Événement Stripe non traité: ${event.type}`);
      }

      // Marquer le webhook comme traité
      await supabase
        .from('webhook_logs')
        .update({ processed: true })
        .eq('id', event.id); // Note: vous devrez stocker l'ID du webhook

      res.status(200).json({ received: true });

    } catch (error) {
      logger.error('Erreur webhook Stripe:', error);
      
      // Marquer le webhook comme échoué
      await supabase
        .from('webhook_logs')
        .update({ 
          processed: true,
          result: { error: error.message }
        })
        .eq('id', req.body.id);

      res.status(500).json({ error: 'Erreur traitement webhook' });
    }
  }

  // Webhook Supabase pour les événements d'authentification
  async supabaseAuthWebhook(req, res) {
    try {
      const payload = req.body;
      const signature = req.headers['x-supabase-signature'];

      // Vérifier la signature
      const isValid = this.verifySupabaseSignature(payload, signature);
      
      if (!isValid) {
        logger.warn('Signature webhook Supabase invalide');
        return res.status(400).send('Signature invalide');
      }

      // Journaliser le webhook
      await supabase
        .from('webhook_logs')
        .insert({
          provider: 'supabase_auth',
          event_type: payload.type,
          payload: payload
        });

      // Traiter les événements d'authentification
      switch (payload.type) {
        case 'user.updated':
          await this.handleUserUpdated(payload);
          break;
        
        case 'user.deleted':
          await this.handleUserDeleted(payload);
          break;
        
        default:
          logger.info(`Événement Supabase Auth non traité: ${payload.type}`);
      }

      res.status(200).json({ received: true });

    } catch (error) {
      logger.error('Erreur webhook Supabase Auth:', error);
      res.status(500).json({ error: 'Erreur traitement webhook' });
    }
  }

  // Gérer le succès d'un paiement
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const { id: payment_intent_id, amount, metadata } = paymentIntent;

      // Mettre à jour le paiement dans la base de données
      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          metadata: metadata || {}
        })
        .eq('payment_intent_id', payment_intent_id)
        .select('order_id')
        .single();

      if (error) {
        throw error;
      }

      // Mettre à jour le statut de la commande
      if (payment && payment.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            paid_at: new Date().toISOString()
          })
          .eq('id', payment.order_id);

        // Notifier l'utilisateur
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, order_number')
          .eq('id', payment.order_id)
          .single();

        if (order) {
          await supabase
            .from('notifications')
            .insert({
              user_id: order.user_id,
              type: 'PAYMENT_SUCCESS',
              title: 'Paiement confirmé! ✅',
              message: `Votre paiement pour la commande #${order.order_number} a été confirmé.`,
              action_url: `/orders/${payment.order_id}`,
              priority: 'high'
            });
        }
      }

      logger.info('Paiement réussi via webhook', { payment_intent_id });

    } catch (error) {
      logger.error('Erreur traitement paiement réussi:', error);
      throw error;
    }
  }

  // Gérer l'échec d'un paiement
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const { id: payment_intent_id, last_payment_error } = paymentIntent;

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_message: last_payment_error?.message || 'Échec du paiement'
        })
        .eq('payment_intent_id', payment_intent_id);

      logger.info('Paiement échoué via webhook', { payment_intent_id });

    } catch (error) {
      logger.error('Erreur traitement paiement échoué:', error);
      throw error;
    }
  }

  // Gérer un remboursement
  async handleChargeRefunded(charge) {
    try {
      const { payment_intent: payment_intent_id, refunds } = charge;

      const refund = refunds.data[0]; // Premier remboursement

      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refund_amount: refund.amount / 100, // Stripe amount en centimes
          refunded_at: new Date(refund.created * 1000).toISOString()
        })
        .eq('payment_intent_id', payment_intent_id);

      // Mettre à jour la commande
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('payment_intent_id', payment_intent_id)
        .single();

      if (payment) {
        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('id', payment.order_id);
      }

      logger.info('Remboursement traité via webhook', { payment_intent_id });

    } catch (error) {
      logger.error('Erreur traitement remboursement:', error);
      throw error;
    }
  }

  // Gérer la mise à jour d'un utilisateur
  async handleUserUpdated(payload) {
    try {
      const { user } = payload.record;

      // Mettre à jour le profil si nécessaire
      await supabase
        .from('profiles')
        .update({
          email_verified: !!user.email_confirmed_at,
          last_login: user.last_sign_in_at
        })
        .eq('id', user.id);

      logger.info('Utilisateur mis à jour via webhook', { userId: user.id });

    } catch (error) {
      logger.error('Erreur traitement mise à jour utilisateur:', error);
      throw error;
    }
  }

  // Gérer la suppression d'un utilisateur
  async handleUserDeleted(payload) {
    try {
      const { user } = payload.record;

      // Soft delete du profil
      await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          email: `deleted_${user.id}@example.com`
        })
        .eq('id', user.id);

      logger.info('Utilisateur supprimé via webhook', { userId: user.id });

    } catch (error) {
      logger.error('Erreur traitement suppression utilisateur:', error);
      throw error;
    }
  }

  // Vérifier la signature Stripe
  verifyStripeSignature(payload, signature) {
    // Implémentation dépendante de votre configuration Stripe
    // Voir: https://stripe.com/docs/webhooks/signatures
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return true; // Désactivé en développement

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  // Vérifier la signature Supabase
  verifySupabaseSignature(payload, signature) {
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;
    if (!secret) return true; // Désactivé en développement

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new WebhookController();
