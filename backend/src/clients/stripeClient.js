/**
 * Client Stripe pour les paiements par carte
 * Intégration avec l'API Stripe
 */

const Stripe = require('stripe');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class StripeClient {
  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!this.secretKey) {
      throw new Error('Clé secrète Stripe manquante');
    }

    this.stripe = new Stripe(this.secretKey, {
      apiVersion: '2023-10-16',
      maxNetworkRetries: 2,
      timeout: 30000
    });
  }

  /**
   * Créer un Payment Intent
   */
  async createPaymentIntent(paymentData) {
    try {
      const {
        amount,
        currency = 'xof',
        payment_method,
        confirm = true,
        return_url,
        metadata = {}
      } = paymentData;

      // Valider les données
      this.validatePaymentData(paymentData);

      const paymentIntentData = {
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        payment_method,
        confirm,
        return_url,
        metadata,
        payment_method_types: ['card'],
        capture_method: 'automatic'
      };

      logger.info('Création Payment Intent Stripe:', { 
        amount, 
        currency,
        metadata: paymentIntentData.metadata 
      });

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      return {
        success: true,
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        nextAction: paymentIntent
