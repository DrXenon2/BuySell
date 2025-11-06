/**
 * Tests d'intégration pour les produits
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/security');
const supabase = require('../../src/config/supabase');

jest.mock('../../src/config/supabase');

describe('API des produits', () => {
  let authToken;

  beforeAll(() => {
    authToken = generateToken(global.testUser);
  });

  describe('GET /api/products', () => {
    test('devrait retourner une liste paginée de produits', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10000, category_id: 'cat-1' },
        { id: '2', name: 'Product 2', price: 20000, category_id: 'cat-2' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
          count: 2
        })
      });

      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    test('devrait filtrer les produits par catégorie', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10000, category_id: 'electronics' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/products?category=electronics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].category_id).toBe('electronics');
    });
  });

  describe('GET /api/products/:id', () => {
    test('devrait retourner un produit spécifique', async () => {
      const mockProduct = global.testProduct;

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProduct,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/products/test-product-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-product-id');
    });

    test('devrait retourner 404 pour un produit non trouvé', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const response = await request(app)
        .get('/api/products/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Produit non trouvé');
    });
  });

  describe('POST /api/products', () => {
    test('devrait créer un nouveau produit', async () => {
      const newProduct = {
        name: 'New Test Product',
        description: 'Test Description',
        price: 15000,
        category_id: 'test-category',
        condition: 'new',
        stock: 5
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...newProduct, id: 'new-product-id', seller_id: global.testUser.id },
          error: null
        })
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProduct.name);
    });

    test('devrait échouer sans authentification', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/:id', () => {
    test('devrait mettre à jour un produit', async () => {
      const updates = { name: 'Updated Product', price: 20000 };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...global.testProduct, ...updates },
          error: null
        })
      });

      const response = await request(app)
        .put('/api/products/test-product-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('devrait supprimer un produit', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: global.testProduct,
          error: null
        })
      });

      const response = await request(app)
        .delete('/api/products/test-product-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Produit supprimé avec succès');
    });
  });
});
