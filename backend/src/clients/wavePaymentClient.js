/**
 * Client Wave pour l'API de paiement Wave
 * Intégration avec le service Wave
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class WavePaymentClient {
  constructor() {
    this.baseURL = process.env.WAVE_BASE_URL || 'https://api.wave.com/v1';
    this.apiKey = process.env.WAVE_API_KEY;
    this.merchantCode = process.env.WAVE_MERCHANT_CODE;
    this.secretKey = process.env.WAVE_SECRET_KEY;
    
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
        config.headers['X-Merchant-Id'] = this.merchantCode;
        config.headers['X-Secret-Key'] = this.secretKey;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Créer une charge de paiement Wave
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
        amount: Math.round(amount * 100), // Wave utilise des centimes
        currency: currency.toLowerCase(),
        customer: {
          phone_number: formattedPhone
        },
        metadata: {
          order_id: orderId,
          description: `Paiement Buysell - Commande ${orderId}`,
          source: 'buysell',
          ...metadata
        }
      };

      logger.info('Création charge Wave:', { orderId, amount, phoneNumber: formattedPhone });

      const response = await this.client.post('/charges', payload);

      if (response.data.status === 'PENDING' || response.data.status === 'SUCCESS') {
        return {
          success: true,
          chargeId: response.data.id,
          transactionId: response.data.transaction_id,
          status: response.data.status,
          amount: response.data.amount / 100, // Convertir en unités normales
          currency: response.data.currency.toUpperCase(),
          paymentUrl: response.data.hosted_url,
          message: 'Charge Wave créée avec succès',
          verificationRequired: true,
          nextAction: 'redirect_or_qr',
          instructions: 'Scannez le QR Code ou utilisez le lien de paiement'
        };
      } else {
        throw new AppError(response.data.error_message || 'Échec création charge', 400);
      }

    } catch (error) {
      logger.error('Erreur paiement Wave:', error.response?.data || error.message);
      
      if (error.response) {
        const waveError = this.mapWaveError(error.response.data);
        throw new AppError(waveError.message, waveError.statusCode);
      }
      
      throw new AppError(`Erreur Wave: ${error.message}`, 500);
    }
  }

  /**
   * Vérifier le statut d'une charge
   */
  async checkPaymentStatus(chargeId) {
    try {
      const response = await this.client.get(`/charges/${chargeId}`);

      return {
        success: true,
        chargeId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100,
        currency: response.data.currency.toUpperCase(),
        customerPhone: response.data.customer?.phone_number,
        paymentUrl: response.data.hosted_url,
        paidAt: response.data.paid_at,
        createdAt: response.data.created_at,
        metadata: response.data.metadata
      };

    } catch (error) {
      logger.error('Erreur vérification statut Wave:', error.response?.data || error.message);
      throw new AppError('Erreur vérification statut charge', 500);
    }
  }

  /**
   * Annuler une charge
   */
  async cancelCharge(chargeId) {
    try {
      const response = await this.client.post(`/charges/${chargeId}/cancel`);

      if (response.data.status === 'CANCELLED') {
        return {
          success: true,
          chargeId: response.data.id,
          status: 'cancelled',
          cancelledAt: response.data.cancelled_at
        };
      } else {
        throw new AppError('Échec annulation charge', 400);
      }

    } catch (error) {
      logger.error('Erreur annulation Wave:', error.response?.data || error.message);
      throw new AppError('Erreur lors de l\'annulation', 500);
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(refundData) {
    try {
      const { chargeId, amount, reason = 'Refund request' } = refundData;

      const payload = {
        amount: Math.round(amount * 100),
        reason,
        metadata: {
          refund_timestamp: new Date().toISOString(),
          processed_by: 'buysell'
        }
      };

      const response = await this.client.post(`/charges/${chargeId}/refund`, payload);

      if (response.data.status === 'REFUNDED') {
        return {
          success: true,
          refundId: response.data.id,
          chargeId: response.data.charge,
          amount: response.data.amount / 100,
          status: 'refunded',
          refundedAt: response.data.refunded_at
        };
      } else {
        throw new AppError(response.data.error_message || 'Échec remboursement', 400);
      }

    } catch (error) {
      logger.error('Erreur remboursement Wave:', error.response?.data || error.message);
      throw new AppError('Erreur lors du remboursement', 500);
    }
  }

  /**
   * Valider un numéro de téléphone pour Wave
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Wave accepte les numéros Orange et MTN
      const isValid = this.isValidWaveNumber(formattedNumber);
      
      if (!isValid) {
        return {
          valid: false,
          error: 'Numéro de téléphone invalide pour Wave'
        };
      }

      return {
        valid: true,
        formattedNumber,
        network: 'Wave',
        country: this.detectCountry(formattedNumber)
      };

    } catch (error) {
      logger.error('Erreur validation numéro Wave:', error);
      return {
        valid: false,
        error: 'Erreur validation numéro'
      };
    }
  }

  /**
   * Créer un client Wave
   */
  async createCustomer(customerData) {
    try {
      const { phoneNumber, email, name } = customerData;

      const payload = {
        phone_number: this.formatPhoneNumber(phoneNumber),
        email,
        name,
        metadata: {
          source: 'buysell',
          created_at: new Date().toISOString()
        }
      };

      const response = await this.client.post('/customers', payload);

      return {
        success: true,
        customerId: response.data.id,
        phoneNumber: response.data.phone_number,
        email: response.data.email,
        createdAt: response.data.created_at
      };

    } catch (error) {
      logger.error('Erreur création client Wave:', error);
      throw new AppError('Erreur création client', 500);
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  validatePaymentData(paymentData) {
    const { amount, phoneNumber } = paymentData;

    if (!amount || amount < 100) {
      throw new AppError('Montant minimum: 100 XOF', 400);
    }

    if (!phoneNumber) {
      throw new AppError('Numéro de téléphone requis', 400);
    }

    if (!this.isValidWaveNumber(phoneNumber)) {
      throw new AppError('Numéro de téléphone invalide pour Wave', 400);
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

  isValidWaveNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // Wave fonctionne avec Orange et MTN en Côte d'Ivoire et Sénégal
    const wavePatterns = [
      /^\+22507[0-9]{7}$/, // MTN CI
      /^\+22505[0-9]{7}$/, // Orange CI
      /^\+22501[0-9]{7}$/, // CI
      /^\+22177[0-9]{7}$/, // Orange SN
      /^\+22176[0-9]{7}$/  // Free SN
    ];
    
    return wavePatterns.some(pattern => pattern.test(formatted));
  }

  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    return 'CI';
  }

  mapWaveError(waveError) {
    const errorMap = {
      'insufficient_funds': {
        message: 'Fonds insuffisants sur le compte Wave',
        statusCode: 402
      },
      'invalid_phone_number': {
        message: 'Numéro de téléphone invalide',
        statusCode: 400
      },
      'payment_declined': {
        message: 'Paiement refusé',
        statusCode: 402
      },
      'timeout': {
        message: 'Timeout de la transaction',
        statusCode: 408
      },
      'network_error': {
        message: 'Erreur réseau Wave',
        statusCode: 503
      }
    };

    const errorCode = waveError.error?.code || 'UNKNOWN_ERROR';
    return errorMap[errorCode] || {
      message: waveError.error?.message || 'Erreur Wave',
      statusCode: 500
    };
  }

  /**
   * Vérifier la santé du service Wave
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: true,
        service: 'Wave',
        timestamp: new Date().toISOString(),
        response: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'Wave',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Instance singleton
const wavePaymentClient = new WavePaymentClient();

module.exports = wavePaymentClient;
