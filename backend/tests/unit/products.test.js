/**
 * Tests unitaires pour le service des produits
 */

const productService = require('../../../src/services/productService');
const supabase = require('../../../src/config/supabase');
const { validateProduct } = require('../../../src/utils/validators');

jest.mock('../../../src/config/supabase');
jest.mock('../../../src/utils/validators');

describe('Service des produits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    test('devrait retourner des produits avec pagination', async () => {
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

      const result = await productService.getProducts({ 
        page: 1, 
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(2);
    });

    test('devrait filtrer par catégorie', async () => {
      const mockProducts = [
        { id: '1', name: 'Laptop', price: 300000, category_id: 'electronics' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
          count: 1
        })
      });

      const result = await productService.getProducts({ 
        category: 'electronics',
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data[0].category_id).toBe('electronics');
    });

    test('devrait filtrer par prix', async () => {
      const mockProducts = [
        { id: '1', name: 'Affordable Product', price: 5000 }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      });

      const result = await productService.getProducts({
        minPrice: 1000,
        maxPrice: 10000,
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
    });

    test('devrait rechercher des produits', async () => {
      const mockProducts = [
        { id: '1', name: 'iPhone 13', description: 'Smartphone Apple' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      });

      const result = await productService.getProducts({
        search: 'iphone',
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getProductById', () => {
    test('devrait retourner un produit par ID', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        price: 15000,
        description: 'Test Description',
        seller: { id: 'user-123', full_name: 'Test Seller' }
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProduct,
          error: null
        })
      });

      const result = await productService.getProductById('prod-123');

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
    test('devrait créer un nouveau produit avec validation', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product Description',
        price: 25000,
        category_id: 'cat-123',
        seller_id: 'user-123',
        condition: 'new',
        stock: 10
      };

      validateProduct.mockReturnValue({ isValid: true, errors: {} });

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...productData, id: 'new-product-id' },
          error: null
        })
      });

      const result = await productService.createProduct(productData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('new-product-id');
      expect(validateProduct).toHaveBeenCalledWith(productData);
    });

    test('devrait échouer si la validation échoue', async () => {
      const invalidProduct = {
        name: '', // Nom vide
        price: -100 // Prix négatif
      };

      validateProduct.mockReturnValue({
        isValid: false,
        errors: {
          name: 'Le nom est requis',
          price: 'Le prix doit être positif'
        }
      });

      const result = await productService.createProduct(invalidProduct);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('updateProduct', () => {
    test('devrait mettre à jour un produit existant', async () => {
      const productId = 'prod-123';
      const updates = { 
        name: 'Updated Product', 
        price: 30000,
        description: 'Updated description'
      };

      // Mock pour vérifier la propriété
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, seller_id: 'user-123' },
          error: null
        })
      });

      // Mock pour la mise à jour
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...updates, id: productId },
          error: null
        })
      });

      const result = await productService.updateProduct(productId, updates, 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Product');
    });

    test('ne devrait pas permettre la mise à jour par un non-propriétaire', async () => {
      const productId = 'prod-123';
      const updates = { name: 'Hacked Product' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, seller_id: 'other-user' },
          error: null
        })
      });

      const result = await productService.updateProduct(productId, updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Non autorisé');
    });
  });

  describe('deleteProduct', () => {
    test('devrait supprimer un produit', async () => {
      const productId = 'prod-123';

      // Mock pour vérifier la propriété
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, seller_id: 'user-123' },
          error: null
        })
      });

      // Mock pour la suppression
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, name: 'Deleted Product' },
          error: null
        })
      });

      const result = await productService.deleteProduct(productId, 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Produit supprimé avec succès');
    });

    test('ne devrait pas supprimer un produit avec des commandes actives', async () => {
      const productId = 'prod-123';

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, seller_id: 'user-123' },
          error: null
        })
      });

      // Mock pour vérifier les commandes actives
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { count: 2 }, // 2 commandes actives
          error: null
        })
      });

      const result = await productService.deleteProduct(productId, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('commandes actives');
    });
  });

  describe('updateProductStock', () => {
    test('devrait mettre à jour le stock d\'un produit', async () => {
      const productId = 'prod-123';
      const newStock = 15;

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, stock: newStock },
          error: null
        })
      });

      const result = await productService.updateProductStock(productId, newStock);

      expect(result.success).toBe(true);
      expect(result.data.stock).toBe(newStock);
    });

    test('devrait échouer si le stock est négatif', async () => {
      const result = await productService.updateProductStock('prod-123', -5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stock invalide');
    });
  });

  describe('getRelatedProducts', () => {
    test('devrait retourner des produits similaires', async () => {
      const productId = 'prod-123';
      const mockRelated = [
        { id: 'prod-124', name: 'Related 1', category_id: 'cat-1' },
        { id: 'prod-125', name: 'Related 2', category_id: 'cat-1' }
      ];

      // Mock pour récupérer le produit original
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: productId, category_id: 'cat-1' },
          error: null
        })
      });

      // Mock pour les produits similaires
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRelated,
          error: null
        })
      });

      const result = await productService.getRelatedProducts(productId, 2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].category_id).toBe('cat-1');
    });
  });

  describe('getLowStockProducts', () => {
    test('devrait retourner les produits en faible stock', async () => {
      const mockLowStock = [
        { id: 'prod-1', name: 'Low Stock 1', stock: 2 },
        { id: 'prod-2', name: 'Low Stock 2', stock: 1 }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockLowStock,
          error: null
        })
      });

      const result = await productService.getLowStockProducts(5); // Seuil à 5

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].stock).toBeLessThanOrEqual(5);
    });
  });
});
