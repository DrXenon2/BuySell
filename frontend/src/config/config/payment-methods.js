/**
 * Configuration des méthodes de paiement Buysell
 * Support complet des paiements africains et internationaux
 */

export const PAYMENT_METHODS = {
  // ==================== ESPÈCE ====================
  CASH: {
    id: 'cash',
    name: 'Espèce',
    description: 'Paiement en espèces à la livraison',
    type: 'cash',
    logo: '/images/payments/cash.png',
    icon: '💵',
    enabled: true,
    available: true,
    fees: 0,
    currencies: ['XOF', 'XAF', 'EUR'],
    countries: ['CI', 'SN', 'CM', 'TG', 'BJ', 'ML', 'BF', 'GN', 'NE'],
    requirements: ['livraison_physique'],
    instructions: 'Préparez le montant exact pour le livreur',
    processingTime: 'instantané',
    riskLevel: 'medium',
    processor: 'cash'
  },

  // ==================== MOBILE MONEY ====================
  MTN_MONEY: {
    id: 'mtn_money',
    name: 'MTN Money',
    description: 'Paiement sécurisé via MTN Mobile Money',
    type: 'mobile_money',
    logo: '/images/payments/mtn-money.png',
    icon: '📱',
    enabled: true,
    available: true,
    fees: 1.5,
    currencies: ['XOF'],
    countries: ['CI', 'SN', 'CM', 'GH'],
    operator: 'MTN',
    instructions: 'Vous recevrez une demande de paiement sur votre mobile',
    processingTime: 'instantané',
    maxAmount: 500000,
    minAmount: 100,
    riskLevel: 'low',
    processor: 'mtn_money',
    apiConfig: {
      baseURL: 'https://api.mtn.com/v1',
      endpoints: {
        payment: '/collection',
        status: '/transaction',
        refund: '/refund'
      }
    }
  },

  ORANGE_MONEY: {
    id: 'orange_money',
    name: 'Orange Money',
    description: 'Paiement via Orange Money',
    type: 'mobile_money',
    logo: '/images/payments/orange-money.png',
    icon: '📱',
    enabled: true,
    available: true,
    fees: 1.5,
    currencies: ['XOF', 'XAF'],
    countries: ['CI', 'SN', 'CM', 'BF', 'ML', 'GN'],
    operator: 'Orange',
    instructions: 'Confirmez le paiement via votre application Orange Money',
    processingTime: 'instantané',
    maxAmount: 500000,
    minAmount: 100,
    riskLevel: 'low',
    processor: 'orange_money',
    apiConfig: {
      baseURL: 'https://api.orange.com/orangemoney',
      endpoints: {
        payment: '/payment',
        status: '/transaction',
        refund: '/refund'
      }
    }
  },

  WAVE: {
    id: 'wave',
    name: 'Wave',
    description: 'Paiement mobile avec Wave',
    type: 'mobile_money',
    logo: '/images/payments/wave.png',
    icon: '📱',
    enabled: true,
    available: true,
    fees: 1,
    currencies: ['XOF'],
    countries: ['CI', 'SN'],
    operator: 'Wave',
    instructions: 'Scannez le code QR ou entrez votre numéro Wave',
    processingTime: 'instantané',
    maxAmount: 1000000,
    minAmount: 100,
    riskLevel: 'low',
    processor: 'wave',
    apiConfig: {
      baseURL: 'https://api.wave.com/v1',
      endpoints: {
        payment: '/charges',
        status: '/charges/{id}',
        refund: '/refunds'
      }
    }
  },

  // ==================== CARTES BANCAIRES ====================
  VISA: {
    id: 'visa',
    name: 'Visa',
    description: 'Paiement sécurisé par carte Visa',
    type: 'card',
    logo: '/images/payments/visa.png',
    icon: '💳',
    enabled: true,
    available: true,
    fees: 2.5,
    currencies: ['XOF', 'XAF', 'EUR', 'USD'],
    countries: ['CI', 'SN', 'CM', 'FR', 'BE', 'US'],
    processor: 'stripe',
    instructions: 'Entrez les détails de votre carte Visa',
    processingTime: 'instantané',
    secure3d: true,
    riskLevel: 'low'
  },

  MASTERCARD: {
    id: 'mastercard',
    name: 'Mastercard',
    description: 'Paiement sécurisé par carte Mastercard',
    type: 'card',
    logo: '/images/payments/mastercard.png',
    icon: '💳',
    enabled: true,
    available: true,
    fees: 2.5,
    currencies: ['XOF', 'XAF', 'EUR', 'USD'],
    countries: ['CI', 'SN', 'CM', 'FR', 'BE', 'US'],
    processor: 'stripe',
    instructions: 'Entrez les détails de votre carte Mastercard',
    processingTime: 'instantané',
    secure3d: true,
    riskLevel: 'low'
  },

  // ==================== PAIEMENTS EN LIGNE ====================
  STRIPE: {
    id: 'stripe',
    name: 'Carte Bancaire',
    description: 'Paiement sécurisé Stripe (Visa, Mastercard, etc.)',
    type: 'online',
    logo: '/images/payments/stripe.png',
    icon: '🌐',
    enabled: true,
    available: true,
    fees: 2.9,
    currencies: ['USD', 'EUR', 'GBP'],
    countries: ['FR', 'BE', 'US', 'GB', 'DE'],
    processor: 'stripe',
    instructions: 'Paiement 100% sécurisé avec chiffrement SSL',
    processingTime: 'instantané',
    secure3d: true,
    riskLevel: 'low'
  },

  // ==================== AUTRES MÉTHODES ====================
  BANK_TRANSFER: {
    id: 'bank_transfer',
    name: 'Virement Bancaire',
    description: 'Virement bancaire traditionnel',
    type: 'bank',
    logo: '/images/payments/bank-transfer.png',
    icon: '🏦',
    enabled: true,
    available: true,
    fees: 0,
    currencies: ['XOF', 'XAF', 'EUR', 'USD'],
    countries: ['CI', 'SN', 'CM', 'FR', 'BE'],
    instructions: 'Effectuez le virement sur notre compte bancaire',
    processingTime: '24-48h',
    riskLevel: 'medium',
    processor: 'bank_transfer'
  },

  BUYSELL_WALLET: {
    id: 'buysell_wallet',
    name: 'Portefeuille Buysell',
    description: 'Paiement avec votre solde Buysell',
    type: 'wallet',
    logo: '/images/payments/buysell-wallet.png',
    icon: '👛',
    enabled: true,
    available: true,
    fees: 0,
    currencies: ['XOF'],
    countries: ['CI', 'SN', 'CM'],
    instructions: 'Utilisez votre solde Buysell pour payer',
    processingTime: 'instantané',
    riskLevel: 'low',
    processor: 'buysell_wallet'
  }
};

// Groupes de méthodes de paiement
export const PAYMENT_METHOD_GROUPS = {
  MOBILE_MONEY: {
    name: 'Mobile Money',
    methods: ['mtn_money', 'orange_money', 'wave'],
    popular: true,
    icon: '📱'
  },
  CARDS: {
    name: 'Cartes Bancaires',
    methods: ['visa', 'mastercard', 'stripe'],
    popular: true,
    icon: '💳'
  },
  CASH: {
    name: 'Paiement Espèce',
    methods: ['cash'],
    popular: true,
    icon: '💵'
  },
  OTHER: {
    name: 'Autres Méthodes',
    methods: ['bank_transfer', 'buysell_wallet'],
    icon: '🏦'
  }
};

// Configuration par pays
export const PAYMENT_METHODS_BY_COUNTRY = {
  CI: {
    available: ['cash', 'mtn_money', 'orange_money', 'wave', 'visa', 'mastercard', 'buysell_wallet', 'bank_transfer'],
    popular: ['cash', 'mtn_money', 'orange_money', 'wave'],
    default: 'cash',
    currency: 'XOF'
  },
  SN: {
    available: ['cash', 'orange_money', 'wave', 'visa', 'mastercard', 'buysell_wallet', 'bank_transfer'],
    popular: ['cash', 'orange_money', 'wave'],
    default: 'cash',
    currency: 'XOF'
  },
  CM: {
    available: ['cash', 'orange_money', 'visa', 'mastercard', 'bank_transfer'],
    popular: ['cash', 'orange_money'],
    default: 'cash',
    currency: 'XAF'
  },
  FR: {
    available: ['visa', 'mastercard', 'stripe', 'bank_transfer'],
    popular: ['visa', 'mastercard'],
    default: 'stripe',
    currency: 'EUR'
  },
  US: {
    available: ['visa', 'mastercard', 'stripe'],
    popular: ['stripe'],
    default: 'stripe',
    currency: 'USD'
  }
};

// Configuration des processeurs de paiement
export const PAYMENT_PROCESSORS = {
  stripe: {
    name: 'Stripe',
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supportedMethods: ['visa', 'mastercard', 'stripe'],
    config: {
      apiVersion: '2023-10-16'
    }
  },
  mtn_money: {
    name: 'MTN Mobile Money',
    apiKey: process.env.MTN_MONEY_API_KEY,
    merchantCode: process.env.MTN_MERCHANT_CODE,
    secretKey: process.env.MTN_SECRET_KEY,
    supportedMethods: ['mtn_money'],
    config: {
      baseURL: 'https://api.mtn.com/v1',
      timeout: 30000
    }
  },
  orange_money: {
    name: 'Orange Money',
    apiKey: process.env.ORANGE_MONEY_API_KEY,
    merchantCode: process.env.ORANGE_MERCHANT_CODE,
    secretKey: process.env.ORANGE_SECRET_KEY,
    supportedMethods: ['orange_money'],
    config: {
      baseURL: 'https://api.orange.com/orangemoney',
      timeout: 30000
    }
  },
  wave: {
    name: 'Wave',
    apiKey: process.env.WAVE_API_KEY,
    merchantCode: process.env.WAVE_MERCHANT_CODE,
    secretKey: process.env.WAVE_SECRET_KEY,
    supportedMethods: ['wave'],
    config: {
      baseURL: 'https://api.wave.com/v1',
      timeout: 30000
    }
  },
  bank_transfer: {
    name: 'Virement Bancaire',
    supportedMethods: ['bank_transfer'],
    config: {
      bankName: 'ECOBANK',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      accountName: 'BUYSELL CI'
    }
  },
  buysell_wallet: {
    name: 'Portefeuille Buysell',
    supportedMethods: ['buysell_wallet'],
    config: {
      minBalance: 0,
      autoTopUp: true
    }
  },
  cash: {
    name: 'Espèce',
    supportedMethods: ['cash'],
    config: {
      requiresDelivery: true
    }
  }
};

// Statuts de paiement
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

// Codes d'erreur de paiement
export const PAYMENT_ERRORS = {
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_CARD: 'invalid_card',
  EXPIRED_CARD: 'expired_card',
  TRANSACTION_DECLINED: 'transaction_declined',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  INVALID_AMOUNT: 'invalid_amount',
  DUPLICATE_TRANSACTION: 'duplicate_transaction'
};

// Helper functions
export const getPaymentMethod = (methodId) => {
  return PAYMENT_METHODS[methodId.toUpperCase()];
};

export const getAvailablePaymentMethods = (country = 'CI', amount = 0) => {
  const countryMethods = PAYMENT_METHODS_BY_COUNTRY[country]?.available || 
                        PAYMENT_METHODS_BY_COUNTRY.CI.available;
  
  return countryMethods
    .map(methodId => PAYMENT_METHODS[methodId.toUpperCase()])
    .filter(method => method && method.enabled && method.available)
    .filter(method => {
      // Filtrer par montant minimum/maximum
      if (method.minAmount && amount < method.minAmount) return false;
      if (method.maxAmount && amount > method.maxAmount) return false;
      return true;
    });
};

export const getPopularPaymentMethods = (country = 'CI') => {
  const popularIds = PAYMENT_METHODS_BY_COUNTRY[country]?.popular || 
                    PAYMENT_METHODS_BY_COUNTRY.CI.popular;
  
  return popularIds
    .map(methodId => PAYMENT_METHODS[methodId.toUpperCase()])
    .filter(method => method && method.enabled && method.available);
};

export const getDefaultPaymentMethod = (country = 'CI') => {
  const defaultId = PAYMENT_METHODS_BY_COUNTRY[country]?.default || 
                   PAYMENT_METHODS_BY_COUNTRY.CI.default;
  
  return PAYMENT_METHODS[defaultId.toUpperCase()];
};

export const calculatePaymentFees = (amount, methodId) => {
  const method = getPaymentMethod(methodId);
  if (!method || !method.fees) return 0;
  
  return (amount * method.fees) / 100;
};

export const getPaymentMethodGroups = (country = 'CI') => {
  const availableMethods = getAvailablePaymentMethods(country);
  const availableIds = availableMethods.map(m => m.id);
  
  const groups = {};
  
  Object.entries(PAYMENT_METHOD_GROUPS).forEach(([groupId, group]) => {
    const groupMethods = group.methods
      .map(methodId => PAYMENT_METHODS[methodId.toUpperCase()])
      .filter(method => method && availableIds.includes(method.id));
    
    if (groupMethods.length > 0) {
      groups[groupId] = {
        ...group,
        methods: groupMethods
      };
    }
  });
  
  return groups;
};

// Validation
export const validatePaymentMethod = (methodId, country, amount) => {
  const method = getPaymentMethod(methodId);
  if (!method) return { valid: false, error: 'Méthode de paiement invalide' };
  
  if (!method.enabled || !method.available) {
    return { valid: false, error: 'Méthode de paiement non disponible' };
  }
  
  if (!method.countries.includes(country)) {
    return { valid: false, error: 'Méthode non disponible dans votre pays' };
  }
  
  if (method.minAmount && amount < method.minAmount) {
    return { valid: false, error: `Montant minimum: ${method.minAmount}` };
  }
  
  if (method.maxAmount && amount > method.maxAmount) {
    return { valid: false, error: `Montant maximum: ${method.maxAmount}` };
  }
  
  return { valid: true, method };
};

// Formatage des montants
export const formatAmount = (amount, currency = 'XOF') => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
};

// Conversion de devises (simplifiée)
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  const rates = {
    XOF: { EUR: 0.00152, USD: 0.00167 },
    XAF: { EUR: 0.00152, USD: 0.00167 },
    EUR: { XOF: 655.957, XAF: 655.957, USD: 1.10 },
    USD: { XOF: 599.0, XAF: 599.0, EUR: 0.91 }
  };
  
  if (fromCurrency === toCurrency) return amount;
  if (rates[fromCurrency] && rates[fromCurrency][toCurrency]) {
    return amount * rates[fromCurrency][toCurrency];
  }
  
  return amount; // Fallback
};

export default PAYMENT_METHODS;
