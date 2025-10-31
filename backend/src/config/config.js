import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement des variables d'environnement
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'production' ? '.env.production' : '.env.development';

dotenv.config({ 
  path: path.resolve(process.cwd(), envFile) 
});

// Configuration principale
const config = {
  // Environnement
  env,
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  isStaging: env === 'staging',
  isTest: env === 'test',

  // Serveur
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
    trustProxy: process.env.TRUST_PROXY === 'true',
    clusterMode: process.env.CLUSTER_MODE === 'true',
  },

  // Application
  app: {
    name: process.env.APP_NAME || 'BuySell Platform',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Marketplace Backend API',
    url: process.env.APP_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@buysell.com',
    contactEmail: process.env.CONTACT_EMAIL || 'contact@buysell.com',
  },

  // Base de données Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    dbUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    schema: process.env.SUPABASE_SCHEMA || 'public',
  },

  // Authentification JWT
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'buysell-platform',
    audience: process.env.JWT_AUDIENCE || 'buysell-users',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Stripe Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/checkout/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/checkout/cancel',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },

  // Cloudinary pour les images
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'buysell-platform',
    secure: process.env.CLOUDINARY_SECURE !== 'false',
  },

  // Email (Resend)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'resend',
    from: process.env.EMAIL_FROM || 'noreply@buysell.com',
    resendApiKey: process.env.RESEND_API_KEY,
    awsRegion: process.env.AWS_SES_REGION || 'us-east-1',
  },

  // AWS Services
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION || 'us-east-1',
      acl: process.env.AWS_S3_ACL || 'public-read',
    },
    ses: {
      from: process.env.AWS_SES_FROM_EMAIL,
      region: process.env.AWS_SES_REGION || 'us-east-1',
    },
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
      'application/pdf',
      'text/plain',
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    tempDir: process.env.TEMP_DIR || 'temp',
  },

  // Redis pour le cache et les sessions
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'buysell:',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limite par IP
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://buysell.com',
      'https://www.buysell.com',
    ],
    credentials: true,
    maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400, // 24 heures
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
    maxFiles: process.env.LOG_MAX_FILES || '30d',
    maxSize: process.env.LOG_MAX_SIZE || '100m',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Monitoring et analytics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 secondes
  },

  // Cache
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 heure
    prefix: process.env.CACHE_PREFIX || 'buysell:cache:',
  },

  // Fonctionnalités
  features: {
    emailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    twoFactorAuth: process.env.ENABLE_2FA === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    advancedAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    realTimeNotifications: process.env.ENABLE_REALTIME_NOTIFICATIONS === 'true',
    productReviews: process.env.ENABLE_PRODUCT_REVIEWS !== 'false',
    sellerDashboard: process.env.ENABLE_SELLER_DASHBOARD !== 'false',
    adminPanel: process.env.ENABLE_ADMIN_PANEL !== 'false',
  },

  // Sécurité
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    loginLockoutTime: parseInt(process.env.LOGIN_LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requireStrongPassword: process.env.REQUIRE_STRONG_PASSWORD === 'true',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 heures
  },

  // Business rules
  business: {
    commissionRate: parseFloat(process.env.COMMISSION_RATE) || 0.05, // 5%
    taxRate: parseFloat(process.env.TAX_RATE) || 0.18, // 18%
    freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 50000, // 50,000 XOF
    maxCartItems: parseInt(process.env.MAX_CART_ITEMS) || 50,
    maxOrderItems: parseInt(process.env.MAX_ORDER_ITEMS) || 100,
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD) || 10,
    criticalStockThreshold: parseInt(process.env.CRITICAL_STOCK_THRESHOLD) || 3,
  },

  // External APIs
  external: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Jobs et tâches planifiées
  jobs: {
    cleanupInterval: process.env.CLEANUP_INTERVAL || '0 2 * * *', // Tous les jours à 2h
    backupInterval: process.env.BACKUP_INTERVAL || '0 3 * * 0', // Tous les dimanches à 3h
    analyticsInterval: process.env.ANALYTICS_INTERVAL || '0 1 * * *', // Tous les jours à 1h
    emailQueueInterval: process.env.EMAIL_QUEUE_INTERVAL || '*/5 * * * *', // Toutes les 5 minutes
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
    throw new Error(`❌ Variables d'environnement manquantes: ${missing.join(', ')}`);
  }

  // Validation spécifique par environnement
  if (config.isProduction) {
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

  // Validation des URLs
  if (config.supabase.url && !config.supabase.url.startsWith('https://')) {
    throw new Error('SUPABASE_URL doit commencer par https://');
  }

  // Validation des clés JWT
  if (config.auth.jwtSecret && config.auth.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET doit faire au moins 32 caractères');
  }

  console.log('✅ Configuration validée avec succès');
  console.log(`🌍 Environnement: ${config.env}`);
  console.log(`🚀 Serveur: ${config.server.baseUrl}`);
  console.log(`📊 Fonctionnalités activées: ${Object.keys(config.features).filter(key => config.features[key]).length}`);
};

// Exécuter la validation
validateConfig();

// Export avec freeze pour éviter les modifications accidentelles
export default Object.freeze(config);
