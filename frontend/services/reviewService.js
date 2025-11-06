import { http } from './api';

class ReviewService {
  // Récupérer les avis d'un produit
  async getProductReviews(productId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        rating,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(rating && { rating: parseInt(rating) })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/reviews/product/${productId}?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer un avis
  async createReview(reviewData) {
    try {
      const response = await http.post('/reviews', reviewData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour un avis
  async updateReview(reviewId, reviewData) {
    try {
      const response = await http.put(`/reviews/${reviewId}`, reviewData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer un avis
  async deleteReview(reviewId) {
    try {
      const response = await http.delete(`/reviews/${reviewId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Marquer un avis comme utile
  async markHelpful(reviewId) {
    try {
      const response = await http.post(`/reviews/${reviewId}/helpful`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Signaler un avis
  async reportReview(reviewId, reason) {
    try {
      const response = await http.post(`/reviews/${reviewId}/report`, { reason });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les avis de l'utilisateur
  async getUserReviews(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/reviews/user?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les avis en attente (vendeur)
  async getPendingReviews(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10
      } = filters;

      const params = {
        page,
        limit
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/reviews/pending?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Modérer un avis (admin/vendeur)
  async moderateReview(reviewId, action, reason = '') {
    try {
      const response = await http.post(`/reviews/${reviewId}/moderate`, {
        action,
        reason
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Répondre à un avis (vendeur)
  async replyToReview(reviewId, reply) {
    try {
      const response = await http.post(`/reviews/${reviewId}/reply`, { reply });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des avis d'un produit
  async getReviewStats(productId) {
    try {
      const response = await http.get(`/reviews/product/${productId}/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Avis vérifiés (acheteurs vérifiés)
  async getVerifiedReviews(productId) {
    try {
      const response = await http.get(`/reviews/product/${productId}/verified`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Review Service Error:', error);
    
    const reviewErrors = {
      'Review not found': 'Avis non trouvé',
      'Already reviewed': 'Vous avez déjà laissé un avis pour ce produit',
      'Purchase required': 'Vous devez avoir acheté ce produit pour laisser un avis',
      'Cannot modify review': 'Impossible de modifier cet avis',
    };

    const message = reviewErrors[error.message] || 
                   error.message || 
                   'Erreur lors du traitement de l\'avis';

    return {
      success: false,
      error: error.error || 'Review Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new ReviewService();
