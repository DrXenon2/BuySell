/**
 * Client Orange Money pour l'API de paiement Orange
 * Intégration avec le service Orange Money
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class OrangeMoneyClient {
  constructor() {
    this.baseURL = process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orangemoney';
    this.apiKey = process.env.ORANGE_MONEY_API_KEY;
    this.merchantCode = process.env.ORANGE_MERCHANT_CODE;
    this.secretKey = process.env.ORANGE_SECRET_KEY;
    
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
        config.headers['X-Auth-Token'] = this.secretKey;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Effectuer un paiement Orange Money
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
        customer_phone: formattedPhone,
        order_id: orderId,
        description: `Paiement Buysell - Commande ${orderId}`,
        return_url: callbackUrl,
        metadata: {
          source: 'buysell',
          order_id: orderId,
          ...metadata
        }
      };

      logger.info('Initiation paiement Orange Money:', { orderId, amount, phoneNumber: formattedPhone });

      const response = await this.client.post('/payment', payload);

      if (response.data.payment_url || response.data.transaction_id) {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          paymentUrl: response.data.payment_url,
          status: 'pending',
          message: 'Paiement Orange Money initié',
          verificationRequired: true,
          nextAction: 'redirect_or_otp',
          instructions: 'Vous allez être redirigé vers Orange Money ou recevoir un code OTP'
        };
      } else {
        throw new AppError(response.data.error_message || 'Échec initiation paiement', 400);
      }

    } catch (error) {
      logger.error('Erreur paiement Orange Money:', error.response?.data || error.message);
      
      if (error.response) {
        const orangeError = this.mapOrangeError(error.response.data);
        throw new AppError(orangeError.message, orangeError.statusCode);
      }
      
      throw new AppError(`Erreur Orange Money: ${error.message}`, 500);
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
        customerPhone: response.data.customer_phone,
        orderId: response.data.order_id,
        transactionDate: response.data.transaction_date,
        metadata: response.data.metadata
      };

    } catch (error) {
      logger.error('Erreur vérification statut Orange:', error.response?.data || error.message);
      throw new AppError('Erreur vérification statut transaction', 500);
    }
  }

  /**
   * Vérifier le statut via le numéro de commande
   */
  async checkStatusByOrderId(orderId) {
    try {
      const response = await this.client.get(`/order/${orderId}/status`);

      return {
        success: true,
        orderId: response.data.order_id,
        status: response.data.status,
        transactionId: response.data.transaction_id,
        amount: response.data.amount,
        lastUpdated: response.data.last_updated
      };

    } catch (error) {
      logger.error('Erreur vérification par orderId:', error);
      throw new AppError('Erreur vérification statut commande', 500);
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

      if (response.data.status === 'REFUNDED') {
        return {
          success: true,
          refundId: response.data.refund_id,
          transactionId: response.data.original_transaction_id,
          amount: response.data.amount,
          status: 'refunded',
          refundDate: response.data.refund_date
        };
      } else {
        throw new AppError(response.data.error_message || 'Échec remboursement', 400);
      }

    } catch (error) {
      logger.error('Erreur remboursement Orange:', error.response?.data || error.message);
      throw new AppError('Erreur lors du remboursement', 500);
    }
  }

  /**
   * Valider un numéro de téléphone Orange
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Vérification basique du format Orange
      const isValid = this.isValidOrangeNumber(formattedNumber);
      
      if (!isValid) {
        return {
          valid: false,
          error: 'Numéro Orange invalide'
        };
      }

      // En production, vous pourriez appeler l'API de validation Orange
      // const response = await this.client.post('/validate/phone', {
      //   phone_number: formattedNumber
      // });

      return {
        valid: true,
        formattedNumber,
        network: 'Orange',
        country: this.detectCountry(formattedNumber)
      };

    } catch (error) {
      logger.error('Erreur validation numéro Orange:', error);
      return {
        valid: false,
        error: 'Erreur validation numéro'
      };
    }
  }

  /**
   * Générer un QR Code pour paiement
   */
  async generateQRCode(paymentData) {
    try {
      const { amount, phoneNumber, orderId, description } = paymentData;

      const payload = {
        amount: Math.round(amount),
        phone_number: this.formatPhoneNumber(phoneNumber),
        order_id: orderId,
        description: description || 'Paiement Buysell'
      };

      const response = await this.client.post('/qrcode/generate', payload);

      return {
        success: true,
        qrCodeUrl: response.data.qr_code_url,
        qrCodeData: response.data.qr_code_data,
        transactionId: response.data.transaction_id,
        expiresAt: response.data.expires_at
      };

    } catch (error) {
      logger.error('Erreur génération QR Code Orange:', error);
      throw new AppError('Erreur génération QR Code', 500);
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

    if (!this.isValidOrangeNumber(phoneNumber)) {
      throw new AppError('Numéro Orange invalide', 400);
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

  isValidOrangeNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // Orange Côte d'Ivoire: +22507, +22505, +22501
    // Patterns Orange selon les pays
    const orangePatterns = [
      /^\+22507[0-9]{7}$/, // Côte d'Ivoire
      /^\+22505[0-9]{7}$/, // Côte d'Ivoire
      /^\+22501[0-9]{7}$/, // Côte d'Ivoire
      /^\+22177[0-9]{7}$/, // Sénégal
      /^\+23769[0-9]{7}$/, // Cameroun
      /^\+223[0-9]{8}$/,   // Mali
      /^\+226[0-9]{8}$/    // Burkina Faso
    ];
    
    return orangePatterns.some(pattern => pattern.test(formatted));
  }

  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    if (phoneNumber.includes('+237')) return 'CM';
    if (phoneNumber.includes('+223')) return 'ML';
    if (phoneNumber.includes('+226')) return 'BF';
    if (phoneNumber.includes('+224')) return 'GN';
    return 'CI';
  }

  mapOrangeError(orangeError) {
    const errorMap = {
      'INSUFFICIENT_BALANCE': {
        message: 'Fonds insuffisants sur le compte Orange Money',
        statusCode: 402
      },
      'INVALID_PHONE_NUMBER': {
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
        message: 'Erreur réseau Orange Money',
        statusCode: 503
      },
      'DAILY_LIMIT_EXCEEDED': {
        message: 'Limite quotidienne de transactions atteinte',
        statusCode: 429
      }
    };

    const errorCode = orangeError.code || 'UNKNOWN_ERROR';
    return errorMap[errorCode] || {
      message: orangeError.error_message || 'Erreur Orange Money',
      statusCode: 500
    };
  }

  /**
   * Vérifier la santé du service Orange
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: true,
        service: 'Orange Money',
        timestamp: new Date().toISOString(),
        response: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'Orange Money',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Instance singleton
const orangeMoneyClient = new OrangeMoneyClient();

module.exports = orangeMoneyClient;
