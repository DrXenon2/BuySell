const Stripe = require('stripe');
const config = require('./index');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = config.stripe.webhookSecret;
    this.init();
  }

  init() {
    try {
      if (!config.stripe.secretKey) {
        throw new Error('Clé secrète Stripe non configurée');
      }

      this.stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2023-10-16',
        maxNetworkRetries: 2,
        timeout: 10000,
      });

      logger.info('✅ Service Stripe initialisé');

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de Stripe:', error);
      throw error;
    }
  }

  // Créer un PaymentIntent
  async createPaymentIntent(amount, currency = 'xof', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
        description: `Paiement de ${amount} ${currency.toUpperCase()}`,
      });

      logger.info('💳 PaymentIntent créé:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };

    } catch (error) {
      logger.error('❌ Erreur de création de PaymentIntent:', error);
      throw this.handleError(error);
    }
  }

  // Confirmer un PaymentIntent
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: config.stripe.successUrl,
      });

      logger.info('✅ PaymentIntent confirmé:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });

      return paymentIntent;

    } catch (error) {
      logger.error('❌ Erreur de confirmation de PaymentIntent:', error);
      throw this.handleError(error);
    }
  }

  // Récupérer un PaymentIntent
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;

    } catch (error) {
      logger.error('❌ Erreur de récupération de PaymentIntent:', error);
      throw this.handleError(error);
    }
  }

  // Annuler un PaymentIntent
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      logger.info('❌ PaymentIntent annulé:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });

      return paymentIntent;

    } catch (error) {
      logger.error('❌ Erreur d\'annulation de PaymentIntent:', error);
      throw this.handleError(error);
    }
  }

  // Créer un remboursement
  async createRefund(paymentIntentId, amount = null) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('💰 Remboursement créé:', {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      });

      return refund;

    } catch (error) {
      logger.error('❌ Erreur de création de remboursement:', error);
      throw this.handleError(error);
    }
  }

  // Vérifier la signature du webhook
  verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info('🔔 Webhook Stripe vérifié:', { type: event.type });
      return event;

    } catch (error) {
      logger.error('❌ Signature de webhook invalide:', error);
      throw new Error('Signature de webhook invalide');
    }
  }

  // Gérer les événements webhook
  async handleWebhookEvent(event) {
    try {
      const { type, data } = event;

      logger.info('🔔 Traitement d\'événement webhook:', { type });

      switch (type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(data.object);

        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(data.object);

        case 'charge.refunded':
          return await this.handleRefund(data.object);

        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(data.object);

        default:
          logger.info('🔔 Événement webhook non géré:', { type });
          return { processed: false, type };
      }

    } catch (error) {
      logger.error('❌ Erreur de traitement du webhook:', error);
      throw error;
    }
  }

  // Handlers d'événements webhook
  async handlePaymentSucceeded(paymentIntent) {
    // Implémentation spécifique à l'application
    logger.info('✅ Paiement réussi:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });

    return {
      processed: true,
      type: 'payment_succeeded',
      paymentIntentId: paymentIntent.id,
    };
  }

  async handlePaymentFailed(paymentIntent) {
    logger.error('❌ Paiement échoué:', {
      id: paymentIntent.id,
      last_payment_error: paymentIntent.last_payment_error,
    });

    return {
      processed: true,
      type: 'payment_failed',
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error,
    };
  }

  async handleRefund(charge) {
    logger.info('💰 Remboursement traité:', {
      id: charge.id,
      amount: charge.amount_refunded,
    });

    return {
      processed: true,
      type: 'refund_processed',
      chargeId: charge.id,
      amount: charge.amount_refunded,
    };
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('🔄 Abonnement mis à jour:', {
      id: subscription.id,
      status: subscription.status,
    });

    return {
      processed: true,
      type: 'subscription_updated',
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  }

  // Méthodes pour les clients
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info('👤 Client Stripe créé:', {
        id: customer.id,
        email: customer.email,
      });

      return customer;

    } catch (error) {
      logger.error('❌ Erreur de création de client Stripe:', error);
      throw this.handleError(error);
    }
  }

  async retrieveCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;

    } catch (error) {
      logger.error('❌ Erreur de récupération de client Stripe:', error);
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs Stripe
  handleError(error) {
    const stripeError = {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
    };

    // Log spécifique selon le type d'erreur
    switch (error.type) {
      case 'StripeCardError':
        logger.error('💳 Erreur de carte:', stripeError);
        break;
      case 'StripeRateLimitError':
        logger.error('🚫 Rate limit Stripe:', stripeError);
        break;
      case 'StripeInvalidRequestError':
        logger.error('❌ Requête Stripe invalide:', stripeError);
        break;
      case 'StripeAPIError':
        logger.error('🔌 Erreur API Stripe:', stripeError);
        break;
      case 'StripeConnectionError':
        logger.error('📡 Erreur de connexion Stripe:', stripeError);
        break;
      case 'StripeAuthenticationError':
        logger.error('🔐 Erreur d\'authentification Stripe:', stripeError);
        break;
      default:
        logger.error('❌ Erreur Stripe inconnue:', stripeError);
    }

    return stripeError;
  }

  // Getter pour le client Stripe
  getClient() {
    if (!this.stripe) {
      throw new Error('Service Stripe non initialisé');
    }
    return this.stripe;
  }
}

// Instance singleton
const stripeService = new StripeService();

module.exports = stripeService;
