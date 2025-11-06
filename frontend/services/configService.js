class ConfigService {
  constructor() {
    this.config = {};
    this.initializeConfig();
  }

  // Initialiser la configuration
  initializeConfig() {
    this.config = {
      // URLs de l'API
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
        timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
      },

      // Supabase
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },

      // Stripe
      stripe: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },

      // Upload
      upload: {
        maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 5242880,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxFiles: parseInt(process.env.NEXT_PUBLIC_MAX_FILES) || 10,
      },

      // Application
      app: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'BuySell Platform',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
        supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@buysell.com',
      },

      // Fonctionnalités
      features: {
        enableReviews: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_REVIEWS, true),
        enableWishlist: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_WISHLIST, true),
        enableCompare: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_COMPARE, true),
        enableSocialLogin: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN, false),
        enablePushNotifications: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS, true),
        enableAnalytics: this.parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, true),
      },

      // Règles métier
      business: {
        commissionRate: parseFloat(process.env.NEXT_PUBLIC_COMMISSION_RATE) || 0.05,
        taxRate: parseFloat(process.env.NEXT_PUBLIC_TAX_RATE) || 0.18,
        freeShippingThreshold: parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 50000,
        lowStockThreshold: parseInt(process.env.NEXT_PUBLIC_LOW_STOCK_THRESHOLD) || 10,
        maxCartItems: parseInt(process.env.NEXT_PUBLIC_MAX_CART_ITEMS) || 50,
      },

      // UI/UX
      ui: {
        theme: process.env.NEXT_PUBLIC_THEME || 'light',
        language: process.env.NEXT_PUBLIC_LANGUAGE || 'fr',
        currency: process.env.NEXT_PUBLIC_CURRENCY || 'EUR',
        dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'DD/MM/YYYY',
        timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/Paris',
      },

      // Analytics
      analytics: {
        ga4Id: process.env.NEXT_PUBLIC_GA4_ID,
        hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
        facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      },
    };
  }

  // Parser les valeurs booléennes
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value === 'true' || value === true;
  }

  // Obtenir toute la configuration
  getAll() {
    return this.config;
  }

  // Obtenir une section de configuration
  get(section, key = null) {
    if (!key) {
      return this.config[section] || null;
    }
    return this.config[section]?.[key] || null;
  }

  // Mettre à jour la configuration
  set(section, key, value) {
    if (!this.config[section]) {
      this.config[section] = {};
    }
    this.config[section][key] = value;
  }

  // Vérifier si une fonctionnalité est activée
  isFeatureEnabled(feature) {
    return this.config.features?.[feature] || false;
  }

  // Obtenir la configuration de l'API
  getApiConfig() {
    return this.config.api;
  }

  // Obtenir la configuration Supabase
  getSupabaseConfig() {
    return this.config.supabase;
  }

  // Obtenir la configuration Stripe
  getStripeConfig() {
    return this.config.stripe;
  }

  // Obtenir la configuration d'upload
  getUploadConfig() {
    return this.config.upload;
  }

  // Obtenir les règles métier
  getBusinessRules() {
    return this.config.business;
  }

  // Obtenir la configuration UI/UX
  getUiConfig() {
    return this.config.ui;
  }

  // Formater le prix selon la devise
  formatPrice(amount) {
    const currency = this.config.ui.currency;
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });

    return formatter.format(amount);
  }

  // Formater la date
  formatDate(date, format = null) {
    const dateObj = new Date(date);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    return dateObj.toLocaleDateString('fr-FR', options);
  }

  // Formater la date et heure
  formatDateTime(date) {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Valider un fichier selon la configuration
  validateFile(file) {
    const uploadConfig = this.getUploadConfig();
    const errors = [];

    // Vérifier la taille
    if (file.size > uploadConfig.maxFileSize) {
      errors.push(`Le fichier est trop volumineux (max: ${uploadConfig.maxFileSize / 1024 / 1024}MB)`);
    }

    // Vérifier le type
    if (!uploadConfig.allowedTypes.includes(file.type)) {
      errors.push('Type de fichier non supporté');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Obtenir l'URL complète de l'API
  getApiUrl(endpoint = '') {
    const baseUrl = this.config.api.baseUrl;
    return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
  }

  // Vérifier si on est en développement
  isDevelopment() {
    return this.config.app.environment === 'development';
  }

  // Vérifier si on est en production
  isProduction() {
    return this.config.app.environment === 'production';
  }

  // Recharger la configuration
  reload() {
    this.initializeConfig();
  }
}

// Instance singleton
const configService = new ConfigService();

export default configService;
