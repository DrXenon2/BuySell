import { http } from './api';
import supabaseClient from './supabaseClient';

class OrderService {
  // Créer une commande
  async createOrder(orderData) {
    try {
      const response = await http.post('/orders', orderData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les commandes de l'utilisateur
  async getUserOrders(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(status && { status })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/orders?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer une commande par ID
  async getOrderById(orderId) {
    try {
      const response = await http.get(`/orders/${orderId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Annuler une commande
  async cancelOrder(orderId, reason = '') {
    try {
      const response = await http.post(`/orders/${orderId}/cancel`, { reason });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Suivi de commande
  async trackOrder(orderId) {
    try {
      const response = await http.get(`/orders/${orderId}/tracking`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour l'adresse de livraison
  async updateShippingAddress(orderId, address) {
    try {
      const response = await http.put(`/orders/${orderId}/shipping-address`, address);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Télécharger la facture
  async downloadInvoice(orderId) {
    try {
      const response = await http.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      
      if (response.success) {
        // Créer un URL pour le téléchargement
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `facture-${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Répéter une commande
  async reorder(orderId) {
    try {
      const response = await http.post(`/orders/${orderId}/reorder`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Évaluer une commande
  async rateOrder(orderId, ratings) {
    try {
      const response = await http.post(`/orders/${orderId}/rate`, { ratings });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Commandes du vendeur
  async getSellerOrders(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(status && { status })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/orders/seller?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour le statut de commande (vendeur)
  async updateOrderStatus(orderId, status, note = '') {
    try {
      const response = await http.put(`/orders/${orderId}/status`, { status, note });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des commandes (vendeur)
  async getOrderStats(period = 'month') {
    try {
      const response = await http.get(`/orders/stats?period=${period}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Souscrire aux changements en temps réel
  subscribeToOrderChanges(callback) {
    return supabaseClient
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        callback
      )
      .subscribe();
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Order Service Error:', error);
    
    const orderErrors = {
      'Order not found': 'Commande non trouvée',
      'Cannot cancel order': 'Impossible d\'annuler cette commande',
      'Invalid order status': 'Statut de commande invalide',
      'Order already cancelled': 'Commande déjà annulée',
    };

    const message = orderErrors[error.message] || 
                   error.message || 
                   'Erreur lors du traitement de la commande';

    return {
      success: false,
      error: error.error || 'Order Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new OrderService();
