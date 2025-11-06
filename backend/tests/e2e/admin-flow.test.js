/**
 * Tests end-to-end pour le flux administrateur
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/security');
const supabase = require('../../src/config/supabase');

jest.mock('../../src/config/supabase');

describe('Flux administrateur', () => {
  let adminToken;
  let adminUser;

  beforeAll(() => {
    adminUser = {
      id: 'admin-user-id',
      email: 'admin@buysell.com',
      role: 'admin',
      full_name: 'Admin User'
    };

    adminToken = generateToken(adminUser);
  });

  describe('Gestion des utilisateurs', () => {
    test('devrait permettre à l\'admin de lister tous les utilisateurs', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', role: 'user' },
        { id: 'user-2', email: 'user2@example.com', role: 'seller' },
        adminUser
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
          count: mockUsers.length
        })
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    test('devrait permettre à l\'admin de mettre à jour le rôle d\'un utilisateur', async () => {
      const userUpdate = { role: 'seller' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', email: 'user1@example.com', role: 'seller' },
          error: null
        })
      });

      const response = await request(app)
        .patch('/api/admin/users/user-1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('seller');
    });
  });

  describe('Gestion des produits', () => {
    test('devrait permettre à l\'admin de voir tous les produits', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', status: 'active' },
        { id: 'prod-2', name: 'Product 2', status: 'inactive' },
        { id: 'prod-3', name: 'Product 3', status: 'pending' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
          count: mockProducts.length
        })
      });

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    test('devrait permettre à l\'admin de désactiver un produit', async () => {
      const productUpdate = { status: 'inactive' };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'prod-1', name: 'Product 1', status: 'inactive' },
          error: null
        })
      });

      const response = await request(app)
        .patch('/api/admin/products/prod-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });
  });

  describe('Analytics et rapports', () => {
    test('devrait permettre à l\'admin d\'accéder aux analytics', async () => {
      const mockAnalytics = {
        totalUsers: 150,
        totalProducts: 450,
        totalOrders: 320,
        totalRevenue: 12500000,
        recentOrders: [
          { id: 'order-1', total_amount: 25000, status: 'completed' },
          { id: 'order-2', total_amount: 18000, status: 'completed' }
        ]
      };

      // Mock pour les différentes requêtes d'analytics
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { count: mockAnalytics.totalUsers },
          error: null
        })
      });

      const response = await request(app)
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('devrait permettre à l\'admin de générer des rapports', async () => {
      const reportData = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'sales'
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            { date: '2024-01-15', revenue: 450000, orders: 25 },
            { date: '2024-01-16', revenue: 520000, orders: 28 }
          ],
          error: null
        })
      });

      const response = await request(app)
        .post('/api/admin/analytics/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Sécurité admin', () => {
    test('devrait refuser l\'accès aux non-admins', async () => {
      const userToken = generateToken({
        id: 'regular-user',
        email: 'user@example.com',
        role: 'user'
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Permissions insuffisantes');
    });

    test('devrait refuser l\'accès sans authentification', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
