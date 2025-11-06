/**
 * Configuration des tests - Setup global
 * Ce fichier est exécuté avant chaque test
 */

const path = require('path');
const { config } = require('dotenv');

// Charger les variables d'environnement de test
config({ path: path.join(__dirname, '../.env.test') });

// Mock pour Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      // Query chain methods
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      
      // Final execution methods
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn(function(resolve) {
        resolve({ data: null, error: null });
        return this;
      }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ publicUrl: 'https://test-url.com/file' }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
  };

  return {
    supabase: mockSupabase,
    setupSupabase: jest.fn().mockResolvedValue(mockSupabase),
    getSupabase: jest.fn().mockReturnValue(mockSupabase),
  };
});

// Mock pour Redis
jest.mock('../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    client: {
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    },
  }),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }),
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  },
}));

// Mock pour Stripe
jest.mock('../src/config/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 1000,
        currency: 'xof',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1000,
        currency: 'xof',
        metadata: { order_id: 'test-order-id' },
      }),
      update: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test123',
        amount: 1000,
        status: 'succeeded',
        payment_intent: 'pi_test123',
      }),
    },
    paymentMethods: {
      create: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: { last4: '4242', brand: 'visa' },
      }),
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: { last4: '4242', brand: 'visa' },
          },
        ],
      }),
      attach: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        customer: 'cus_test123',
      }),
      detach: jest.fn().mockResolvedValue({}),
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com',
      }),
    },
  },
}));

// Mock pour les services externes (Cloudinary, SendGrid, etc.)
jest.mock('../src/services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/cloudinaryService', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/test/image.jpg',
    public_id: 'test_public_id',
  }),
  deleteImage: jest.fn().mockResolvedValue(true),
  optimizeImage: jest.fn().mockResolvedValue('https://res.cloudinary.com/test/optimized.jpg'),
}));

// Mock pour les jobs cron
jest.mock('../src/jobs', () => ({
  startCronJobs: jest.fn(),
  stopCronJobs: jest.fn(),
  cleanupExpiredCarts: jest.fn().mockResolvedValue(5),
  sendDailyReports: jest.fn().mockResolvedValue(true),
  updateProductRatings: jest.fn().mockResolvedValue(true),
}));

// Configuration globale Jest
jest.setTimeout(30000); // 30 secondes timeout pour les tests

// Variables globales pour les tests
global.testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  phone: '+221701234567',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testSeller = {
  id: 'test-seller-id',
  email: 'seller@example.com',
  full_name: 'Test Seller',
  role: 'seller',
  phone: '+221701234568',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testAdmin = {
  id: 'test-admin-id',
  email: 'admin@example.com',
  full_name: 'Test Admin',
  role: 'admin',
  phone: '+221701234569',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 10000,
  original_price: 12000,
  category_id: 'test-category-id',
  seller_id: 'test-seller-id',
  condition: 'new',
  stock: 10,
  images: ['image1.jpg', 'image2.jpg'],
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  image: 'category-image.jpg',
  parent_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testOrder = {
  id: 'test-order-id',
  user_id: 'test-user-id',
  total_amount: 15000,
  status: 'pending',
  payment_method: 'orange_money',
  payment_status: 'pending',
  shipping_address: {
    street: '123 Test Street',
    city: 'Dakar',
    state: 'Dakar',
    country: 'SN',
    postal_code: '12500',
  },
  billing_address: {
    street: '123 Test Street',
    city: 'Dakar',
    state: 'Dakar',
    country: 'SN',
    postal_code: '12500',
  },
  tracking_number: null,
  notes: 'Test order notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testOrderItem = {
  id: 'test-order-item-id',
  order_id: 'test-order-id',
  product_id: 'test-product-id',
  product_name: 'Test Product',
  quantity: 2,
  price: 7500,
  total: 15000,
  created_at: new Date().toISOString(),
};

global.testPayment = {
  id: 'test-payment-id',
  order_id: 'test-order-id',
  user_id: 'test-user-id',
  amount: 15000,
  currency: 'xof',
  payment_method: 'orange_money',
  status: 'pending',
  payment_intent_id: null,
  transaction_id: null,
  error_message: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

global.testReview = {
  id: 'test-review-id',
  product_id: 'test-product-id',
  user_id: 'test-user-id',
  rating: 5,
  title: 'Excellent product!',
  comment: 'Very satisfied with this product. Fast delivery and good quality.',
  is_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Utilitaires de test
global.createTestRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: global.testUser,
  ip: '127.0.0.1',
  method: 'GET',
  originalUrl: '/api/test',
  ...overrides,
});

global.createTestResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

global.createNextFunction = () => jest.fn();

// Helper pour créer des tokens de test
global.createTestToken = (user = global.testUser) => {
  return `test-token-${user.id}`;
};

// Helper pour mock les réponses Supabase réussies
global.mockSupabaseSuccess = (data = null) => ({
  data,
  error: null,
});

// Helper pour mock les réponses Supabase avec erreur
global.mockSupabaseError = (message = 'Test error') => ({
  data: null,
  error: { message },
});

// Helper pour mock les réponses paginées
global.mockPaginationResponse = (data, totalCount = null) => ({
  data,
  error: null,
  count: totalCount !== null ? totalCount : data.length,
});

// Configuration des consoles pour les tests
const originalConsole = { ...console };

// Supprimer les logs en production de test
beforeAll(() => {
  if (process.env.NODE_ENV === 'test') {
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      // Garder error pour voir les vraies erreurs
      error: originalConsole.error,
      debug: jest.fn(),
    };
  }
});

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
  
  // Réinitialiser les mocks communs
  const { supabase } = require('../src/config/supabase');
  if (supabase && supabase.auth) {
    Object.values(supabase.auth).forEach(mock => {
      if (typeof mock === 'function' && mock.mockClear) {
        mock.mockClear();
      }
    });
  }
  
  // Réinitialiser les mocks de base de données
  if (supabase && supabase.from) {
    supabase.from.mockClear();
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  jest.restoreAllMocks();
  global.console = originalConsole;
  
  // Nettoyer les connexions Redis si nécessaire
  try {
    const redis = require('../src/config/redis');
    if (redis.redisClient && redis.redisClient.quit) {
      await redis.redisClient.quit();
    }
  } catch (error) {
    // Ignorer les erreurs de nettoyage
  }
});

// Gestion des erreurs non capturées dans les tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test execution:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  // Ne pas arrêter le processus pendant les tests
});

// Configuration pour les tests de timezone
process.env.TZ = 'UTC';

// Mock pour les fonctions de date
global.mockDate = (isoString = '2024-01-15T10:00:00.000Z') => {
  const RealDate = global.Date;
  const mockDate = new RealDate(isoString);
  
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return mockDate;
      }
      return new RealDate(...args);
    }
    
    static now() {
      return mockDate.getTime();
    }
  };
  
  return () => {
    global.Date = RealDate;
  };
};

// Export pour une utilisation dans les tests individuels
module.exports = {
  testUser: global.testUser,
  testSeller: global.testSeller,
  testAdmin: global.testAdmin,
  testProduct: global.testProduct,
  testOrder: global.testOrder,
  testPayment: global.testPayment,
  testReview: global.testReview,
  createTestRequest: global.createTestRequest,
  createTestResponse: global.createTestResponse,
  createNextFunction: global.createNextFunction,
  createTestToken: global.createTestToken,
  mockSupabaseSuccess: global.mockSupabaseSuccess,
  mockSupabaseError: global.mockSupabaseError,
  mockPaginationResponse: global.mockPaginationResponse,
  mockDate: global.mockDate,
};
