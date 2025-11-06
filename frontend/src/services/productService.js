/**
 * Product service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';
import { PAGINATION } from '../utils/constants';

class ProductService {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      category = '',
      search = '',
      minPrice = 0,
      maxPrice = 1000000,
      sortBy = 'created_at',
      sortOrder = 'desc',
      inStock = false,
      onSale = false,
    } = options;

    const params = {
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      inStock,
      onSale,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/products', params);
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');
    
    return await apiService.get(`/products/${id}`);
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug) {
    if (!slug) throw new Error('Product slug is required');
    
    return await apiService.get(`/products/slug/${slug}`);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    return await apiService.get('/products/featured', { limit });
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId, limit = 4) {
    return await apiService.get(`/products/${productId}/related`, { limit });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    return await apiService.get(`/categories/${categoryId}/products`, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Search products
   */
  async searchProducts(query, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      category = '',
      minPrice = 0,
      maxPrice = 1000000,
      sortBy = 'relevance',
    } = options;

    return await apiService.get('/products/search', {
      q: query,
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      sortBy,
    });
  }

  /**
   * Create new product (seller)
   */
  async createProduct(productData) {
    if (!productData) throw new Error('Product data is required');
    
    return await apiService.post('/products', productData);
  }

  /**
   * Update product (seller)
   */
  async updateProduct(productId, productData) {
    if (!productId) throw new Error('Product ID is required');
    if (!productData) throw new Error('Product data is required');
    
    return await apiService.put(`/products/${productId}`, productData);
  }

  /**
   * Delete product (seller/admin)
   */
  async deleteProduct(productId) {
    if (!productId) throw new Error('Product ID is required');
    
    return await apiService.delete(`/products/${productId}`);
  }

  /**
   * Update product inventory
   */
  async updateInventory(productId, stock) {
    if (!productId) throw new Error('Product ID is required');
    if (stock === undefined) throw new Error('Stock quantity is required');
    
    return await apiService.patch(`/products/${productId}/inventory`, { stock });
  }

  /**
   * Update product status
   */
  async updateStatus(productId, status) {
    if (!productId) throw new Error('Product ID is required');
    if (!status) throw new Error('Status is required');
    
    return await apiService.patch(`/products/${productId}/status`, { status });
  }

  /**
   * Upload product images
   */
  async uploadProductImages(productId, images) {
    if (!productId) throw new Error('Product ID is required');
    if (!images || !images.length) throw new Error('Images are required');
    
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    return await apiService.upload(`/products/${productId}/images`, formData);
  }

  /**
   * Delete product image
   */
  async deleteProductImage(productId, imageId) {
    if (!productId) throw new Error('Product ID is required');
    if (!imageId) throw new Error('Image ID is required');
    
    return await apiService.delete(`/products/${productId}/images/${imageId}`);
  }

  /**
   * Get product categories
   */
  async getCategories() {
    return await apiService.get('/categories');
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    if (!id) throw new Error('Category ID is required');
    
    return await apiService.get(`/categories/${id}`);
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug) {
    if (!slug) throw new Error('Category slug is required');
    
    return await apiService.get(`/categories/slug/${slug}`);
  }

  /**
   * Create category (admin)
   */
  async createCategory(categoryData) {
    if (!categoryData) throw new Error('Category data is required');
    
    return await apiService.post('/categories', categoryData);
  }

  /**
   * Update category (admin)
   */
  async updateCategory(categoryId, categoryData) {
    if (!categoryId) throw new Error('Category ID is required');
    if (!categoryData) throw new Error('Category data is required');
    
    return await apiService.put(`/categories/${categoryId}`, categoryData);
  }

  /**
   * Delete category (admin)
   */
  async deleteCategory(categoryId) {
    if (!categoryId) throw new Error('Category ID is required');
    
    return await apiService.delete(`/categories/${categoryId}`);
  }

  /**
   * Get product statistics (seller)
   */
  async getProductStats(sellerId = null) {
    const endpoint = sellerId 
      ? `/products/stats?sellerId=${sellerId}`
      : '/products/stats';
    
    return await apiService.get(endpoint);
  }

  /**
   * Get low stock products (seller)
   */
  async getLowStockProducts(threshold = 5) {
    return await apiService.get('/products/low-stock', { threshold });
  }

  /**
   * Bulk update products (seller/admin)
   */
  async bulkUpdateProducts(productIds, updates) {
    if (!productIds || !productIds.length) throw new Error('Product IDs are required');
    if (!updates) throw new Error('Updates are required');
    
    return await apiService.patch('/products/bulk-update', {
      productIds,
      updates,
    });
  }

  /**
   * Import products from CSV (seller/admin)
   */
  async importProductsFromCSV(file) {
    if (!file) throw new Error('CSV file is required');
    
    const formData = new FormData();
    formData.append('file', file);

    return await apiService.upload('/products/import', formData);
  }

  /**
   * Export products to CSV (seller/admin)
   */
  async exportProductsToCSV(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString 
      ? `/products/export?${queryString}`
      : '/products/export';

    const response = await apiService.get(endpoint);
    
    // Create download link
    const blob = new Blob([response], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Subscribe to product updates (realtime)
   */
  subscribeToProductUpdates(productId, callback) {
    return supabaseService.subscribe(
      `product:${productId}`,
      'UPDATE',
      callback
    );
  }

  /**
   * Subscribe to new products (realtime)
   */
  subscribeToNewProducts(callback) {
    return supabaseService.subscribe(
      'products',
      'INSERT',
      callback
    );
  }
}

// Create singleton instance
export const productService = new ProductService();

export default productService;
