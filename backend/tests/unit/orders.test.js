/**
 * Tests unitaires pour le service des commandes
 */

const orderService = require('../../../src/services/orderService');
const supabase = require('../../../src/config/supabase');
const { calculateOrderTotal } = require('../../../src/utils/priceCalculator');

jest.mock('../../../src/config/supabase');
jest.mock('../../../src/utils/priceCalculator');

describe('Service des commandes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    test('devrait créer une commande avec calcul du total', async () => {
      const orderData = {
        user_id: 'user-123',
        items: [
          { product_id: 'prod-1', quantity: 2, price: 5000 },
          { product_id: 'prod-2', quantity: 1, price: 10000 }
        ],
        shipping_address: {
          street: '123 Test St',
          city: 'Dakar',
          country: 'SN'
        }
      };

      calculateOrderTotal.mockReturnValue(25000);

      // Mock pour la commande
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'order-123',
            ...orderData,
            total_amount: 25000,
            status: 'pending'
          },
          error: null
        })
      });

      // Mock pour les items
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: orderData.items,
          error: null
        })
      });

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.data.total_amount).toBe(25000);
      expect(calculateOrderTotal).toHaveBeenCalledWith(orderData.items);
    });

    test('devrait échouer si les articles sont vides', async () => {
      const orderData = {
        user_id: 'user-123',
        items: [],
        shipping_address: {
          street: '123 Test St'
        }
      };

      const result = await orderService.createOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('La commande doit contenir au moins un article');
    });
  });

  describe('getOrderById', () => {
    test('devrait retourner une commande avec ses articles', async () => {
      const mockOrder = {
        id: 'order-123',
        user_id: 'user-123',
        total_amount: 25000,
        status: 'pending'
      };

      const mockItems = [
        { id: 'item-1', product_id: 'prod-1', quantity: 2, price: 5000 },
        { id: 'item-2', product_id: 'prod-2', quantity: 1, price: 10000 }
      ];

      // Mock pour la commande
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOrder,
          error: null
        })
      });

      // Mock pour les items
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockItems,
          error: null
        })
      });

      const result = await orderService.getOrderById('order-123');

      expect(result.success).toBe(true);
      expect(result.data.order).toEqual(mockOrder);
      expect(result.data.items).toEqual(mockItems);
    });

    test('devrait échouer si la commande n\'existe pas', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const result = await orderService.getOrderById('non-existent-order');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Commande non trouvée');
    });
  });

  describe('getUserOrders', () => {
    test('devrait retourner les commandes paginées d\'un utilisateur', async () => {
      const mockOrders = [
        { id: 'order-1', user_id: 'user-123', status: 'completed' },
        { id: 'order-2', user_id: 'user-123', status: 'pending' }
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

      const result = await orderService.getUserOrders('user-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    test('devrait filtrer par statut', async () => {
      const mockOrders = [
        { id: 'order-1', user_id: 'user-123', status: 'completed' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
          count: 1
        })
      });

      const result = await orderService.getUserOrders('user-123', { 
        page: 1, 
        limit: 10, 
        status: 'completed' 
      });

      expect(result.success).toBe(true);
      expect(result.data[0].status).toBe('completed');
    });
  });

  describe('updateOrderStatus', () => {
    test('devrait mettre à jour le statut d\'une commande', async () => {
      const newStatus = 'shipped';
      
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'order-123', status: newStatus },
          error: null
        })
      });

      const result = await orderService.updateOrderStatus('order-123', newStatus);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(newStatus);
    });

    test('devrait échouer avec un statut invalide', async () => {
      const result = await orderService.updateOrderStatus('order-123', 'invalid-status');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Statut invalide');
    });
  });

  describe('cancelOrder', () => {
    test('devrait annuler une commande en attente', async () => {
      const mockOrder = { id: 'order-123', status: 'pending' };

      // Mock pour récupérer la commande
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOrder,
          error: null
        })
      });

      // Mock pour la mise à jour
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockOrder, status: 'cancelled' },
          error: null
        })
      });

      const result = await orderService.cancelOrder('order-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('cancelled');
    });

    test('ne devrait pas annuler une commande déjà expédiée', async () => {
      const mockOrder = { id: 'order-123', status: 'shipped', user_id: 'user-123' };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockOrder,
          error: null
        })
      });

      const result = await orderService.cancelOrder('order-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ne peut pas être annulée');
    });
  });

  describe('calculateOrderStats', () => {
    test('devrait calculer les statistiques des commandes', async () => {
      const mockStats = {
        total: 150,
        pending: 25,
        completed: 100,
        cancelled: 25,
        totalRevenue: 2500000
      };

      // Mock pour chaque count
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      })
      .mockResolvedValueOnce({ data: { count: mockStats.total }, error: null })
      .mockResolvedValueOnce({ data: { count: mockStats.pending }, error: null })
      .mockResolvedValueOnce({ data: { count: mockStats.completed }, error: null })
      .mockResolvedValueOnce({ data: { count: mockStats.cancelled }, error: null });

      // Mock pour le revenue
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { sum: mockStats.totalRevenue },
          error: null
        })
      });

      const result = await orderService.calculateOrderStats('user-123');

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(150);
      expect(result.data.totalRevenue).toBe(2500000);
    });
  });
});
