// Application constants

// API Constants
exports.API = {
  VERSION: '1.0.0',
  BASE_PATH: '/api/v1',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};

// Application Constants
exports.APP = {
  NAME: 'BuySell Platform',
  DESCRIPTION: 'A modern e-commerce platform for buying and selling products',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@buysellplatform.com',
  SUPPORT_PHONE: '+1-555-0123',
};

// User Constants
exports.USER = {
  ROLES: {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
    PENDING: 'pending',
  },
  PREFERENCES: {
    DEFAULT_THEME: 'light',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_TIMEZONE: 'UTC',
    PRODUCTS_PER_PAGE: 20,
  },
};

// Product Constants
exports.PRODUCT = {
  STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
  },
  CONDITION: {
    NEW: 'new',
    USED: 'used',
    REFURBISHED: 'refurbished',
  },
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
    DEFAULT_TRACK_QUANTITY: true,
    DEFAULT_ALLOW_BACKORDER: false,
  },
  SHIPPING: {
    WEIGHT_UNITS: {
      GRAMS: 'g',
      KILOGRAMS: 'kg',
      POUNDS: 'lb',
      OUNCES: 'oz',
    },
    DIMENSION_UNITS: {
      CENTIMETERS: 'cm',
      INCHES: 'in',
      MILLIMETERS: 'mm',
    },
    PROCESSING_TIMES: {
      ONE_DAY: '1_day',
      TWO_DAYS: '2_days',
      THREE_DAYS: '3_days',
      ONE_WEEK: '1_week',
      TWO_WEEKS: '2_weeks',
      CUSTOM: 'custom',
    },
  },
};

// Order Constants
exports.ORDER = {
  STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    READY_FOR_SHIPMENT: 'ready_for_shipment',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    ON_HOLD: 'on_hold',
    FAILED: 'failed',
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    AUTHORIZED: 'authorized',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
    CANCELLED: 'cancelled',
  },
  PAYMENT_METHODS: {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PAYPAL: 'paypal',
    STRIPE: 'stripe',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
    BANK_TRANSFER: 'bank_transfer',
    CASH_ON_DELIVERY: 'cash_on_delivery',
    DIGITAL_WALLET: 'digital_wallet',
  },
};

// Cart Constants
exports.CART = {
  SESSION_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_ITEMS: 50,
  ABANDONED_CART_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
};

// Payment Constants
exports.PAYMENT = {
  PROCESSORS: {
    STRIPE: 'stripe',
    PAYPAL: 'paypal',
    SQUARE: 'square',
    AUTHORIZE_NET: 'authorize_net',
    MOBILE_MONEY: 'mobile_money',
  },
  MOBILE_MONEY_PROVIDERS: {
    ORANGE_MONEY: 'orange_money',
    MTN_MONEY: 'mtn_money',
    WAVE: 'wave',
    AIRTEL_MONEY: 'airtel_money',
    MPESA: 'mpesa',
  },
};

// Notification Constants
exports.NOTIFICATION = {
  TYPES: {
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms',
    IN_APP: 'in_app',
  },
  CHANNELS: {
    ORDER_CONFIRMATION: 'order_confirmation',
    SHIPPING_UPDATE: 'shipping_update',
    PAYMENT_RECEIPT: 'payment_receipt',
    SECURITY_ALERT: 'security_alert',
    PROMOTIONAL: 'promotional',
    SYSTEM: 'system',
  },
};

// File Upload Constants
exports.FILE = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.mp4',
    '.mov',
  ],
};

// Validation Constants
exports.VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]{10,}$/,
  },
  URL: {
    PATTERN: /^https?:\/\/.+\..+$/,
  },
};

// Cache Constants
exports.CACHE = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    PRODUCT: 'product',
    CATEGORY: 'category',
    USER: 'user',
    ORDER: 'order',
    CART: 'cart',
  },
};

// Error Codes
exports.ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_ACCESS_DENIED: 'AUTH_ACCESS_DENIED',
  AUTH_RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',

  // Validation Errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_UNIQUE_CONSTRAINT: 'VALIDATION_UNIQUE_CONSTRAINT',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',

  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Payment Errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_INSUFFICIENT_FUNDS: 'PAYMENT_INSUFFICIENT_FUNDS',
  PAYMENT_PROCESSOR_ERROR: 'PAYMENT_PROCESSOR_ERROR',

  // System Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

// Country and Currency Constants
exports.COUNTRIES = {
  US: { name: 'United States', currency: 'USD', phoneCode: '+1' },
  FR: { name: 'France', currency: 'EUR', phoneCode: '+33' },
  GB: { name: 'United Kingdom', currency: 'GBP', phoneCode: '+44' },
  DE: { name: 'Germany', currency: 'EUR', phoneCode: '+49' },
  SN: { name: 'Senegal', currency: 'XOF', phoneCode: '+221' },
  CI: { name: 'Ivory Coast', currency: 'XOF', phoneCode: '+225' },
  // Add more countries as needed
};

exports.CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', decimalDigits: 2 },
  EUR: { symbol: '€', name: 'Euro', decimalDigits: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimalDigits: 2 },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc', decimalDigits: 0 },
  // Add more currencies as needed
};

// Date and Time Constants
exports.DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  DATABASE: 'YYYY-MM-DD HH:mm:ss',
};

// Feature Flags
exports.FEATURE_FLAGS = {
  ENABLE_MOBILE_MONEY: true,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_PRODUCT_REVIEWS: true,
  ENABLE_WISHLIST: true,
  ENABLE_PRODUCT_COMPARISON: true,
  ENABLE_AFFILIATE_PROGRAM: false,
  ENABLE_SUBSCRIPTIONS: false,
};

// Environment Constants
exports.ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
};

module.exports = exports;
