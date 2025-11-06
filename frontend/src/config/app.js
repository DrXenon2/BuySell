/**
 * Configuration principale de l'application
 */

export const APP_CONFIG = {
  // Informations de base
  name: 'BuySell Platform',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  
  // URLs de l'application
  urls: {
    frontend: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
    backend: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
    cdn: process.env.NEXT_PUBLIC_CDN_URL || '',
  },

  // Fonctionnalités de l'application
  features: {
    auth: true,
    cart: true,
    search: true,
    reviews: true,
    wishlist: true,
    compare: true,
    notifications: true,
    multiVendor: true,
    coupons: true,
    shipping: true,
    taxes: true,
  },

  // Paramètres d'affichage
  display: {
    productsPerPage: 24,
    maxProductsInCart: 10,
    maxProductImages: 5,
    searchDebounce: 500, // ms
    autoSaveDelay: 1000, // ms
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // Paramètres de performance
  performance: {
    imageOptimization: true,
    lazyLoading: true,
    cacheEnabled: true,
    preloadCritical: true,
  },

  // Paramètres SEO
  seo: {
    defaultTitle: 'BuySell Platform - Marketplace Moderne',
    defaultDescription: 'Plateforme de marketplace moderne avec système de vente entre particuliers et professionnels',
    social: {
      twitter: '@buysellplatform',
      facebook: 'buysellplatform',
    },
  },

  // Support
  support: {
    email: 'support@buysell.com',
    phone: '+33 1 23 45 67 89',
    workingHours: 'Lun-Ven: 9h-18h',
  },
};

// Configuration par environnement
export const ENV_CONFIG = {
  development: {
    debug: true,
    logLevel: 'debug',
    apiCache: false,
    analytics: false,
  },
  production: {
    debug: false,
    logLevel: 'error',
    apiCache: true,
    analytics: true,
  },
  test: {
    debug: true,
    logLevel: 'silent',
    apiCache: false,
    analytics: false,
  },
};

export default APP_CONFIG;
