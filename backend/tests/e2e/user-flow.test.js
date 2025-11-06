/**
 * Tests end-to-end pour le flux utilisateur complet
 */

const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabase');

jest.mock('../../src/config/supabase');

describe('Flux utilisateur complet', () => {
  let authToken;
  let userId;
  let productId;
  let orderId;

  describe('Flux complet: Inscription → Connexion → Création produit → Commande → Paiement', () => {
    test('devrait compléter le flux utilisateur complet', async () => {
      // 1. Inscription
      const userData = {
        email: 'e2euser@example.com',
        password: 'Password123!',
        full_name: 'E2E Test User',
        phone: '+221701234567'
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'e2e-user-id', email: userData.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...userData, id: 'e2e-user-id', role: 'user' },
          error: null
        })
      });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      userId = registerResponse.body.user.id;

      // 2. Connexion
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: userId, email: userData.email },
          session: { access_token: 'e2e-token' }
        },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: userId, email: userData.email, role: 'user' },
          error: null
        })
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      authToken = loginResponse.body.token;

      // 3. Création d'un produit
      const productData = {
        name: 'E2E Test Product',
        description: 'Product for E2E testing',
        price: 25000,
        category_id: 'electronics',
        condition: 'new',
        stock: 10
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...productData, id: 'e2e-product-id', seller_id: userId },
          error: null
        })
      });

      const productResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(productResponse.body.success).toBe(true);
      productId = productResponse.body.data.id;

      // 4. Récupération des produits
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ ...productData, id: productId, seller_id: userId }],
          error: null,
          count: 1
        })
      });

      const productsResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(productsResponse.body.success).toBe(true);
      expect(productsResponse.body.data).toHaveLength(1);

      // 5. Création d'une commande
      const orderData = {
        items: [
          {
            product_id: productId,
            quantity: 1,
            price: 25000,
            product_name: productData.name
          }
        ],
        shipping_address: {
          street: '456 E2E Test Street',
          city: 'Dakar',
          country: 'SN',
          postal_code: '12500'
        },
        payment_method: 'orange_money',
        total_amount: 25000
      };

      // Mock pour la création de commande
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'e2e-order-id',
            user_id: userId,
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

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      orderId = orderResponse.body.data.id;

      // 6. Vérification de la commande créée
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: orderId,
            user_id: userId,
            ...orderData,
            status: 'pending'
          },
          error: null
        })
      });

      const orderCheckResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(orderCheckResponse.body.success).toBe(true);
      expect(orderCheckResponse.body.data.id).toBe(orderId);

      console.log('✅ Flux utilisateur E2E complété avec succès');
    });
  });
});
