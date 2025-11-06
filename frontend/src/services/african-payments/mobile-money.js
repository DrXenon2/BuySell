/**
 * Service unifié de paiement Mobile Money pour Buysell
 * Abstraction commune pour MTN Money, Orange Money et Wave
 */

import mtnMoneyService from './mtn-money';
import orangeMoneyService from './orange-money';
import wavePaymentService from './wave-payment';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../../config/payment-methods';

class MobileMoneyService {
  constructor() {
    this.providers = {
      mtn_money: mtnMoneyService,
      orange_money: orangeMoneyService,
      wave: wavePaymentService
    };
    
    // Initialiser les services avec les configurations d'environnement
    this.initializeProviders();
  }

  /**
   * Initialiser tous les providers avec leurs configurations
   */
  initializeProviders() {
    try {
      Object.values(this.providers).forEach(provider => {
        if (typeof provider.initialize === 'function') {
          provider.initialize();
        }
      });
    } catch (error) {
      console.warn('Certains providers Mobile Money ne sont pas configurés:', error.message);
    }
  }

  /**
   * Traiter un paiement Mobile Money avec le provider approprié
   */
  async processPayment(paymentData) {
    const { provider, ...paymentInfo } = paymentData;

    try {
      const selectedProvider = this.providers[provider];
      if (!selectedProvider) {
        throw new Error(`Provider Mobile Money non supporté: ${provider}`);
      }

      // Valider le provider
      const providerValidation = this.validateProvider(provider, paymentInfo);
      if (!providerValidation.valid) {
        throw new Error(providerValidation.error);
      }

      // Traiter le paiement avec le provider sélectionné
      const result = await selectedProvider.processPayment(paymentInfo);

      // Enrichir le résultat avec des informations supplémentaires
      return {
        ...result,
        provider,
        providerName: this.getProviderName(provider),
        formattedAmount: this.formatAmount(paymentInfo.amount, paymentInfo.currency),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Erreur paiement ${provider}:`, error);
      return {
        success: false,
        provider,
        error: error.code || 'PROCESSING_ERROR',
        message: error.message || 'Erreur lors du traitement du paiement',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(provider, transactionId) {
    try {
      const selectedProvider = this.providers[provider];
      if (!selectedProvider) {
        throw new Error(`Provider non supporté: ${provider}`);
      }

      const result = await selectedProvider.checkPaymentStatus(transactionId);

      return {
        ...result,
        provider,
        providerName: this.getProviderName(provider)
      };

    } catch (error) {
      console.error(`Erreur vérification statut ${provider}:`, error);
      return {
        success: false,
        provider,
        error: error.code || 'STATUS_CHECK_ERROR',
        message: error.message || 'Erreur lors de la vérification du statut'
      };
    }
  }

  /**
   * Effectuer un remboursement
   */
  async processRefund(provider, refundData) {
    try {
      const selectedProvider = this.providers[provider];
      if (!selectedProvider) {
        throw new Error(`Provider non supporté: ${provider}`);
      }

      const result = await selectedProvider.processRefund(refundData);

      return {
        ...result,
        provider,
        providerName: this.getProviderName(provider)
      };

    } catch (error) {
      console.error(`Erreur remboursement ${provider}:`, error);
      return {
        success: false,
        provider,
        error: error.code || 'REFUND_ERROR',
        message: error.message || 'Erreur lors du remboursement'
      };
    }
  }

  /**
   * Valider un numéro de téléphone pour un provider spécifique
   */
  async validatePhoneNumber(provider, phoneNumber) {
    try {
      const selectedProvider = this.providers[provider];
      if (!selectedProvider) {
        throw new Error(`Provider non supporté: ${provider}`);
      }

      const result = await selectedProvider.validatePhoneNumber(phoneNumber);

      return {
        ...result,
        provider,
        providerName: this.getProviderName(provider)
      };

    } catch (error) {
      console.error(`Erreur validation numéro ${provider}:`, error);
      return {
        valid: false,
        provider,
        error: error.code || 'VALIDATION_ERROR',
        message: error.message || 'Erreur lors de la validation du numéro'
      };
    }
  }

  /**
   * Détecter automatiquement le provider d'un numéro de téléphone
   */
  async detectProvider(phoneNumber) {
    try {
      const providers = ['mtn_money', 'orange_money', 'wave'];
      const results = [];

      // Tester le numéro avec chaque provider
      for (const provider of providers) {
        const validation = await this.validatePhoneNumber(provider, phoneNumber);
        if (validation.valid) {
          results.push({
            provider,
            providerName: this.getProviderName(provider),
            valid: true,
            country: validation.country,
            network: validation.network
          });
        }
      }

      // Retourner le meilleur match
      if (results.length > 0) {
        // Préférer Orange pour les numéros Orange, MTN pour les numéros MTN, etc.
        const bestMatch = results.find(r => r.network === r.providerName) || results[0];
        return {
          success: true,
          detectedProvider: bestMatch.provider,
          providers: results,
          phoneNumber: this.formatPhoneNumber(phoneNumber)
        };
      } else {
        return {
          success: false,
          message: 'Aucun provider Mobile Money détecté pour ce numéro',
          phoneNumber: this.formatPhoneNumber(phoneNumber)
        };
      }

    } catch (error) {
      console.error('Erreur détection provider:', error);
      return {
        success: false,
        error: 'DETECTION_ERROR',
        message: 'Erreur lors de la détection du provider'
      };
    }
  }

  /**
   * Obtenir les frais pour un provider et un montant donné
   */
  calculateFees(provider, amount) {
    const method = PAYMENT_METHODS[provider.toUpperCase()];
    if (!method || !method.fees) return 0;
    
    return (amount * method.fees) / 100;
  }

  /**
   * Vérifier les limites de transaction pour un provider
   */
  checkTransactionLimits(provider, amount) {
    const method = PAYMENT_METHODS[provider.toUpperCase()];
    
    if (!method) {
      return { valid: false, error: 'Provider non reconnu' };
    }

    const issues = [];

    if (method.minAmount && amount < method.minAmount) {
      issues.push(`Montant minimum: ${method.minAmount} ${method.currencies[0]}`);
    }

    if (method.maxAmount && amount > method.maxAmount) {
      issues.push(`Montant maximum: ${method.maxAmount} ${method.currencies[0]}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      limits: {
        min: method.minAmount,
        max: method.maxAmount,
        currency: method.currencies[0]
      }
    };
  }

  /**
   * Obtenir les statistiques d'utilisation des providers
   */
  getProvidersStats() {
    const stats = {};
    
    Object.keys(this.providers).forEach(provider => {
      const method = PAYMENT_METHODS[provider.toUpperCase()];
      stats[provider] = {
        name: this.getProviderName(provider),
        enabled: method?.enabled || false,
        available: method?.available || false,
        countries: method?.countries || [],
        fees: method?.fees || 0,
        limits: {
          min: method?.minAmount,
          max: method?.maxAmount
        }
      };
    });

    return stats;
  }

  /**
   * Méthodes utilitaires
   */

  // Valider un provider pour un paiement donné
  validateProvider(provider, paymentData) {
    const method = PAYMENT_METHODS[provider.toUpperCase()];
    
    if (!method) {
      return { valid: false, error: 'Provider non reconnu' };
    }

    if (!method.enabled || !method.available) {
      return { valid: false, error: 'Provider non disponible' };
    }

    // Vérifier la devise
    if (!method.currencies.includes(paymentData.currency)) {
      return { valid: false, error: `Devise non supportée: ${paymentData.currency}` };
    }

    // Vérifier le pays
    const country = this.detectCountry(paymentData.phoneNumber);
    if (!method.countries.includes(country)) {
      return { valid: false, error: `Provider non disponible en ${country}` };
    }

    return { valid: true };
  }

  // Obtenir le nom lisible d'un provider
  getProviderName(provider) {
    const names = {
      mtn_money: 'MTN Money',
      orange_money: 'Orange Money',
      wave: 'Wave'
    };
    
    return names[provider] || provider;
  }

  // Formater un numéro de téléphone
  formatPhoneNumber(phoneNumber) {
    // Format standard pour l'Afrique de l'Ouest
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

  // Détecter le pays à partir du numéro
  detectCountry(phoneNumber) {
    const countryCodes = {
      '+225': 'CI', // Côte d'Ivoire
      '+221': 'SN', // Sénégal
      '+237': 'CM', // Cameroun
      '+223': 'ML', // Mali
      '+226': 'BF', // Burkina Faso
      '+224': 'GN'  // Guinée
    };

    for (const [code, country] of Object.entries(countryCodes)) {
      if (phoneNumber.includes(code)) {
        return country;
      }
    }

    return 'CI'; // Par défaut
  }

  // Formater un montant
  formatAmount(amount, currency = 'XOF') {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  }

  /**
   * Gestion des webhooks pour tous les providers
   */
  async handleWebhook(provider, webhookData) {
    try {
      const selectedProvider = this.providers[provider];
      if (!selectedProvider) {
        throw new Error(`Provider non supporté: ${provider}`);
      }

      // Traiter le webhook selon le provider
      // Cette méthode devrait être implémentée dans chaque provider
      const result = await selectedProvider.handleWebhook(webhookData);

      return {
        success: true,
        provider,
        processed: true,
        data: result
      };

    } catch (error) {
      console.error(`Erreur webhook ${provider}:`, error);
      return {
        success: false,
        provider,
        error: 'WEBHOOK_ERROR',
        message: error.message
      };
    }
  }
}

// Instance singleton
const mobileMoneyService = new MobileMoneyService();

export default mobileMoneyService;
