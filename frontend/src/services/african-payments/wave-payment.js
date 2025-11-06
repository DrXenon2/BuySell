/**
 * Service de paiement Wave pour Buysell
 * Intégration avec l'API Wave pour les paiements mobiles en Afrique de l'Ouest
 */

import { PAYMENT_PROCESSORS, PAYMENT_STATUS, PAYMENT_ERRORS } from '../../config/payment-methods';

class WavePaymentService {
  constructor() {
    this.config = PAYMENT_PROCESSORS.wave;
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
      throw new Error('Configuration Wave manquante');
    }
  }

  /**
   * Générer les headers d'authentification
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-Id': this.merchantCode,
      'X-Secret-Key': this.secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Créer une charge de paiement Wave
   */
  async createCharge(paymentData) {
    const {
      amount,
      currency = 'XOF',
      phoneNumber,
      orderId,
      description = 'Achat Buysell',
      metadata = {}
    } = paymentData;

    try {
      // Valider les données de paiement
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Préparer la charge
      const payload = {
        amount: Math.round(amount * 100), // Wave utilise des centimes
        currency: currency.toLowerCase(),
        customer: {
          phone_number: this.formatPhoneNumber(phoneNumber)
        },
        metadata: {
          order_id: orderId,
          description,
          source: 'buysell',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      const response = await this.makeRequest('/charges', 'POST', payload);

      if (response.status === 'PENDING' || response.status === 'SUCCESS') {
        return {
          success: true,
          chargeId: response.id,
          transactionId: response.transaction_id,
          status: this.mapStatus(response.status),
          amount: response.amount / 100, // Convertir en unités normales
          currency: response.currency.toUpperCase(),
          paymentUrl: response.hosted_url,
          message: 'Charge Wave créée avec succès',
          verificationRequired: true,
          verificationData: {
            paymentUrl: response.hosted_url,
            instructions: 'Scannez le QR Code ou utilisez le lien de paiement',
            qrCode: response.qr_code
          }
        };
      } else {
        throw new Error(response.error_message || 'Échec de la création de la charge');
      }

    } catch (error) {
      console.error('Erreur Wave:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors de la création de la charge'
      };
    }
  }

  /**
   * Vérifier le statut d'une charge
   */
  async getChargeStatus(chargeId) {
    try {
      const response = await this.makeRequest(`/charges/${chargeId}`, 'GET');

      return {
        success: true,
        chargeId: response.id,
        status: this.mapStatus(response.status),
        amount: response.amount / 100,
        currency: response.currency.toUpperCase(),
        customerPhone: response.customer?.phone_number,
        paymentUrl: response.hosted_url,
        paidAt: response.paid_at,
        createdAt: response.created_at,
        metadata: response.metadata
      };

    } catch (error) {
      console.error('Erreur vérification statut Wave:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors de la vérification du statut'
      };
    }
  }

  /**
   * Annuler une charge
   */
  async cancelCharge(chargeId) {
    try {
      const response = await this.makeRequest(`/charges/${chargeId}/cancel`, 'POST');

      if (response.status === 'CANCELLED') {
        return {
          success: true,
          chargeId: response.id,
          status: PAYMENT_STATUS.CANCELLED,
          cancelledAt: response.cancelled_at
        };
      } else {
        throw new Error('Échec de l\'annulation de la charge');
      }

    } catch (error) {
      console.error('Erreur annulation Wave:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors de l\'annulation'
      };
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(refundData) {
    const { chargeId, amount, reason = 'Refund request' } = refundData;

    try {
      const payload = {
        amount: Math.round(amount * 100),
        reason,
        metadata: {
          refund_timestamp: new Date().toISOString(),
          processed_by: 'buysell'
        }
      };

      const response = await this.makeRequest(`/charges/${chargeId}/refund`, 'POST', payload);

      if (response.status === 'REFUNDED') {
        return {
          success: true,
          refundId: response.id,
          chargeId: response.charge,
          amount: response.amount / 100,
          status: PAYMENT_STATUS.REFUNDED,
          refundedAt: response.refunded_at
        };
      } else {
        throw new Error(response.error_message || 'Échec du remboursement');
      }

    } catch (error) {
      console.error('Erreur remboursement Wave:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors du remboursement'
      };
    }
  }

  /**
   * Valider un numéro de téléphone Wave
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Wave utilise généralement le même format que Orange/MTN
      return {
        valid: this.isValidWaveNumber(phoneNumber),
        formattedNumber,
        network: 'Wave',
        country: this.detectCountry(phoneNumber)
      };

    } catch (error) {
      return {
        valid: this.isValidWaveNumber(phoneNumber),
        formattedNumber: this.formatPhoneNumber(phoneNumber),
        network: 'Wave',
        country: this.detectCountry(phoneNumber)
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

      const response = await this.makeRequest('/customers', 'POST', payload);

      return {
        success: true,
        customerId: response.id,
        phoneNumber: response.phone_number,
        email: response.email,
        createdAt: response.created_at
      };

    } catch (error) {
      console.error('Erreur création client Wave:', error);
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
    const { amount, phoneNumber } = paymentData;

    if (!amount || amount < 100) {
      return { valid: false, error: 'Montant minimum: 100 XOF' };
    }

    if (!phoneNumber) {
      return { valid: false, error: 'Numéro de téléphone requis' };
    }

    if (!this.isValidWaveNumber(phoneNumber)) {
      return { valid: false, error: 'Numéro de téléphone invalide pour Wave' };
    }

    return { valid: true };
  }

  // Formater le numéro de téléphone
  formatPhoneNumber(phoneNumber) {
    // Wave accepte les numéros Orange et MTN
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

  // Vérifier si c'est un numéro valide pour Wave
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

  // Détecter le pays du numéro
  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    return 'CI'; // Par défaut
  }

  // Mapper les statuts Wave vers nos statuts
  mapStatus(waveStatus) {
    const statusMap = {
      'PENDING': PAYMENT_STATUS.PENDING,
      'SUCCESS': PAYMENT_STATUS.SUCCEEDED,
      'FAILED': PAYMENT_STATUS.FAILED,
      'CANCELLED': PAYMENT_STATUS.CANCELLED,
      'REFUNDED': PAYMENT_STATUS.REFUNDED,
      'EXPIRED': PAYMENT_STATUS.FAILED
    };
    
    return statusMap[waveStatus] || PAYMENT_STATUS.PENDING;
  }

  // Mapper les erreurs Wave
  mapError(error) {
    const errorMap = {
      'insufficient_funds': PAYMENT_ERRORS.INSUFFICIENT_FUNDS,
      'invalid_phone_number': PAYMENT_ERRORS.INVALID_CARD,
      'payment_declined': PAYMENT_ERRORS.TRANSACTION_DECLINED,
      'timeout': PAYMENT_ERRORS.TIMEOUT,
      'network_error': PAYMENT_ERRORS.NETWORK_ERROR
    };
    
    return errorMap[error.code] || PAYMENT_ERRORS.TRANSACTION_DECLINED;
  }

  /**
   * Effectuer une requête HTTP vers l'API Wave
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
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout de connexion à Wave');
      }
      throw error;
    }
  }
}

// Instance singleton
const wavePaymentService = new WavePaymentService();

export default wavePaymentService;
