/**
 * Client MTN Money pour l'API de paiement MTN
 * Intégration avec le service MTN Mobile Money
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class MTNMoneyClient {
  constructor() {
    this.baseURL = process.env.MTN_MONEY_BASE_URL || 'https://api.mtn.com/v1';
    this.apiKey = process.env.MTN_MONEY_API_KEY;
    this.merchantCode = process.env.MTN_MERCHANT_CODE;
    this.secretKey = process.env.MTN_SECRET_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Intercepteur pour l'authentification
    this.client.interceptors.request.use(
      (config) => {
        config.headers['Authorization'] = `Bearer ${this.apiKey}`;
        config.headers['X-Merchant-Code'] = this.merchantCode;
        config.headers['X-Secret-Key'] = this.secretKey;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Effectuer un paiement MTN Money
   */
  async processPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'XOF',
        phoneNumber,
        orderId,
        callbackUrl,
        metadata = {}
      } = paymentData;

      // Valider les données
      this.validatePaymentData(paymentData);

      // Formater le numéro de téléphone
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        amount: Math.round(amount),
        currency,
        customer_msisdn: formattedPhone,
        merchant_reference: orderId,
        description: `Paiement Buysell - Commande ${orderId}`,
        callback_url: callbackUrl,
        metadata: {
          source: 'buysell',
          order_id: orderId,
          ...metadata
        }
      };

      logger.info('Initiation paiement MTN Money:', { orderId, amount, phoneNumber: formattedPhone });

      const response = await this.client.post('/collection', payload);

      if (response.data.status === 'PENDING' || response.data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          status: response.data.status,
          message: 'Paiement initié avec succès',
          verificationRequired: true,
          nextAction: 'verify_otp',
          instructions: 'Vous allez recevoir un code OTP sur votre téléphone'
        };
      } else {
        throw new AppError(response.data.message || 'Échec initiation paiement', 400);
      }

    } catch (error) {
      logger.error('Erreur paiement MTN Money:', error.response?.data || error.message);
      
      if (error.response) {
        const mtnError = this.mapMTNError(error.response.data);
        throw new AppError(mtnError.message, mtnError.statusCode);
      }
      
      throw new AppError(`Erreur MTN Money: ${error.message}`, 500);
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async checkPaymentStatus(transactionId) {
    try {
      const response = await this.client.get(`/transaction/${transactionId}`);

      return {
        success: true,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        customerPhone: response.data.customer_msisdn,
        merchantReference: response.data.merchant_reference,
        timestamp: response.data.timestamp,
        metadata: response.data.metadata
      };

    } catch (error) {
      logger.error('Erreur vérification statut MTN:', error.response?.data || error.message);
      throw new AppError('Erreur vérification statut transaction', 500);
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(refundData) {
    try {
      const { transactionId, amount, reason = 'Refund request' } = refundData;

      const payload = {
        original_transaction_id: transactionId,
        amount: Math.round(amount),
        reason,
        metadata: {
          refund_timestamp: new Date().toISOString(),
          processed_by: 'buysell'
        }
      };

      const response = await this.client.post('/refund', payload);

      if (response.data.status === 'SUCCESS') {
        return {
          success: true,
          refundId: response.data.refund_id,
          transactionId: response.data.original_transaction_id,
          amount: response.data.amount,
          status: 'refunded',
          timestamp: response.data.timestamp
        };
      } else {
        throw new AppError(response.data.message || 'Échec remboursement', 400);
      }

    } catch (error) {
      logger.error('Erreur remboursement MTN:', error.response?.data || error.message);
      throw new AppError('Erreur lors du remboursement', 500);
    }
  }

  /**
   * Valider un numéro de téléphone MTN
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Vérification basique du format MTN
      const isValid = this.isValidMTNNumber(formattedNumber);
      
      if (!isValid) {
        return {
          valid: false,
          error: 'Numéro MTN invalide'
        };
      }

      // En production, vous pourriez appeler l'API de validation MTN
      // const response = await this.client.post('/validate/msisdn', {
      //   msisdn: formattedNumber
      // });

      return {
        valid: true,
        formattedNumber,
        network: 'MTN',
        country: this.detectCountry(formattedNumber)
      };

    } catch (error) {
      logger.error('Erreur validation numéro MTN:', error);
      return {
        valid: false,
        error: 'Erreur validation numéro'
      };
    }
  }

  /**
   * Obtenir le solde du marchand
   */
  async getMerchantBalance() {
    try {
      const response = await this.client.get('/balance');

      return {
        success: true,
        availableBalance: response.data.available_balance,
        currency: response.data.currency,
        lastUpdated: response.data.last_updated
      };

    } catch (error) {
      logger.error('Erreur récupération solde MTN:', error);
      throw new AppError('Erreur récupération solde', 500);
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  validatePaymentData(paymentData) {
    const { amount, phoneNumber, orderId } = paymentData;

    if (!amount || amount < 100) {
      throw new AppError('Montant minimum: 100 XOF', 400);
    }

    if (!phoneNumber) {
      throw new AppError('Numéro de téléphone requis', 400);
    }

    if (!this.isValidMTNNumber(phoneNumber)) {
      throw new AppError('Numéro MTN invalide', 400);
    }

    if (!orderId) {
      throw new AppError('Référence commande requise', 400);
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }
    
    if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
      cleaned = '+225' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+225' + cleaned;
    }
    
    return cleaned;
  }

  isValidMTNNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // MTN Côte d'Ivoire: +22507, +22505, +22501, +22547, +22548, +22549
    const mtnPatterns = [
      /^\+22507[0-9]{7}$/,
      /^\+22505[0-9]{7}$/,
      /^\+22501[0-9]{7}$/,
      /^\+22547[0-9]{7}$/,
      /^\+22548[0-9]{7}$/,
      /^\+22549[0-9]{7}$/
    ];
    
    return mtnPatterns.some(pattern => pattern.test(formatted));
  }

  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    if (phoneNumber.includes('+237')) return 'CM';
    if (phoneNumber.includes('+233')) return 'GH';
    return 'CI';
  }

  mapMTNError(mtnError) {
    const errorMap = {
      'INSUFFICIENT_FUNDS': {
        message: 'Fonds insuffisants sur le compte Mobile Money',
        statusCode: 402
      },
      'INVALID_MSISDN': {
        message: 'Numéro de téléphone invalide',
        statusCode: 400
      },
      'TRANSACTION_DECLINED': {
        message: 'Transaction refusée',
        statusCode: 402
      },
      'TIMEOUT': {
        message: 'Timeout de la transaction',
        statusCode: 408
      },
      'NETWORK_ERROR': {
        message: 'Erreur réseau',
        statusCode: 503
      }
    };

    const errorCode = mtnError.code || 'UNKNOWN_ERROR';
    return errorMap[errorCode] || {
      message: mtnError.message || 'Erreur MTN Money',
      statusCode: 500
    };
  }

  /**
   * Vérifier la santé du service MTN
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: true,
        service: 'MTN Money',
        timestamp: new Date().toISOString(),
        response: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'MTN Money',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Instance singleton
const mtnMoneyClient = new MTNMoneyClient();

module.exports = mtnMoneyClient;
