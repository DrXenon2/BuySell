/**
 * Order service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';
import { PAGINATION } from '../utils/constants';

class OrderService {
  /**
   * Get all orders with pagination and filters
   */
  async getOrders(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = '',
      customerId = '',
      sellerId = '',
      startDate = '',
      endDate = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const params = {
      page,
      limit,
      status,
      customerId,
      sellerId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/orders', params);
  }

  /**
   * Get order by ID
   */
  async getOrderById(id) {
    if (!id) throw new Error('Order ID is required');
    
    return await apiService.get(`/orders/${id}`);
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber) {
    if (!orderNumber) throw new Error('Order number is required');
    
    return await apiService.get(`/orders/number/${orderNumber}`);
  }

  /**
   * Create new order
   */
  async createOrder(orderData) {
    if (!orderData) throw new Error('Order data is required');
    
    return await apiService.post('/orders', orderData);
  }

  /**
   * Update order
   */
  async updateOrder(orderId, orderData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!orderData) throw new Error('Order data is required');
    
    return await apiService.put(`/orders/${orderId}`, orderData);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, reason = '') {
    if (!orderId) throw new Error('Order ID is required');
    
    return await apiService.patch(`/orders/${orderId}/cancel`, { reason });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, notes = '') {
    if (!orderId) throw new Error('Order ID is required');
    if (!status) throw new Error('Status is required');
    
    return await apiService.patch(`/orders/${orderId}/status`, {
      status,
      notes,
    });
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId, options = {}) {
    if (!userId) throw new Error('User ID is required');
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = '',
    } = options;

    return await apiService.get(`/users/${userId}/orders`, {
      page,
      limit,
      status,
    });
  }

  /**
   * Get seller orders
   */
  async getSellerOrders(sellerId, options = {}) {
    if (!sellerId) throw new Error('Seller ID is required');
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = '',
    } = options;

    return await apiService.get(`/sellers/${sellerId}/orders`, {
      page,
      limit,
      status,
    });
  }

  /**
   * Get order items
   */
  async getOrderItems(orderId) {
    if (!orderId) throw new Error('Order ID is required');
    
    return await apiService.get(`/orders/${orderId}/items`);
  }

  /**
   * Add item to order
   */
  async addOrderItem(orderId, itemData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!itemData) throw new Error('Item data is required');
    
    return await apiService.post(`/orders/${orderId}/items`, itemData);
  }

  /**
   * Update order item
   */
  async updateOrderItem(orderId, itemId, itemData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!itemId) throw new Error('Item ID is required');
    if (!itemData) throw new Error('Item data is required');
    
    return await apiService.put(`/orders/${orderId}/items/${itemId}`, itemData);
  }

  /**
   * Remove item from order
   */
  async removeOrderItem(orderId, itemId) {
    if (!orderId) throw new Error('Order ID is required');
    if (!itemId) throw new Error('Item ID is required');
    
    return await apiService.delete(`/orders/${orderId}/items/${itemId}`);
  }

  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId) {
    if (!orderId) throw new Error('Order ID is required');
    
    return await apiService.get(`/orders/${orderId}/tracking`);
  }

  /**
   * Update tracking information
   */
  async updateOrderTracking(orderId, trackingData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!trackingData) throw new Error('Tracking data is required');
    
    return await apiService.put(`/orders/${orderId}/tracking`, trackingData);
  }

  /**
   * Get order shipping address
   */
  async getOrderShippingAddress(orderId) {
    if (!orderId) throw new Error('Order ID is required');
    
    return await apiService.get(`/orders/${orderId}/shipping`);
  }

  /**
   * Update shipping address
   */
  async updateOrderShippingAddress(orderId, addressData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!addressData) throw new Error('Address data is required');
    
    return await apiService.put(`/orders/${orderId}/shipping`, addressData);
  }

  /**
   * Get order invoice
   */
  async getOrderInvoice(orderId) {
    if (!orderId) throw new Error('Order ID is required');
    
    const response = await apiService.get(`/orders/${orderId}/invoice`);
    
    // Create download link for PDF
    const blob = new Blob([response], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${orderId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderId) {
    if (!orderId) throw new Error('Order ID is required');
    
    return await apiService.post(`/orders/${orderId}/send-confirmation`);
  }

  /**
   * Get order statistics
   */
  async getOrderStats(options = {}) {
    const {
      sellerId = '',
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      sellerId,
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/orders/stats', params);
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/orders/analytics/revenue', params);
  }

  /**
   * Get sales report
   */
  async getSalesReport(options = {}) {
    const {
      format = 'csv',
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      format,
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiService.get('/orders/report', params);
    
    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return response;
  }

  /**
   * Process order return
   */
  async processReturn(orderId, returnData) {
    if (!orderId) throw new Error('Order ID is required');
    if (!returnData) throw new Error('Return data is required');
    
    return await apiService.post(`/orders/${orderId}/return`, returnData);
  }

  /**
   * Get return requests
   */
  async getReturnRequests(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = '',
    } = options;

    return await apiService.get('/orders/returns', {
      page,
      limit,
      status,
    });
  }

  /**
   * Update return status
   */
  async updateReturnStatus(returnId, status, notes = '') {
    if (!returnId) throw new Error('Return ID is required');
    if (!status) throw new Error('Status is required');
    
    return await apiService.patch(`/orders/returns/${returnId}`, {
      status,
      notes,
    });
  }

  /**
   * Subscribe to order updates (realtime)
   */
  subscribeToOrderUpdates(orderId, callback) {
    return supabaseService.subscribe(
      `order:${orderId}`,
      'UPDATE',
      callback
    );
  }

  /**
   * Subscribe to new orders (realtime - for sellers/admins)
   */
  subscribeToNewOrders(callback) {
    return supabaseService.subscribe(
      'orders',
      'INSERT',
      callback
    );
  }
}

// Create singleton instance
export const orderService = new OrderService();

export default orderService;
