/**
 * Tests d'intégration pour les commandes
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/security');
const supabase = require('../../src/config/supabase');

jest.mock('../../src/config/supabase');

describe('API des commandes', () => {
  let authToken;

  beforeAll(() => {
    authToken = generateToken(global.testUser);
  });

  describe('POST /api/orders', () => {
    test('devrait créer une nouvelle commande', async () => {
      const orderData = {
        items: [
          {
            product_id: 'test-product-id',
            quantity: 2,
            price: 5000,
            product_name: 'Test Product'
          }
        ],
        shipping_address: {
          street: '123 Test Street',
          city: 'Dakar',
          country: 'SN',
          postal_code: '12500'
        },
        payment_method: 'orange_money',
        total_amount: 10000
      };

      // Mock pour la création de commande
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-order-id',
            user_id: global.testUser.id,
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

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('new-order-id');
      expect(response.body.data.status).toBe('pending');
    });

    test('devrait échouer avec des articles invalides', async () => {
      const invalidOrder = {
        items: [],
        shipping_address: {
          street: '123 Test St'
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/orders', () => {
    test('devrait retourner les commandes de l\'utilisateur', async () => {
      const mockOrders = [
        { id: 'order-1', user_id: global.testUser.id, status: 'pending' },
        { id: 'order-2', user_id: global.testUser.id, status: 'completed' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
          count: 2
        })
      });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/orders/:id', () => {
    test('devrait retourner une commande spécifique', async () => {
      const mockOrder = {
        ...global.testOrder,
        items: [
          { product_id: 'prod-1', quantity: 1, price: 10000 }
        ]
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOrder,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/orders/test-order-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-order-id');
    });

    test('devrait empêcher l\'accès aux commandes d\'autres utilisateurs', async () => {
      const otherUserOrder = {
        id: 'other-order',
        user_id: 'other-user-id'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: otherUserOrder,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/orders/other-order')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Accès non autorisé à cette commande');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    test('devrait mettre à jour le statut d\'une commande', async () => {
      const statusUpdate = { status: 'shipped' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...global.testOrder, status: 'shipped' },
          error: null
        })
      });

      const response = await request(app)
        .patch('/api/orders/test-order-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('shipped');
    });
  });
});
