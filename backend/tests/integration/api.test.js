/**
 * Tests d'intégration pour l'API complète
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/security');
const supabase = require('../../src/config/supabase');

jest.mock('../../src/config/supabase');

describe('API Complète - Tests d\'intégration', () => {
  let userToken;
  let sellerToken;
  let adminToken;
  let testProductId;
  let testOrderId;

  beforeAll(() => {
    // Tokens pour différents rôles
    userToken = generateToken({
      id: 'test-user-id',
      email: 'user@example.com',
      role: 'user'
    });

    sellerToken = generateToken({
      id: 'test-seller-id',
      email: 'seller@example.com',
      role: 'seller'
    });

    adminToken = generateToken({
      id: 'test-admin-id',
      email: 'admin@example.com',
      role: 'admin'
    });
  });

  describe('Flux complet produit → panier → commande → paiement', () => {
    test('devrait compléter le cycle complet d\'achat', async () => {
      // 1. Création d'un produit par un vendeur
      const productData = {
        name: 'Intégration Test Product',
        description: 'Product for integration testing',
        price: 15000,
        category_id: 'electronics',
        condition: 'new',
        stock: 10
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...productData, id: 'int-test-product-id', seller_id: 'test-seller-id' },
          error: null
        })
      });

      const createProductResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData)
        .expect(201);

      expect(createProductResponse.body.success).toBe(true);
      testProductId = createProductResponse.body.data.id;

      // 2. Récupération du produit créé
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...productData, id: testProductId, seller_id: 'test-seller-id' },
          error: null
        })
      });

      const getProductResponse = await request(app)
        .get(`/api/products/${testProductId}`)
        .expect(200);

      expect(getProductResponse.body.success).toBe(true);
      expect(getProductResponse.body.data.id).toBe(testProductId);

      // 3. Ajout au panier
      const cartItem = {
        product_id: testProductId,
        quantity: 2
      };

      // Mock pour le panier
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null, // Panier vide
          error: null
        })
      });

      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...cartItem, id: 'cart-item-id', user_id: 'test-user-id' },
          error: null
        })
      });

      const addToCartResponse = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cartItem)
        .expect(201);

      expect(addToCartResponse.body.success).toBe(true);

      // 4. Récupération du panier
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ ...cartItem, id: 'cart-item-id', user_id: 'test-user-id' }],
          error: null
        })
      });

      const getCartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getCartResponse.body.success).toBe(true);
      expect(getCartResponse.body.data).toHaveLength(1);

      // 5. Création de la commande
      const orderData = {
        items: [
          {
            product_id: testProductId,
            quantity: 2,
            price: 15000,
            product_name: productData.name
          }
        ],
        shipping_address: {
          street: '123 Integration Test St',
          city: 'Dakar',
          country: 'SN',
          postal_code: '12500'
        },
        payment_method: 'orange_money',
        total_amount: 30000
      };

      // Mock pour la création de commande
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'int-test-order-id',
            user_id: 'test-user-id',
            ...orderData,
            status: 'pending'
          },
          error: null
        })
      });

      // Mock pour les items de commande
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: orderData.items[0],
          error: null
        })
      });

      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(createOrderResponse.body.success).toBe(true);
      testOrderId = createOrderResponse.body.data.id;

      // 6. Vérification de la commande créée
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: testOrderId,
            user_id: 'test-user-id',
            ...orderData,
            status: 'pending'
          },
          error: null
        })
      });

      const getOrderResponse = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getOrderResponse.body.success).toBe(true);
      expect(getOrderResponse.body.data.id).toBe(testOrderId);

      // 7. Processus de paiement
      const paymentData = {
        order_id: testOrderId,
        payment_method: 'orange_money',
        amount: 30000
      };

      // Mock pour le paiement mobile money
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'int-test-payment-id',
            ...paymentData,
            status: 'pending'
          },
          error: null
        })
      });

      const paymentResponse = await request(app)
        .post('/api/payments/mobile-money')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(201);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data.status).toBe('pending');

      console.log('✅ Flux d\'intégration complet réussi');
    });
  });

  describe('Gestion des erreurs API', () => {
    test('devrait retourner 404 pour les routes inexistantes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route API non trouvée');
    });

    test('devrait retourner 401 pour les routes protégées sans token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Accès non autorisé');
    });

    test('devrait retourner 403 pour les rôles insuffisants', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`) // User normal, pas admin
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Permissions insuffisantes');
    });
  });

  describe('Validation des données', () => {
    test('devrait rejeter les données invalides', async () => {
      const invalidProduct = {
        name: '', // Nom vide
        price: -100, // Prix négatif
        category_id: '' // Catégorie vide
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('devrait valider les emails', async () => {
      const invalidAuth = {
        email: 'invalid-email',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidAuth)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.email).toBeDefined();
    });
  });

  describe('Performance et pagination', () => {
    test('devrait supporter la pagination des produits', async () => {
      const mockProducts = Array.from({ length: 15 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 1000 * (i + 1)
      }));

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts.slice(0, 10), // Première page
          error: null,
          count: 15
        })
      });

      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.pages).toBe(2);
    });

    test('devrait limiter le nombre de résultats', async () => {
      const response = await request(app)
        .get('/api/products?limit=60') // Au-delà de la limite
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Limite');
    });
  });

  describe('Sécurité API', () => {
    test('devrait appliquer le rate limiting', async () => {
      // Simuler plusieurs requêtes rapides
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: `test${i}@example.com`,
            password: 'password'
          });
      }

      // La 6ème requête devrait être bloquée (limite à 5 pour l'auth)
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test6@example.com',
          password: 'password'
        })
        .expect(429);

      expect(response.body.error).toContain('Trop de tentatives');
    });

    test('devrait sanitizer les entrées', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Product',
        description: 'Normal description'
      };

      // Le script devrait être échappé ou rejeté
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(maliciousInput)
        .expect(400); // Devrait échouer la validation

      expect(response.body.success).toBe(false);
    });
  });

  describe('Endpoints publics', () => {
    test('devrait retourner la page d\'accueil', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.message).toContain('BuySell Marketplace API');
      expect(response.body.status).toBe('operational');
    });

    test('devrait retourner le statut de l\'API', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('BuySell API');
    });

    test('devrait passer le health check', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { count: 1 },
          error: null
        })
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.checks.database).toBe('healthy');
    });
  });
});
