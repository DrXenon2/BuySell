/**
 * Service backend de traitement des paiements
 * Orchestration des paiements MTN, Orange, Wave, Stripe, etc.
 */

const { supabaseService } = require('./supabaseService');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

// Clients des processeurs de paiement (à configurer)
const mtnMoneyClient = require('../clients/mtnMoneyClient');
const orangeMoneyClient = require('../clients/orangeMoneyClient');
const wavePaymentClient = require('../clients/wavePaymentClient');
const stripeClient = require('../clients/stripeClient');

class PaymentProcessingService {
  constructor() {
    this.supabase = supabaseService;
    this.providers = {
      mtn_money: mtnMoneyClient,
      orange_money: orangeMoneyClient,
      wave: wavePaymentClient,
      stripe: stripeClient
    };
  }

  /**
   * Traiter un paiement
   */
  async processPayment(paymentRequest) {
    try {
      const {
        orderId,
        amount,
        currency = 'XOF',
        paymentMethod,
        customerInfo,
        metadata = {}
      } = paymentRequest;

      // Validation de la requête
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
      }

      // Créer l'enregistrement de paiement
      const paymentRecord = await this.createPaymentRecord({
        order_id: orderId,
        amount,
        currency,
        payment_method: paymentMethod,
        status: 'initiated',
        customer_info: customerInfo,
        metadata
      });

      // Sélectionner le processeur
      const processor = this.selectPaymentProcessor(paymentMethod, currency, customerInfo.country);
      
      if (!processor) {
        throw new AppError('Processeur de paiement non disponible', 400);
      }

      let paymentResult;

      // Traiter selon le type de paiement
      switch (paymentMethod) {
        case 'mtn_money':
        case 'orange_money':
        case 'wave':
          paymentResult = await this.processMobileMoneyPayment(processor, {
            amount,
            currency,
            phoneNumber: customerInfo.phone,
            orderId,
            paymentRecordId: paymentRecord.id
          });
          break;

        case 'stripe':
        case 'visa':
        case 'mastercard':
          paymentResult = await this.processCardPayment(processor, {
            amount,
            currency,
            paymentMethodId: customerInfo.paymentMethodId,
            orderId,
            customerEmail: customerInfo.email,
            paymentRecordId: paymentRecord.id
          });
          break;

        case 'cash':
          paymentResult = await this.processCashPayment({
            amount,
            orderId,
            paymentRecordId: paymentRecord.id,
            deliveryAddress: customerInfo.deliveryAddress
          });
          break;

        default:
          throw new AppError('Méthode de paiement non supportée', 400);
      }

      // Mettre à jour l'enregistrement de paiement
      await this.updatePaymentRecord(paymentRecord.id, {
        status: paymentResult.status,
        processor_reference: paymentResult.processorReference,
        processor_response: paymentResult.processorResponse,
        updated_at: new Date().toISOString()
      });

      // Mettre à jour la commande
      await this.updateOrderPaymentStatus(orderId, paymentResult.status);

      return {
        success: paymentResult.success,
        paymentId: paymentRecord.id,
        orderId,
        status: paymentResult.status,
        processorReference: paymentResult.processorReference,
        nextAction: paymentResult.nextAction,
        verificationRequired: paymentResult.verificationRequired,
        message: paymentResult.message
      };

    } catch (error) {
      logger.error('Erreur traitement paiement:', error);
      
      // Mettre à jour le statut en échec
      if (paymentRecord) {
        await this.updatePaymentRecord(paymentRecord.id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        });
      }

      throw new AppError(`Échec paiement: ${error.message}`, 500);
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(paymentId) {
    try {
      const paymentRecord = await this.getPaymentRecord(paymentId);
      
      if (!paymentRecord) {
        throw new AppError('Paiement non trouvé', 404);
      }

      // Si le paiement est déjà finalisé, retourner le statut actuel
      if (this.isFinalStatus(paymentRecord.status)) {
        return {
          paymentId,
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          updatedAt: paymentRecord.updated_at
        };
      }

      // Vérifier auprès du processeur
      const processor = this.providers[paymentRecord.payment_method];
      let statusResult;

      if (this.isMobileMoneyPayment(paymentRecord.payment_method)) {
        statusResult = await processor.checkPaymentStatus(
          paymentRecord.processor_reference
        );
      } else if (this.isCardPayment(paymentRecord.payment_method)) {
        statusResult = await processor.retrievePaymentIntent(
          paymentRecord.processor_reference
        );
      } else {
        // Pour cash, pas besoin de vérification externe
        statusResult = { status: paymentRecord.status };
      }

      // Mettre à jour le statut local
      if (statusResult.status !== paymentRecord.status) {
        await this.updatePaymentRecord(paymentId, {
          status: statusResult.status,
          processor_response: statusResult,
          updated_at: new Date().toISOString()
        });

        // Mettre à jour la commande si nécessaire
        if (this.isFinalStatus(statusResult.status)) {
          await this.updateOrderPaymentStatus(paymentRecord.order_id, statusResult.status);
        }
      }

      return {
        paymentId,
        status: statusResult.status,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        processorData: statusResult,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur vérification statut paiement:', error);
      throw error;
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(refundRequest) {
    try {
      const {
        paymentId,
        amount,
        reason = 'Refund request',
        metadata = {}
      } = refundRequest;

      const paymentRecord = await this.getPaymentRecord(paymentId);
      
      if (!paymentRecord) {
        throw new AppError('Paiement non trouvé', 404);
      }

      // Vérifier que le paiement peut être remboursé
      if (!this.canRefundPayment(paymentRecord)) {
        throw new AppError('Ce paiement ne peut pas être remboursé', 400);
      }

      // Valider le montant
      if (amount > paymentRecord.amount) {
        throw new AppError('Le montant du remboursement ne peut pas dépasser le paiement original', 400);
      }

      // Créer l'enregistrement de remboursement
      const refundRecord = await this.createRefundRecord({
        payment_id: paymentId,
        amount,
        reason,
        status: 'pending',
        metadata
      });

      let refundResult;

      // Traiter le remboursement selon le processeur
      const processor = this.providers[paymentRecord.payment_method];
      
      if (this.isMobileMoneyPayment(paymentRecord.payment_method)) {
        refundResult = await processor.processRefund({
          transactionId: paymentRecord.processor_reference,
          amount,
          reason
        });
      } else if (this.isCardPayment(paymentRecord.payment_method)) {
        refundResult = await processor.createRefund(
          paymentRecord.processor_reference,
          amount
        );
      } else {
        // Pour cash, gérer le remboursement manuellement
        refundResult = await this.processCashRefund(paymentRecord, amount, reason);
      }

      // Mettre à jour l'enregistrement de remboursement
      await this.updateRefundRecord(refundRecord.id, {
        status: refundResult.status,
        processor_reference: refundResult.processorReference,
        processor_response: refundResult,
        processed_at: new Date().toISOString()
      });

      // Mettre à jour le paiement original
      await this.updatePaymentRecord(paymentId, {
        refund_status: amount === paymentRecord.amount ? 'fully_refunded' : 'partially_refunded',
        total_refunded: (paymentRecord.total_refunded || 0) + amount,
        updated_at: new Date().toISOString()
      });

      return {
        success: refundResult.success,
        refundId: refundRecord.id,
        paymentId,
        amount,
        status: refundResult.status,
        processorReference: refundResult.processorReference,
        message: refundResult.message
      };

    } catch (error) {
      logger.error('Erreur traitement remboursement:', error);
      throw error;
    }
  }

  /**
   * Gérer les webhooks des processeurs de paiement
   */
  async handleWebhook(provider, webhookData) {
    try {
      logger.info(`Webhook reçu de ${provider}:`, webhookData);

      // Valider la signature du webhook (sécurité)
      const isValid = await this.validateWebhookSignature(provider, webhookData);
      if (!isValid) {
        throw new AppError('Signature webhook invalide', 401);
      }

      let paymentUpdate;

      // Traiter selon le provider
      switch (provider) {
        case 'mtn_money':
          paymentUpdate = await this.handleMTNWebhook(webhookData);
          break;

        case 'orange_money':
          paymentUpdate = await this.handleOrangeWebhook(webhookData);
          break;

        case 'wave':
          paymentUpdate = await this.handleWaveWebhook(webhookData);
          break;

        case 'stripe':
          paymentUpdate = await this.handleStripeWebhook(webhookData);
          break;

        default:
          throw new AppError(`Provider webhook non supporté: ${provider}`, 400);
      }

      // Mettre à jour le paiement
      if (paymentUpdate) {
        await this.updatePaymentFromWebhook(paymentUpdate);
      }

      return {
        success: true,
        processed: true,
        paymentUpdate
      };

    } catch (error) {
      logger.error('Erreur traitement webhook:', error);
      throw error;
    }
  }

  /**
   * Obtenir les méthodes de paiement disponibles
   */
  async getAvailablePaymentMethods(country = 'CI', amount = 0, currency = 'XOF') {
    try {
      const methods = [];

      // Paiement espèce (toujours disponible)
      methods.push({
        id: 'cash',
        name: 'Espèce',
        type: 'cash',
        available: true,
        fees: 0,
        instructions: 'Paiement à la livraison',
        limits: { min: 0, max: 1000000 }
      });

      // Mobile Money selon le pays
      if (['CI', 'SN', 'CM'].includes(country)) {
        if (country === 'CI') {
          methods.push({
            id: 'mtn_money',
            name: 'MTN Money',
            type: 'mobile_money',
            available: true,
            fees: 1.5,
            operator: 'MTN',
            limits: { min: 100, max: 500000 }
          });
        }

        methods.push({
          id: 'orange_money',
          name: 'Orange Money',
          type: 'mobile_money',
          available: true,
          fees: 1.5,
          operator: 'Orange',
          limits: { min: 100, max: 500000 }
        });

        if (['CI', 'SN'].includes(country)) {
          methods.push({
            id: 'wave',
            name: 'Wave',
            type: 'mobile_money',
            available: true,
            fees: 1,
            operator: 'Wave',
            limits: { min: 100, max: 1000000 }
          });
        }
      }

      // Cartes bancaires (selon la devise)
      if (['XOF', 'XAF', 'EUR', 'USD'].includes(currency)) {
        methods.push({
          id: 'stripe',
          name: 'Carte Bancaire',
          type: 'card',
          available: true,
          fees: 2.9,
          processors: ['Visa', 'Mastercard'],
          limits: { min: 100, max: 10000000 }
        });
      }

      // Filtrer par montant
      const filteredMethods = methods.filter(method => 
        amount >= method.limits.min && amount <= method.limits.max
      );

      return {
        country,
        currency,
        amount,
        methods: filteredMethods,
        defaultMethod: this.getDefaultPaymentMethod(country)
      };

    } catch (error) {
      logger.error('Erreur récupération méthodes paiement:', error);
      throw error;
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  validatePaymentRequest(paymentRequest) {
    const { orderId, amount, paymentMethod, customerInfo } = paymentRequest;
    const errors = [];

    if (!orderId) errors.push('ID commande requis');
    if (!amount || amount < 100) errors.push('Montant minimum: 100 XOF');
    if (!paymentMethod) errors.push('Méthode de paiement requise');
    if (!customerInfo) errors.push('Informations client requises');

    // Validation spécifique selon la méthode
    if (this.isMobileMoneyPayment(paymentMethod) && !customerInfo.phone) {
      errors.push('Numéro de téléphone requis pour Mobile Money');
    }

    if (this.isCardPayment(paymentMethod) && !customerInfo.paymentMethodId) {
      errors.push('Méthode de paiement carte requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  selectPaymentProcessor(paymentMethod, currency, country) {
    // Logique de sélection du processeur
    if (this.isMobileMoneyPayment(paymentMethod)) {
      return this.providers[paymentMethod];
    } else if (this.isCardPayment(paymentMethod)) {
      return this.providers.stripe;
    } else if (paymentMethod === 'cash') {
      return null; // Aucun processeur externe pour cash
    }

    return null;
  }

  async processMobileMoneyPayment(processor, paymentData) {
    const { amount, currency, phoneNumber, orderId, paymentRecordId } = paymentData;

    const paymentResult = await processor.processPayment({
      amount,
      currency,
      phoneNumber,
      orderId,
      callbackUrl: this.getWebhookUrl(processor.name),
      metadata: { paymentRecordId }
    });

    return {
      success: paymentResult.success,
      status: this.mapProcessorStatus(paymentResult.status),
      processorReference: paymentResult.transactionId,
      processorResponse: paymentResult,
      verificationRequired: paymentResult.verificationRequired || false,
      nextAction: paymentResult.nextAction,
      message: paymentResult.message
    };
  }

  async processCardPayment(processor, paymentData) {
    const { amount, currency, paymentMethodId, orderId, customerEmail } = paymentData;

    const paymentIntent = await processor.createPaymentIntent({
      amount: this.convertToSmallestUnit(amount, currency),
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      return_url: this.getReturnUrl(orderId),
      metadata: {
        order_id: orderId,
        customer_email: customerEmail
      }
    });

    return {
      success: paymentIntent.status === 'succeeded',
      status: this.mapProcessorStatus(paymentIntent.status),
      processorReference: paymentIntent.id,
      processorResponse: paymentIntent,
      verificationRequired: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
      message: this.getCardPaymentMessage(paymentIntent.status)
    };
  }

  async processCashPayment(paymentData) {
    // Pour les paiements cash, on marque simplement comme en attente
    return {
      success: true,
      status: 'pending_cash',
      processorReference: `CASH_${paymentData.paymentRecordId}`,
      verificationRequired: false,
      nextAction: 'wait_for_delivery',
      message: 'Paiement en espèces à la livraison'
    };
  }

  async processCashRefund(paymentRecord, amount, reason) {
    // Pour les remboursements cash, traitement manuel
    return {
      success: true,
      status: 'pending_manual',
      processorReference: `REFUND_CASH_${Date.now()}`,
      message: 'Remboursement à traiter manuellement'
    };
  }

  isMobileMoneyPayment(method) {
    return ['mtn_money', 'orange_money', 'wave'].includes(method);
  }

  isCardPayment(method) {
    return ['stripe', 'visa', 'mastercard'].includes(method);
  }

  isFinalStatus(status) {
    const finalStatuses = ['succeeded', 'failed', 'cancelled', 'refunded'];
    return finalStatuses.includes(status);
  }

  canRefundPayment(paymentRecord) {
    if (paymentRecord.status !== 'succeeded') return false;
    if (paymentRecord.refund_status === 'fully_refunded') return false;
    
    const refunded = paymentRecord.total_refunded || 0;
    return refunded < paymentRecord.amount;
  }

  mapProcessorStatus(processorStatus) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'succeeded': 'succeeded',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'requires_action': 'requires_action',
      'requires_confirmation': 'requires_confirmation'
    };

    return statusMap[processorStatus] || 'failed';
  }

  convertToSmallestUnit(amount, currency) {
    // Convertir en centimes pour Stripe
    if (['XOF', 'XAF'].includes(currency)) {
      return Math.round(amount); // Déjà en unités
    }
    return Math.round(amount * 100); // Pour EUR, USD, etc.
  }

  getDefaultPaymentMethod(country) {
    const defaults = {
      'CI': 'cash',
      'SN': 'cash',
      'CM': 'cash',
      'FR': 'stripe',
      'US': 'stripe'
    };
    return defaults[country] || 'cash';
  }

  getWebhookUrl(provider) {
    return `${process.env.APP_URL}/api/webhooks/payments/${provider}`;
  }

  getReturnUrl(orderId) {
    return `${process.env.FRONTEND_URL}/checkout/confirmation?order=${orderId}`;
  }

  getCardPaymentMessage(status) {
    const messages = {
      'succeeded': 'Paiement réussi',
      'processing': 'Paiement en cours de traitement',
      'requires_action': 'Action supplémentaire requise',
      'requires_payment_method': 'Méthode de paiement invalide',
      'canceled': 'Paiement annulé'
    };
    return messages[status] || 'Erreur de paiement';
  }

  // Méthodes d'accès aux données
  async createPaymentRecord(paymentData) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPaymentRecord(paymentId) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  async updatePaymentRecord(paymentId, updates) {
    const { error } = await this.supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId);

    if (error) throw error;
  }

  async createRefundRecord(refundData) {
    const { data, error } = await this.supabase
      .from('payment_refunds')
      .insert(refundData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRefundRecord(refundId, updates) {
    const { error } = await this.supabase
      .from('payment_refunds')
      .update(updates)
      .eq('id', refundId);

    if (error) throw error;
  }

  async updateOrderPaymentStatus(orderId, status) {
    const { error } = await this.supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId);

    if (error) throw error;
  }

  // Méthodes de gestion des webhooks (simplifiées)
  async validateWebhookSignature(provider, webhookData) {
    // Implémentation de validation de signature
    return true; // À implémenter selon le provider
  }

  async handleMTNWebhook(webhookData) {
    // Traitement webhook MTN
    return {
      paymentId: webhookData.metadata.paymentRecordId,
      status: this.mapProcessorStatus(webhookData.status),
      processorData: webhookData
    };
  }

  async handleStripeWebhook(webhookData) {
    // Traitement webhook Stripe
    return {
      paymentId: webhookData.data.object.metadata.paymentRecordId,
      status: this.mapProcessorStatus(webhookData.data.object.status),
      processorData: webhookData
    };
  }

  async updatePaymentFromWebhook(paymentUpdate) {
    await this.updatePaymentRecord(paymentUpdate.paymentId, {
      status: paymentUpdate.status,
      processor_response: paymentUpdate.processorData,
      updated_at: new Date().toISOString()
    });

    // Mettre à jour la commande si statut final
    if (this.isFinalStatus(paymentUpdate.status)) {
      const payment = await this.getPaymentRecord(paymentUpdate.paymentId);
      await this.updateOrderPaymentStatus(payment.order_id, paymentUpdate.status);
    }
  }
}

// Instance singleton
const paymentProcessingService = new PaymentProcessingService();

module.exports = { paymentProcessingService };
