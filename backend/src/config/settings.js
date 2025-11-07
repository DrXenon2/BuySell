/**
 * Paramètres et fonctionnalités de l'application
 */

const settings = {
  // Fonctionnalités activées
  features: {
    // Système multi-vendeur
    multiVendor: process.env.FEATURE_MULTI_VENDOR === 'true' || true,
    
    // Paiements mobiles
    mobilePayments: process.env.FEATURE_MOBILE_PAYMENTS === 'true' || true,
    
    // Produits d'occasion
    secondHand: process.env.FEATURE_SECOND_HAND === 'true' || true,
    
    // Système de review
    reviews: process.env.FEATURE_REVIEWS === 'true' || true,
    
    // Wishlist
    wishlist: process.env.FEATURE_WISHLIST === 'true' || true,
    
    // Comparaison de produits
    productComparison: process.env.FEATURE_PRODUCT_COMPARISON === 'true' || true,
    
    // Notifications en temps réel
    realtimeNotifications: process.env.FEATURE_REALTIME_NOTIFICATIONS === 'true' || true,
    
    // Analytics avancées
    advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true' || true,
    
    // Système de coupons
    coupons: process.env.FEATURE_COUPONS === 'true' || true,
    
    // Livraison multiple
    multipleShipping: process.env.FEATURE_MULTIPLE_SHIPPING === 'true' || true
  },
  
  // Paramètres de paiement
  payments: {
    stripe: {
      enabled: process.env.STRIPE_ENABLED === 'true' || false,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY
    },
    mobileMoney: {
      enabled: process.env.MOBILE_MONEY_ENABLED === 'true' || true,
      providers: ['orange_money', 'mtn_money', 'wave']
    },
    currency: process.env.DEFAULT_CURRENCY || 'XOF',
    testMode: process.env.PAYMENT_TEST_MODE === 'true' || true
  },
  
  // Paramètres d'email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'resend',
    from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
    support: process.env.EMAIL_SUPPORT || 'support@buysell.africa'
  },
  
  // Paramètres d'upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ],
    storage: process.env.UPLOAD_STORAGE || 'local' // local, s3, supabase
  },
  
  // Paramètres de notification
  notifications: {
    email: true,
    push: process.env.PUSH_NOTIFICATIONS === 'true' || false,
    sms: process.env.SMS_NOTIFICATIONS === 'true' || false
  },
  
  // Configuration SEO
  seo: {
    siteName: 'BuySell Africa',
    defaultTitle: 'Marketplace Africain - Achetez et Vendez en Toute Sécurité',
    defaultDescription: 'La plus grande plateforme de commerce en ligne en Afrique. Achetez neuf et d\'occasion, vendez vos produits en toute sécurité.',
    keywords: ['afrique', 'ecommerce', 'marketplace', 'achat', 'vente', 'occasion']
  }
};

// Helper pour vérifier les fonctionnalités
settings.hasFeature = (featureName) => {
  return settings.features[featureName] === true;
};

// Helper pour obtenir les paramètres
settings.get = (path, defaultValue = null) => {
  const keys = path.split('.');
  let value = settings;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

module.exports = settings;
