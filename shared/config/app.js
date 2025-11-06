// Application configuration

const { ENV } = require('../utils/constants');

// Base configuration
const baseConfig = {
  app: {
    name: process.env.APP_NAME || 'BuySell Platform',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || ENV.DEVELOPMENT,
    port: parseInt(process.env.PORT) || 3001,
    url: process.env.APP_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3001',
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-default-jwt-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  },
  
  // Database
  database: {
    client: process.env.DB_CLIENT || 'pg',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'buysell_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
    },
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  
  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
    storage: {
      provider: process.env.FILE_STORAGE_PROVIDER || 'local', // local, s3, cloudinary
      local: {
        directory: process.env.UPLOAD_DIRECTORY || './uploads',
      },
      s3: {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
    },
  },
  
  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'resend', // resend, smtp, sendgrid
    from: process.env.EMAIL_FROM || 'noreply@buysellplatform.com',
    resend: {
      apiKey: process.env.RESEND_API_KEY,
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
  
  // Payment
  payment: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    processors: {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
      },
    },
  },
  
  // Analytics
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN,
    },
    google: {
      measurementId: process.env.GA_MEASUREMENT_ID,
    },
  },
  
  // Cache
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: {
      short: 5 * 60, // 5 minutes
      medium: 30 * 60, // 30 minutes
      long: 24 * 60 * 60, // 24 hours
    },
  },
  
  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
};

// Environment-specific configurations
const environmentConfigs = {
  [ENV.DEVELOPMENT]: {
    app: {
      debug: true,
    },
    database: {
      debug: true,
    },
    email: {
      enabled: false, // Don't send real emails in development
    },
  },
  
  [ENV.TEST]: {
    app: {
      debug: false,
    },
    database: {
      name: process.env.DB_NAME || 'buysell_platform_test',
    },
    email: {
      enabled: false,
    },
  },
  
  [ENV.STAGING]: {
    app: {
      debug: false,
    },
    email: {
      enabled: true,
    },
  },
  
  [ENV.PRODUCTION]: {
    app: {
      debug: false,
    },
    security: {
      // In production, these must be set via environment variables
      jwtSecret: process.env.JWT_SECRET,
    },
    email: {
      enabled: true,
    },
  },
};

// Merge configuration based on environment
const environment = baseConfig.app.environment;
const envConfig = environmentConfigs[environment] || {};

// Deep merge function
const deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

// Final configuration
const config = deepMerge(baseConfig, envConfig);

// Validation
if (config.app.environment === ENV.PRODUCTION) {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_PASSWORD',
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missingVars.join(', ')}`);
  }
}

// Export configuration
module.exports = config;
