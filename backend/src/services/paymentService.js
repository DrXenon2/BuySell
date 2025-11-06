const Stripe = require('stripe');
const config = require('../config');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');

class PaymentService {
  constructor() {
    this.stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;
    this.currency = 'eur';
  }

  /**
   * Vérifier la configuration Stripe
   */
  isStripeConfigured() {
    return !!this.stripe;
  }

  /**
   * Créer une intention de paiement
   */
  async createPaymentIntent(orderId, paymentMethod = 'card', savePaymentMethod = false) {
    try {
      if (!this.isStripeConfigured()) {
        throw new Error('Stripe non configuré');
      }

      // Récupérer les détails de la commande
      const order = await this.getOrderDetails(orderId);
      if (!order) {
        throw new Error('Commande non trouvée');
      }

      // Vérifier que la commande peut être payée
      if (order.status !== 'pending') {
        throw new Error('Cette commande ne peut pas être payée');
      }

      // Vérifier s'il y a déjà un paiement en cours
      const existingPayment = await this.getActivePayment(orderId);
      if (existingPayment) {
        return this.formatPaymentIntent(existingPayment);
      }

      // Créer l'intention de paiement Stripe
      const paymentIntentData = {
        amount: Math.round(order.total_amount * 100), // Stripe utilise les centimes
        currency: this.currency,
        metadata: {
          order_id: orderId,
          customer_id: order.customer_id,
          order_number: order.order_number
        },
        payment_method_types: [paymentMethod],
        setup_future_usage: savePaymentMethod ? 'on_session' : undefined
      };

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      // Enregistrer le paiement en base
      const paymentRecord = await this.createPaymentRecord({
        order_id: orderId,
        user_id: order.customer_id,
        amount: order.total_amount,
        currency: this.currency,
        payment_method: paymentMethod,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata
      });

      logger.info('Intention de paiement créée', {
        orderId,
        paymentIntentId: paymentIntent.id,
        amount: order.total_amount
      });

      return this.formatPaymentIntent(paymentRecord);

    } catch (error) {
      logger.error('Erreur service payment createPaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Confirmer un paiement
   */
  async confirmPayment(paymentIntentId, paymentMethodId = null) {
    try {
      if (!this.isStripeConfigured()) {
        throw new Error('Stripe non configuré');
      }

      // Récupérer le paiement
      const payment = await this.getPaymentByIntentId(paymentIntentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      let paymentIntent;

      if (paymentMethodId) {
        // Confirmer avec une méthode de paiement spécifique
        paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethodId
        });
      } else {
        // Récupérer l'intention existante
        paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      }

      // Mettre à jour le statut du paiement
      const updatedPayment = await this.updatePaymentStatus(
        payment.id,
        paymentIntent.status,
        {
          payment_method_id: paymentMethodId,
          stripe_response: paymentIntent
        }
      );

      // Traiter le résultat
      if (paymentIntent.status === 'succeeded') {
        await this.handleSuccessfulPayment(updatedPayment);
      } else if (paymentIntent.status === 'requires_action') {
        await this.handleRequiresAction(updatedPayment, paymentIntent);
      } else if (paymentIntent.status === 'requires_payment_method') {
        await this.handleRequiresPaymentMethod(updatedPayment);
      }

      logger.info('Paiement confirmé', {
        paymentId: payment.id,
        status: paymentIntent.status
      });

      return this.formatPaymentResult(updatedPayment, paymentIntent);

    } catch (error) {
      logger.error('Erreur service payment confirmPayment:', error);
      
      // Marquer le paiement comme échoué en cas d'erreur
      if (error.payment_intent) {
        await this.updatePaymentStatus(
          error.payment_intent.metadata.payment_id,
          'failed',
          { failure_message: error.message }
        );
      }

      throw error;
    }
  }

  /**
   * Traiter un paiement réussi
   */
  async handleSuccessfulPayment(payment) {
    try {
      // Mettre à jour la commande
      await this.updateOrderStatus(payment.order_id, 'confirmed', {
        paid_at: new Date(),
        payment_id: payment.id
      });

      // Créer une notification
      const notificationService = require('./notificationService');
      const order = await this.getOrderDetails(payment.order_id);
      const customer = await this.getUserProfile(payment.user_id);

      await notificationService.notifyPaymentSuccess(payment, customer);

      // Mettre à jour l'inventaire
      await this.updateInventory(payment.order_id);

      logger.info('Paiement réussi traité', {
        paymentId: payment.id,
        orderId: payment.order_id
      });

    } catch (error) {
      logger.error('Erreur traitement paiement réussi:', error);
      throw error;
    }
  }

  /**
   * Traiter une action requise
   */
  async handleRequiresAction(payment, paymentIntent) {
    // L'utilisateur doit compléter l'action (3DS, etc.)
    logger.info('Action requise pour le paiement', {
      paymentId: payment.id,
      nextAction: paymentIntent.next_action?.type
    });
  }

  /**
   * Traiter une méthode de paiement requise
   */
  async handleRequiresPaymentMethod(payment) {
    // L'utilisateur doit fournir une nouvelle méthode de paiement
    logger.info('Méthode de paiement requise', {
      paymentId: payment.id
    });
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(paymentId, refundData = {}) {
    try {
      if (!this.isStripeConfigured()) {
        throw new Error('Stripe non configuré');
      }

      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      if (payment.status !== 'succeeded') {
        throw new Error('Seuls les paiements réussis peuvent être remboursés');
      }

      const refundAmount = refundData.amount || payment.amount;
      if (refundAmount > payment.amount) {
        throw new Error('Le montant du remboursement ne peut pas dépasser le montant original');
      }

      // Créer le remboursement Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.payment_intent_id,
        amount: Math.round(refundAmount * 100),
        reason: refundData.reason || 'requested_by_customer',
        metadata: {
          payment_id: paymentId,
          order_id: payment.order_id,
          refund_reason: refundData.reason
        }
      });

      // Mettre à jour le paiement
      const updatedPayment = await this.updatePaymentStatus(paymentId, 'refunded', {
        refund_amount: refundAmount,
        refund_id: refund.id,
        refund_reason: refundData.reason,
        refunded_at: new Date()
      });

      // Mettre à jour la commande
      await this.updateOrderStatus(payment.order_id, 'refunded');

      logger.info('Paiement remboursé', {
        paymentId,
        refundAmount,
        refundId: refund.id
      });

      return {
        payment: updatedPayment,
        refund: refund
      };

    } catch (error) {
      logger.error('Erreur service payment refundPayment:', error);
      throw error;
    }
  }

  /**
   * Traiter un webhook Stripe
   */
  async handleStripeWebhook(event) {
    try {
      const { type, data } = event;
      const object = data.object;

      logger.info('Webhook Stripe reçu', { type });

      switch (type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(object);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(object);
          break;

        default:
          logger.debug(`Événement Stripe non traité: ${type}`);
      }

      return { success: true };

    } catch (error) {
      logger.error('Erreur traitement webhook Stripe:', error);
      throw error;
    }
  }

  /**
   * Gérer un paiement réussi via webhook
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    const payment = await this.getPaymentByIntentId(paymentIntent.id);
    if (!payment) {
      throw new Error(`Paiement non trouvé pour l'intention: ${paymentIntent.id}`);
    }

    await this.updatePaymentStatus(payment.id, 'succeeded', {
      processed_at: new Date(),
      stripe_response: paymentIntent
    });

    await this.handleSuccessfulPayment(payment);
  }

  /**
   * Gérer un paiement échoué via webhook
   */
  async handlePaymentIntentFailed(paymentIntent) {
    const payment = await this.getPaymentByIntentId(paymentIntent.id);
    if (!payment) return;

    await this.updatePaymentStatus(payment.id, 'failed', {
      failure_message: paymentIntent.last_payment_error?.message,
      failed_at: new Date()
    });

    // Notifier l'utilisateur
    const notificationService = require('./notificationService');
    const order = await this.getOrderDetails(payment.order_id);
    const customer = await this.getUserProfile(payment.user_id);

    await notificationService.sendNotification({
      userId: customer.id,
      type: 'PAYMENT_FAILED',
      title: 'Échec du paiement ❌',
      message: `Le paiement pour votre commande #${order.order_number} a échoué. Veuillez réessayer.`,
      priority: 'high',
      actionUrl: `${process.env.APP_URL}/checkout/payment/${order.id}`
    });
  }

  /**
   * Gérer un paiement annulé via webhook
   */
  async handlePaymentIntentCanceled(paymentIntent) {
    const payment = await this.getPaymentByIntentId(paymentIntent.id);
    if (!payment) return;

    await this.updatePaymentStatus(payment.id, 'canceled', {
      canceled_at: new Date()
    });
  }

  /**
   * Gérer un remboursement via webhook
   */
  async handleChargeRefunded(charge) {
    const payment = await this.getPaymentByIntentId(charge.payment_intent);
    if (!payment) return;

    const refund = charge.refunds.data[0];
    await this.updatePaymentStatus(payment.id, 'refunded', {
      refund_amount: refund.amount / 100,
      refund_id: refund.id,
      refunded_at: new Date(refund.created * 1000)
    });

    await this.updateOrderStatus(payment.order_id, 'refunded');
  }

  /**
   * Méthodes d'accès aux données
   */

  async getOrderDetails(orderId) {
    const { data, error } = await supabase.getClient()
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  async getActivePayment(orderId) {
    const { data, error } = await supabase.getClient()
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['requires_payment_method', 'requires_confirmation', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createPaymentRecord(paymentData) {
    const { data, error } = await supabase.getClient()
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPaymentByIntentId(paymentIntentId) {
    const { data, error } = await supabase.getClient()
      .from('payments')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error) throw error;
    return data;
  }

  async getPaymentById(paymentId) {
    const { data, error } = await supabase.getClient()
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  async updatePaymentStatus(paymentId, status, updates = {}) {
    const { data, error } = await supabase.getClient()
      .from('payments')
      .update({
        status,
        ...updates,
        updated_at: new Date()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOrderStatus(orderId, status, updates = {}) {
    const { data, error } = await supabase.getClient()
      .from('orders')
      .update({
        status,
        ...updates,
        updated_at: new Date()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId) {
    const { data, error } = await supabase.getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateInventory(orderId) {
    // Mettre à jour les quantités des produits
    const { data: items, error } = await supabase.getClient()
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (error) throw error;

    for (const item of items) {
      await supabase.getClient().rpc('decrement_product_stock', {
        product_id: item.product_id,
        decrement_by: item.quantity
      });
    }
  }

  /**
   * Formater les réponses
   */

  formatPaymentIntent(payment) {
    return {
      payment_intent_id: payment.payment_intent_id,
      client_secret: payment.client_secret,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    };
  }

  formatPaymentResult(payment, paymentIntent) {
    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      },
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        next_action: paymentIntent.next_action,
        requires_action: paymentIntent.status === 'requires_action',
        is_successful: paymentIntent.status === 'succeeded'
      }
    };
  }

  /**
   * Méthodes de paiement alternatives
   */

  // Paiement mobile money (stub)
  async createMobileMoneyPayment(orderId, phoneNumber, provider) {
    // Implémentation pour Orange Money, MTN Money, etc.
    throw new Error('Paiement mobile money non implémenté');
  }

  // Paiement à la livraison
  async createCashOnDeliveryPayment(orderId) {
    try {
      const order = await this.getOrderDetails(orderId);
      
      const payment = await this.createPaymentRecord({
        order_id: orderId,
        user_id: order.customer_id,
        amount: order.total_amount,
        currency: this.currency,
        payment_method: 'cash_on_delivery',
        status: 'pending',
        metadata: {
          payment_type: 'cash_on_delivery'
        }
      });

      // La commande reste en attente jusqu'au paiement à la livraison
      await this.updateOrderStatus(orderId, 'pending_cod');

      return payment;

    } catch (error) {
      logger.error('Erreur service payment createCashOnDeliveryPayment:', error);
      throw error;
    }
  }

  // Confirmer le paiement à la livraison
  async confirmCashOnDeliveryPayment(orderId) {
    try {
      const payment = await this.getActivePayment(orderId);
      if (!payment || payment.payment_method !== 'cash_on_delivery') {
        throw new Error('Paiement à la livraison non trouvé');
      }

      await this.updatePaymentStatus(payment.id, 'succeeded', {
        processed_at: new Date()
      });

      await this.handleSuccessfulPayment(payment);

      return payment;

    } catch (error) {
      logger.error('Erreur service payment confirmCashOnDeliveryPayment:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
