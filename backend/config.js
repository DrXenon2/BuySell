require('dotenv').config();
const path = require('path');

// Validation des variables d'environnement requises
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes: ${missingEnvVars.join(', ')}. ` +
    'Veuillez vérifier votre fichier .env'
  );
}

const config = {
  // =============================================
  // ENVIRONNEMENT ET SERVEUR
  // =============================================
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || 'localhost',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    trustProxy: process.env.TRUST_PROXY === 'true',
    cluster: {
      enabled: process.env.CLUSTER_MODE === 'true',
      maxWorkers: parseInt(process.env.MAX_WORKERS) || 4
    }
  },

  // =============================================
  // APPLICATION
  // =============================================
  app: {
    name: process.env.APP_NAME || 'BuySell Platform',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Marketplace Backend API',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@buysell.com',
    contactEmail: process.env.CONTACT_EMAIL || 'contact@buysell.com'
  },

  // =============================================
  // SUPABASE (Base de données)
  // =============================================
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    schema: process.env.SUPABASE_SCHEMA || 'public',
    debug: process.env.SUPABASE_DEBUG === 'true'
  },

  // =============================================
  // AUTHENTIFICATION JWT
  // =============================================
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'buysell-platform',
      audience: process.env.JWT_AUDIENCE || 'buysell-users'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    },
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    loginLockoutTime: parseInt(process.env.LOGIN_LOCKOUT_TIME) || 900000, // 15 minutes
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    enable2FA: process.env.ENABLE_2FA === 'true',
    enableSocialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true'
  },

  // =============================================
  // SÉCURITÉ
  // =============================================
  security: {
    cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,
    csrfProtection: process.env.CSRF_PROTECTION !== 'false',
    xssProtection: true,
    contentSecurityPolicy: true,
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireStrong: process.env.REQUIRE_STRONG_PASSWORD === 'true'
    },
    session: {
      timeout: parseInt(process.env.SESSION_TIMEOUT) || 86400000 // 24 heures
    }
  },

  // =============================================
  // CORS
  // =============================================
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://yourdomain.com'
      ].filter(Boolean);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-Request-ID'
    ],
    maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400
  },

  // =============================================
  // RATE LIMITING
  // =============================================
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 
      parseInt(process.env.RATE_LIMIT_MAX) || 100 : 
      parseInt(process.env.RATE_LIMIT_MAX) || 1000,
    skipSuccessful: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
    skipFailed: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
  },

  // =============================================
  // UPLOAD ET STOCKAGE
  // =============================================
  upload: {
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'),
    tempDir: process.env.TEMP_DIR || path.join(__dirname, 'temp'),
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      'application/pdf'
    ],
    image: {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 80
    }
  },

  // =============================================
  // STRIPE (Paiements)
  // =============================================
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/checkout/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/checkout/cancel'
  },

  // =============================================
  // EMAIL (Resend)
  // =============================================
  email: {
    provider: process.env.EMAIL_PROVIDER || 'resend',
    from: process.env.EMAIL_FROM || 'noreply@buysell.com',
    fromName: process.env.EMAIL_FROM_NAME || 'BuySell Platform',
    resend: {
      apiKey: process.env.RESEND_API_KEY
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_SES_REGION || 'us-east-1'
    }
  },

  // =============================================
  // CLOUDINARY (Images)
  // =============================================
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'buysell-platform',
    secure: process.env.CLOUDINARY_SECURE !== 'false'
  },

  // =============================================
  // REDIS (Cache et Sessions)
  // =============================================
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'buysell:',
    ttl: parseInt(process.env.REDIS_TTL) || 3600
  },

  // =============================================
  // LOGGING
  // =============================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(__dirname, 'logs'),
    maxFiles: process.env.LOG_MAX_FILES || '30d',
    maxSize: process.env.LOG_MAX_SIZE || '100m',
    format: process.env.LOG_FORMAT || 'json',
    colorize: process.env.LOG_COLORIZE !== 'false'
  },

  // =============================================
  // CACHE
  // =============================================
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    prefix: process.env.CACHE_PREFIX || 'buysell:cache:',
    compression: process.env.CACHE_COMPRESSION !== 'false'
  },

  // =============================================
  // RÈGLES MÉTIER
  // =============================================
  business: {
    commission: {
      rate: parseFloat(process.env.COMMISSION_RATE) || 0.05,
      minimum: parseFloat(process.env.COMMISSION_MINIMUM) || 0.50
    },
    tax: {
      rate: parseFloat(process.env.TAX_RATE) || 0.18,
      included: process.env.TAX_INCLUDED === 'true'
    },
    shipping: {
      freeThreshold: parseInt(process.env.FREE_SHIPPING_THRESHOLD) || 50000,
      defaultCost: parseInt(process.env.DEFAULT_SHIPPING_COST) || 500
    },
    inventory: {
      lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10,
      criticalStockThreshold: parseInt(process.env.CRITICAL_STOCK_THRESHOLD) || 3,
      allowBackorders: process.env.ALLOW_BACKORDERS === 'true'
    },
    limits: {
      maxCartItems: parseInt(process.env.MAX_CART_ITEMS) || 50,
      maxOrderItems: parseInt(process.env.MAX_ORDER_ITEMS) || 100,
      maxProductImages: parseInt(process.env.MAX_PRODUCT_IMAGES) || 5,
      maxReviewImages: parseInt(process.env.MAX_REVIEW_IMAGES) || 3,
      maxWishlistItems: parseInt(process.env.MAX_WISHLIST_ITEMS) || 100
    }
  },

  // =============================================
  // FONCTIONNALITÉS
  // =============================================
  features: {
    enableReviews: process.env.ENABLE_PRODUCT_REVIEWS !== 'false',
    enableWishlist: process.env.ENABLE_WISHLIST !== 'false',
    enableCompare: process.env.ENABLE_PRODUCT_COMPARE === 'true',
    enableSellerDashboard: process.env.ENABLE_SELLER_DASHBOARD !== 'false',
    enableAdminPanel: process.env.ENABLE_ADMIN_PANEL !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
    enableRealtime: process.env.ENABLE_REALTIME_NOTIFICATIONS !== 'false',
    enableSearchIndexing: process.env.ENABLE_SEARCH_INDEXING === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true'
  },

  // =============================================
// DOCUMENTATION SWAGGER
// =============================================
docs: {
  enabled: process.env.SWAGGER_ENABLED !== 'false',
  route: process.env.SWAGGER_ROUTE || '/api/docs',
  auth: {
    enabled: process.env.SWAGGER_AUTH_ENABLED === 'true',
    username: process.env.SWAGGER_USERNAME || 'admin',
    password: process.env.SWAGGER_PASSWORD || 'buysell2024'
  },
  options: {
    explorer: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BuySell Platform API Docs'
  }
},
  // =============================================
  // JOBS ET TÂCHES PLANIFIÉES
  // =============================================
  jobs: {
    cleanup: {
      interval: process.env.CLEANUP_INTERVAL || '0 2 * * *', // Tous les jours à 2h
      enabled: process.env.ENABLE_CLEANUP_JOBS !== 'false'
    },
    backup: {
      interval: process.env.BACKUP_INTERVAL || '0 3 * * 0', // Tous les dimanches à 3h
      enabled: process.env.ENABLE_BACKUP_JOBS !== 'false'
    },
    analytics: {
      interval: process.env.ANALYTICS_INTERVAL || '0 1 * * *', // Tous les jours à 1h
      enabled: process.env.ENABLE_ANALYTICS_JOBS !== 'false'
    },
    email: {
      interval: process.env.EMAIL_QUEUE_INTERVAL || '*/5 * * * *', // Toutes les 5 minutes
      enabled: process.env.ENABLE_EMAIL_JOBS !== 'false'
    },
    notifications: {
      cartAbandonment: {
        interval: process.env.CART_ABANDONMENT_INTERVAL || '0 * * * *', // Toutes les heures
        enabled: process.env.NOTIFY_ABANDONED_CART === 'true'
      },
      stockAlert: {
        interval: process.env.STOCK_ALERT_INTERVAL || '*/30 * * * *', // Toutes les 30 minutes
        enabled: process.env.NOTIFY_LOW_STOCK === 'true'
      }
    }
  },

  // =============================================
  // MONITORING ET ANALYTICS
  // =============================================
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    sentry: {
      dsn: process.env.SENTRY_DSN
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY
    }
  },

  // =============================================
  // APIS EXTERNES
  // =============================================
  apis: {
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    sendGrid: {
      apiKey: process.env.SENDGRID_API_KEY
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  }
};

// Configuration spécifique à l'environnement
if (config.env === 'production') {
  // Optimisations pour la production
  config.rateLimit.max = config.rateLimit.max || 100;
  config.server.trustProxy = true;
  config.logging.level = 'warn';
  config.cache.enabled = true;
} else if (config.env === 'development') {
  // Optimisations pour le développement
  config.rateLimit.max = 1000;
  config.logging.level = 'debug';
  config.logging.colorize = true;
} else if (config.env === 'test') {
  // Optimisations pour les tests
  config.rateLimit.max = 10000;
  config.logging.level = 'error';
  config.cache.enabled = false;
}

module.exports = config;

