/**
 * Service de paiement Orange Money pour Buysell
 * Intégration avec l'API Orange Money pour l'Afrique de l'Ouest et Centrale
 */

import { PAYMENT_PROCESSORS, PAYMENT_STATUS, PAYMENT_ERRORS } from '../../config/payment-methods';

class OrangeMoneyService {
  constructor() {
    this.config = PAYMENT_PROCESSORS.orange_money;
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
      throw new Error('Configuration Orange Money manquante');
    }
  }

  /**
   * Générer les headers d'authentification
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-Code': this.merchantCode,
      'X-Auth-Token': this.secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Effectuer un paiement Orange Money
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
        amount: Math.round(amount),
        currency,
        customer_phone: this.formatPhoneNumber(phoneNumber),
        order_id: orderId,
        description,
        return_url: callbackUrl,
        metadata: {
          source: 'buysell',
          order_id: orderId,
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.makeRequest('/payment', 'POST', payload);

      if (response.payment_url || response.transaction_id) {
        return {
          success: true,
          transactionId: response.transaction_id,
          paymentUrl: response.payment_url,
          reference: response.order_id,
          status: PAYMENT_STATUS.PENDING,
          message: 'Paiement Orange Money initié',
          verificationRequired: true,
          verificationData: {
            otpRequired: true,
            instructions: 'Vous allez recevoir un code OTP sur votre téléphone Orange',
            paymentUrl: response.payment_url // Pour redirection vers l'interface Orange
          }
        };
      } else {
        throw new Error(response.error_message || 'Échec de l\'initiation du paiement');
      }

    } catch (error) {
      console.error('Erreur Orange Money:', error);
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
        customerPhone: response.customer_phone,
        timestamp: response.transaction_date,
        metadata: response.metadata
      };

    } catch (error) {
      console.error('Erreur vérification statut Orange:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors de la vérification du statut'
      };
    }
  }

  /**
   * Vérifier le statut via le numéro de commande
   */
  async checkStatusByOrderId(orderId) {
    try {
      const response = await this.makeRequest(`/order/${orderId}/status`, 'GET');

      return {
        success: true,
        orderId: response.order_id,
        status: this.mapStatus(response.status),
        transactionId: response.transaction_id,
        amount: response.amount,
        timestamp: response.last_updated
      };

    } catch (error) {
      console.error('Erreur vérification par orderId:', error);
      return {
        success: false,
        error: this.mapError(error)
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

      if (response.status === 'REFUNDED') {
        return {
          success: true,
          refundId: response.refund_id,
          transactionId: response.original_transaction_id,
          amount: response.amount,
          status: PAYMENT_STATUS.REFUNDED,
          timestamp: response.refund_date
        };
      } else {
        throw new Error(response.error_message || 'Échec du remboursement');
      }

    } catch (error) {
      console.error('Erreur remboursement Orange:', error);
      return {
        success: false,
        error: this.mapError(error),
        message: error.message || 'Erreur lors du remboursement'
      };
    }
  }

  /**
   * Valider un numéro de téléphone Orange
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const payload = {
        phone_number: formattedNumber
      };

      const response = await this.makeRequest('/validate/phone', 'POST', payload);

      return {
        valid: response.is_valid || true,
        formattedNumber,
        network: 'Orange',
        country: this.detectCountry(phoneNumber),
        customerName: response.customer_name || null
      };

    } catch (error) {
      // Fallback: validation basique
      return {
        valid: this.isValidOrangeNumber(phoneNumber),
        formattedNumber: this.formatPhoneNumber(phoneNumber),
        network: 'Orange',
        country: this.detectCountry(phoneNumber)
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

      const response = await this.makeRequest('/qrcode/generate', 'POST', payload);

      return {
        success: true,
        qrCodeUrl: response.qr_code_url,
        qrCodeData: response.qr_code_data,
        transactionId: response.transaction_id,
        expiresAt: response.expires_at
      };

    } catch (error) {
      console.error('Erreur génération QR Code:', error);
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

    if (!this.isValidOrangeNumber(phoneNumber)) {
      return { valid: false, error: 'Numéro Orange invalide' };
    }

    if (!orderId) {
      return { valid: false, error: 'Référence de commande requise' };
    }

    return { valid: true };
  }

  // Formater le numéro de téléphone
  formatPhoneNumber(phoneNumber) {
    // Normaliser le format Orange
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

  // Vérifier si c'est un numéro Orange valide
  isValidOrangeNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // Orange Côte d'Ivoire: +22507, +22505, +22501, +22507
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

  // Détecter le pays du numéro
  detectCountry(phoneNumber) {
    if (phoneNumber.includes('+225')) return 'CI';
    if (phoneNumber.includes('+221')) return 'SN';
    if (phoneNumber.includes('+237')) return 'CM';
    if (phoneNumber.includes('+223')) return 'ML';
    if (phoneNumber.includes('+226')) return 'BF';
    if (phoneNumber.includes('+224')) return 'GN';
    return 'CI'; // Par défaut
  }

  // Mapper les statuts Orange vers nos statuts
  mapStatus(orangeStatus) {
    const statusMap = {
      'INITIATED': PAYMENT_STATUS.PENDING,
      'PENDING': PAYMENT_STATUS.PENDING,
      'COMPLETED': PAYMENT_STATUS.SUCCEEDED,
      'FAILED': PAYMENT_STATUS.FAILED,
      'CANCELLED': PAYMENT_STATUS.CANCELLED,
      'REFUNDED': PAYMENT_STATUS.REFUNDED,
      'EXPIRED': PAYMENT_STATUS.FAILED
    };
    
    return statusMap[orangeStatus] || PAYMENT_STATUS.PENDING;
  }

  // Mapper les erreurs Orange
  mapError(error) {
    const errorMap = {
      'INSUFFICIENT_BALANCE': PAYMENT_ERRORS.INSUFFICIENT_FUNDS,
      'INVALID_PHONE_NUMBER': PAYMENT_ERRORS.INVALID_CARD,
      'TRANSACTION_DECLINED': PAYMENT_ERRORS.TRANSACTION_DECLINED,
      'TIMEOUT': PAYMENT_ERRORS.TIMEOUT,
      'NETWORK_ERROR': PAYMENT_ERRORS.NETWORK_ERROR,
      'DAILY_LIMIT_EXCEEDED': PAYMENT_ERRORS.TRANSACTION_DECLINED
    };
    
    return errorMap[error.code] || PAYMENT_ERRORS.TRANSACTION_DECLINED;
  }

  /**
   * Effectuer une requête HTTP vers l'API Orange
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
        throw new Error(errorData.error_message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Timeout de connexion à Orange Money');
      }
      throw error;
    }
  }
}

// Instance singleton
const orangeMoneyService = new OrangeMoneyService();

export default orangeMoneyService;
