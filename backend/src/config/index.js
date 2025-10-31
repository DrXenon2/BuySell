const dotenv = require('dotenv');
const path = require('path');

// Chargement des variables d'environnement
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,

  // URL de l'application
  app: {
    name: process.env.APP_NAME || 'BuySell Platform',
    url: process.env.APP_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Base de données Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    dbUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  },

  // Authentification JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'buysell-platform',
    audience: process.env.JWT_AUDIENCE || 'buysell-users',
  },

  // Stripe Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/checkout/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/checkout/cancel',
  },

  // Cloudinary pour les images
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'buysell-platform',
  },

  // Email (Resend)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'resend',
    from: process.env.EMAIL_FROM || 'noreply@buysell.com',
    resendApiKey: process.env.RESEND_API_KEY,
  },

  // Upload et stockage
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // Redis pour le cache et les sessions
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limite par IP
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
  },

  // Monitoring et analytics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Fonctionnalités
  features: {
    emailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    twoFactorAuth: process.env.ENABLE_2FA === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    advancedAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  },
};

// Validation de la configuration
const validateConfig = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }

  // Validation spécifique par environnement
  if (config.env === 'production') {
    const productionRequired = [
      'STRIPE_SECRET_KEY',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];

    const productionMissing = productionRequired.filter(key => !process.env[key]);
    
    if (productionMissing.length > 0) {
      console.warn('⚠️  Variables de production manquantes:', productionMissing.join(', '));
    }
  }

  console.log('✅ Configuration validée avec succès');
};

// Exécuter la validation
validateConfig();

module.exports = config;
