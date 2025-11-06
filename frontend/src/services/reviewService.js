/**
 * Review service
 */

import { apiService } from './api';
import { PAGINATION } from '../utils/constants';

class ReviewService {
  /**
   * Get reviews for a product
   */
  async getProductReviews(productId, options = {}) {
    if (!productId) throw new Error('Product ID is required');
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'created_at',
      sortOrder = 'desc',
      rating = 0,
    } = options;

    return await apiService.get(`/products/${productId}/reviews`, {
      page,
      limit,
      sortBy,
      sortOrder,
      rating,
    });
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.get(`/reviews/${reviewId}`);
  }

  /**
   * Create review
   */
  async createReview(reviewData) {
    if (!reviewData) throw new Error('Review data is required');
    if (!reviewData.productId) throw new Error('Product ID is required');
    
    return await apiService.post('/reviews', reviewData);
  }

  /**
   * Update review
   */
  async updateReview(reviewId, reviewData) {
    if (!reviewId) throw new Error('Review ID is required');
    if (!reviewData) throw new Error('Review data is required');
    
    return await apiService.put(`/reviews/${reviewId}`, reviewData);
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.delete(`/reviews/${reviewId}`);
  }

  /**
   * Get user reviews
   */
  async getUserReviews(userId, options = {}) {
    if (!userId) throw new Error('User ID is required');
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options;

    return await apiService.get(`/users/${userId}/reviews`, {
      page,
      limit,
    });
  }

  /**
   * Get seller reviews
   */
  async getSellerReviews(sellerId, options = {}) {
    if (!sellerId) throw new Error('Seller ID is required');
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options;

    return await apiService.get(`/sellers/${sellerId}/reviews`, {
      page,
      limit,
    });
  }

  /**
   * Get review statistics for product
   */
  async getProductReviewStats(productId) {
    if (!productId) throw new Error('Product ID is required');
    
    return await apiService.get(`/products/${productId}/reviews/stats`);
  }

  /**
   * Get review statistics for seller
   */
  async getSellerReviewStats(sellerId) {
    if (!sellerId) throw new Error('Seller ID is required');
    
    return await apiService.get(`/sellers/${sellerId}/reviews/stats`);
  }

  /**
   * Like review
   */
  async likeReview(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.post(`/reviews/${reviewId}/like`);
  }

  /**
   * Unlike review
   */
  async unlikeReview(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.delete(`/reviews/${reviewId}/like`);
  }

  /**
   * Report review
   */
  async reportReview(reviewId, reason) {
    if (!reviewId) throw new Error('Review ID is required');
    if (!reason) throw new Error('Reason is required');
    
    return await apiService.post(`/reviews/${reviewId}/report`, { reason });
  }

  /**
   * Get reported reviews (admin)
   */
  async getReportedReviews(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = 'pending',
    } = options;

    return await apiService.get('/reviews/reported', {
      page,
      limit,
      status,
    });
  }

  /**
   * Update report status (admin)
   */
  async updateReportStatus(reportId, status, notes = '') {
    if (!reportId) throw new Error('Report ID is required');
    if (!status) throw new Error('Status is required');
    
    return await apiService.patch(`/reviews/reports/${reportId}`, {
      status,
      notes,
    });
  }

  /**
   * Get review replies
   */
  async getReviewReplies(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.get(`/reviews/${reviewId}/replies`);
  }

  /**
   * Add reply to review (seller)
   */
  async addReply(reviewId, content) {
    if (!reviewId) throw new Error('Review ID is required');
    if (!content) throw new Error('Content is required');
    
    return await apiService.post(`/reviews/${reviewId}/replies`, { content });
  }

  /**
   * Update reply
   */
  async updateReply(reviewId, replyId, content) {
    if (!reviewId) throw new Error('Review ID is required');
    if (!replyId) throw new Error('Reply ID is required');
    if (!content) throw new Error('Content is required');
    
    return await apiService.put(`/reviews/${reviewId}/replies/${replyId}`, { content });
  }

  /**
   * Delete reply
   */
  async deleteReply(reviewId, replyId) {
    if (!reviewId) throw new Error('Review ID is required');
    if (!replyId) throw new Error('Reply ID is required');
    
    return await apiService.delete(`/reviews/${reviewId}/replies/${replyId}`);
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.post(`/reviews/${reviewId}/helpful`);
  }

  /**
   * Unmark review as helpful
   */
  async unmarkHelpful(reviewId) {
    if (!reviewId) throw new Error('Review ID is required');
    
    return await apiService.delete(`/reviews/${reviewId}/helpful`);
  }

  /**
   * Verify purchase for review (check if user can review)
   */
  async verifyPurchase(productId, userId) {
    if (!productId) throw new Error('Product ID is required');
    if (!userId) throw new Error('User ID is required');
    
    return await apiService.get(`/reviews/verify-purchase`, {
      productId,
      userId,
    });
  }

  /**
   * Get recent reviews
   */
  async getRecentReviews(limit = 10) {
    return await apiService.get('/reviews/recent', { limit });
  }

  /**
   * Get top rated products
   */
  async getTopRatedProducts(limit = 10) {
    return await apiService.get('/reviews/top-rated', { limit });
  }

  /**
   * Bulk update reviews (admin)
   */
  async bulkUpdateReviews(reviewIds, updates) {
    if (!reviewIds || !reviewIds.length) throw new Error('Review IDs are required');
    if (!updates) throw new Error('Updates are required');
    
    return await apiService.patch('/reviews/bulk-update', {
      reviewIds,
      updates,
    });
  }

  /**
   * Export reviews (admin/seller)
   */
  async exportReviews(options = {}) {
    const {
      format = 'csv',
      startDate = '',
      endDate = '',
      productId = '',
      sellerId = '',
    } = options;

    const params = {
      format,
      startDate,
      endDate,
      productId,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiService.get('/reviews/export', params);
    
    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return response;
  }
}

// Create singleton instance
export const reviewService = new ReviewService();

export default reviewService;
