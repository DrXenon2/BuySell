/**
 * Configuration des paramètres de l'application
 */

export const APP_SETTINGS = {
  // Paramètres d'affichage
  display: {
    theme: {
      default: 'light',
      options: ['light', 'dark', 'system'],
    },
    language: {
      default: 'fr',
      supported: ['fr', 'en', 'es', 'ar'],
    },
    currency: {
      default: 'EUR',
      supported: ['EUR', 'USD', 'GBP', 'CAD', 'XOF', 'CHF'],
    },
    dateFormat: {
      default: 'fr-FR',
      options: ['fr-FR', 'en-US', 'en-GB'],
    },
    timezone: {
      default: 'Europe/Paris',
    },
  },

  // Paramètres de notification
  notifications: {
    email: {
      orders: true,
      promotions: true,
      newsletter: false,
      security: true,
    },
    push: {
      orders: true,
      promotions: false,
      messages: true,
    },
    inApp: {
      orders: true,
      reviews: true,
      messages: true,
    },
  },

  // Paramètres de confidentialité
  privacy: {
    profileVisibility: {
      default: 'public',
      options: ['public', 'private', 'friends'],
    },
    dataSharing: {
      analytics: true,
      personalizedAds: false,
      thirdParty: false,
    },
    searchVisibility: {
      default: true,
    },
  },

  // Paramètres de sécurité
  security: {
    twoFactorAuth: {
      enabled: false,
      methods: ['email', 'authenticator'],
    },
    sessionTimeout: 30, // minutes
    loginAlerts: true,
  },

  // Paramètres de livraison
  shipping: {
    defaultAddress: null,
    preferredMethod: 'standard',
    saveAddresses: true,
  },

  // Paramètres de paiement
  payment: {
    defaultMethod: 'card',
    saveCards: false,
    autoFill: true,
  },
};

// Paramètres par défaut pour les nouveaux utilisateurs
export const DEFAULT_USER_SETTINGS = {
  display: {
    theme: APP_SETTINGS.display.theme.default,
    language: APP_SETTINGS.display.language.default,
    currency: APP_SETTINGS.display.currency.default,
    dateFormat: APP_SETTINGS.display.dateFormat.default,
    timezone: APP_SETTINGS.display.timezone.default,
  },
  notifications: {
    email: APP_SETTINGS.notifications.email,
    push: APP_SETTINGS.notifications.push,
    inApp: APP_SETTINGS.notifications.inApp,
  },
  privacy: {
    profileVisibility: APP_SETTINGS.privacy.profileVisibility.default,
    dataSharing: APP_SETTINGS.privacy.dataSharing,
    searchVisibility: APP_SETTINGS.privacy.searchVisibility.default,
  },
  security: {
    twoFactorAuth: APP_SETTINGS.security.twoFactorAuth,
    sessionTimeout: APP_SETTINGS.security.sessionTimeout,
    loginAlerts: APP_SETTINGS.security.loginAlerts,
  },
  shipping: {
    defaultAddress: APP_SETTINGS.shipping.defaultAddress,
    preferredMethod: APP_SETTINGS.shipping.preferredMethod,
    saveAddresses: APP_SETTINGS.shipping.saveAddresses,
  },
  payment: {
    defaultMethod: APP_SETTINGS.payment.defaultMethod,
    saveCards: APP_SETTINGS.payment.saveCards,
    autoFill: APP_SETTINGS.payment.autoFill,
  },
};

// Configuration des fonctionnalités par rôle
export const FEATURE_ACCESS = {
  [USER_ROLES.CUSTOMER]: [
    'view_products',
    'purchase_products',
    'write_reviews',
    'create_wishlist',
    'track_orders',
    'manage_profile',
  ],
  [USER_ROLES.SELLER]: [
    'view_products',
    'purchase_products',
    'write_reviews',
    'create_wishlist',
    'track_orders',
    'manage_profile',
    'manage_products',
    'manage_orders',
    'view_analytics',
    'manage_inventory',
  ],
  [USER_ROLES.ADMIN]: [
    'view_products',
    'purchase_products',
    'write_reviews',
    'create_wishlist',
    'track_orders',
    'manage_profile',
    'manage_products',
    'manage_orders',
    'view_analytics',
    'manage_inventory',
    'manage_users',
    'manage_categories',
    'manage_settings',
    'view_reports',
    'moderate_content',
  ],
};

export default APP_SETTINGS;
