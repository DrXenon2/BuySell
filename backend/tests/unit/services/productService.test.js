/**
 * Tests unitaires pour le service des produits
 */

const productService = require('../../../src/services/productService');
const supabase = require('../../../src/config/supabase');

jest.mock('../../../src/config/supabase');

describe('Service des produits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    test('devrait retourner une liste de produits', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10000 },
        { id: '2', name: 'Product 2', price: 20000 }
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

      const result = await productService.getProducts({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.page).toBe(1);
    });

    test('devrait gérer les erreurs de base de données', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        range: jest.fn().mockRejectedValue(new Error('DB Error'))
      });

      const result = await productService.getProducts({ page: 1, limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProductById', () => {
    test('devrait retourner un produit par ID', async () => {
      const mockProduct = global.testProduct;

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProduct,
          error: null
        })
      });

      const result = await productService.getProductById('test-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });

    test('devrait retourner une erreur si produit non trouvé', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const result = await productService.getProductById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Produit non trouvé');
    });
  });

  describe('createProduct', () => {
    test('devrait créer un nouveau produit', async () => {
      const productData = {
        name: 'New Product',
        price: 15000,
        category_id: 'cat-123',
        seller_id: 'user-123'
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...productData, id: 'new-id' },
          error: null
        })
      });

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('new-id');
    });
  });

  describe('updateProduct', () => {
    test('devrait mettre à jour un produit existant', async () => {
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

      const result = await productService.updateProduct('test-id', updates);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Product');
    });
  });

  describe('deleteProduct', () => {
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

      const result = await productService.deleteProduct('test-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Produit supprimé avec succès');
    });
  });
});
