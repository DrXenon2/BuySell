/**
 * Service de paiement MTN Mobile Money pour Buysell
 * Intégration avec l'API MTN pour les paiements en Côte d'Ivoire et autres pays
 */

import { PAYMENT_PROCESSORS, PAYMENT_STATUS, PAYMENT_ERRORS } from '../../config/payment-methods';

class MTNMoneyService {
  constructor() {
    this.config = PAYMENT_PROCESSORS.mtn_money;
    this.baseURL = this.config.config.baseURL;
    this.timeout = this.config.config.timeout;
  }

  /**
   * Initialiser le service avec les clés d'API
   */
  initialize(apiKey, merchantCode, secretKey) {
    this.apiKey = apiKey || this.config.apiKey;
    this.merchantCode = merchantCode || this.config.merchantCode;
    this.secretKey = secretKey || this.config.secretKey;
    
    if (!this.apiKey || !this.merchantCode) {
      throw new Error('Configuration MTN Money manquante');
    }
  }

  /**
   * Générer les headers d'authentification
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-Code': this.merchantCode,
      'X-Secret-Key': this.secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Effectuer un paiement MTN Money
   */
  async processPayment(paymentData) {
    const {
      amount,
      currency = 'XOF',
      phoneNumber,
      orderId,
      description = 'Achat Buysell',
      callbackUrl
    } = paymentData;

    try {
      // Valider les données de paiement
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Préparer la requête de paiement
      const payload = {
        amount: Math.round(amount), // MTN nécessite des nombres entiers
        currency,
        customer_msisdn: this.formatPhoneNumber(phoneNumber),
        merchant_reference: orderId,
        description,
        callback_url: callbackUrl,
        metadata: {
          source: 'buysell',
          order_id: orderId,
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.makeRequest('/collection', 'POST', payload);

      if (response.status === 'PENDING' || response.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: response.transaction_id,
          reference: response.merchant_reference,
          status: this.mapStatus(response.status),
          message: 'Paiement initié avec succès',
          verificationRequired: true,
          verificationData: {
            otpRequired: response.otp_required || false,
            instructions: response.instructions || 'Vérifiez votre téléphone pour confirmer le paiement'
          }
        };
      } else {
        throw new Error(response.message || 'Échec de l\'initiation du paiement');
      }

    } catch (error) {
      console.error('Erreur MTN Money:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors du traitement du paiement'
      };
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async checkPaymentStatus(transactionId) {
    try {
      const response = await this.makeRequest(`/transaction/${transactionId}`, 'GET');

      return {
        success: true,
        transactionId: response.transaction_id,
        status: this.mapStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        customerPhone: response.customer_msisdn,
        timestamp: response.timestamp,
        metadata: response.metadata
      };

    } catch (error) {
      console.error('Erreur vérification statut MTN:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors de la vérification du statut'
      };
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(refundData) {
    const { transactionId, amount, reason = 'Refund request' } = refundData;

    try {
      const payload = {
        original_transaction_id: transactionId,
        amount: Math.round(amount),
        reason,
        metadata: {
          refund_timestamp: new Date().toISOString(),
          processed_by: 'buysell'
        }
      };

      const response = await this.makeRequest('/refund', 'POST', payload);

      if (response.status === 'SUCCESS') {
        return {
          success: true,
          refundId: response.refund_id,
          transactionId: response.original_transaction_id,
          amount: response.amount,
          status: PAYMENT_STATUS.REFUNDED,
          timestamp: response.timestamp
        };
      } else {
        throw new Error(response.message || 'Échec du remboursement');
      }

    } catch (error) {
      console.error('Erreur remboursement MTN:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors du remboursement'
      };
    }
  }

  /**
   * Valider un numéro de téléphone MTN
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Simulation de validation - en production, utiliser l'API MTN
      const payload = {
        msisdn: formattedNumber
      };

      const response = await this.makeRequest('/validate/msisdn', 'POST', payload);

      return {
        valid: response.valid || true, // MTN peut ne pas fournir cette API
        formattedNumber,
        network: 'MTN',
        country: this.detectCountry(phoneNumber)
      };

    } catch (error) {
      // Fallback: validation basique
      return {
        valid: this.isValidMTNNumber(phoneNumber),
        formattedNumber: this.formatPhoneNumber(phoneNumber),
        network: 'MTN',
        country: this.detectCountry(phoneNumber)
      };
    }
  }

  /**
   * Obtenir le solde du marchand
   */
  async getMerchantBalance() {
    try {
      const response = await this.makeRequest('/balance', 'GET');

      return {
        success: true,
        availableBalance: response.available_balance,
        currency: response.currency,
        lastUpdated: response.last_updated
      };

    } catch (error) {
      console.error('Erreur récupération solde:', error);
      return {
        success: false,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Méthodes utilitaires
   */

  // Valider les données de paiement
  validatePaymentData(paymentData) {
    const { amount, phoneNumber, orderId } = paymentData;

    if (!amount || amount < 100) {
      return { valid: false, error: 'Montant minimum: 100 XOF' };
    }

    if (!phoneNumber) {
      return { valid: false, error: 'Numéro de téléphone requis' };
    }

    if (!this.isValidMTNNumber(phoneNumber)) {
      return { valid: false, error: 'Numéro MTN invalide' };
    }

    if (!orderId) {
      return { valid: false, error: 'Référence de commande requise' };
    }

    return { valid: true };
  }

  // Formater le numéro de téléphone
  formatPhoneNumber(phoneNumber) {
    // Normaliser le format: +2250700000000
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

  // Vérifier si c'est un numéro MTN valide
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

  // Détecter le pays du numéro
  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    if (phoneNumber.includes('+237')) return 'CM';
    if (phoneNumber.includes('+233')) return 'GH';
    return 'CI'; // Par défaut
  }

  // Mapper les statuts MTN vers nos statuts
  mapStatus(mtnStatus) {
    const statusMap = {
      'PENDING': PAYMENT_STATUS.PENDING,
      'SUCCESS': PAYMENT_STATUS.SUCCEEDED,
      'FAILED': PAYMENT_STATUS.FAILED,
      'CANCELLED': PAYMENT_STATUS.CANCELLED,
      'REFUNDED': PAYMENT_STATUS.REFUNDED
    };
    
    return statusMap[mtnStatus] || PAYMENT_STATUS.PENDING;
  }

  // Mapper les erreurs MTN
  mapError(error) {
    const errorMap = {
      'INSUFFICIENT_FUNDS': PAYMENT_ERRORS.INSUFFICIENT_FUNDS,
      'INVALID_MSISDN': PAYMENT_ERRORS.INVALID_CARD,
      'TRANSACTION_DECLINED': PAYMENT_ERRORS.TRANSACTION_DECLINED,
      'TIMEOUT': PAYMENT_ERRORS.TIMEOUT,
      'NETWORK_ERROR': PAYMENT_ERRORS.NETWORK_ERROR
    };
    
    return errorMap[error.code] || PAYMENT_ERRORS.TRANSACTION_DECLINED;
  }

  /**
   * Effectuer une requête HTTP vers l'API MTN
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: this.getAuthHeaders(),
      timeout: this.timeout
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout de connexion à MTN Money');
      }
      throw error;
    }
  }
}

// Instance singleton
const mtnMoneyService = new MTNMoneyService();

export default mtnMoneyService;
