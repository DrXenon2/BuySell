import { http } from './api';

class AnalyticsService {
  // Suivi des vues de page
  trackPageView(page, additionalData = {}) {
    if (typeof window === 'undefined') return;

    const analyticsData = {
      event: 'page_view',
      page,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      language: navigator.language,
      referrer: document.referrer,
      ...additionalData
    };

    this.sendToAnalytics(analyticsData);
  }

  // Suivi des événements
  trackEvent(category, action, label = null, value = null) {
    if (typeof window === 'undefined') return;

    const eventData = {
      event: 'custom_event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    this.sendToAnalytics(eventData);
  }

  // Suivi des produits vus
  trackProductView(product) {
    this.trackEvent('products', 'view', product.id, product.price);
    
    // Sauvegarder dans l'historique local
    this.addToRecentlyViewed(product.id);
  }

  // Suivi des recherches
  trackSearch(query, resultsCount = 0) {
    this.trackEvent('search', 'perform', query, resultsCount);
  }

  // Suivi de l'ajout au panier
  trackAddToCart(product, quantity = 1) {
    this.trackEvent('cart', 'add', product.id, quantity);
  }

  // Suivi du processus de checkout
  trackCheckoutStep(step, orderData = {}) {
    this.trackEvent('checkout', `step_${step}`, null, null);
  }

  // Suivi des conversions
  trackPurchase(order) {
    this.trackEvent('purchase', 'complete', order.id, order.total_amount);
  }

  // Envoyer les données d'analytics
  async sendToAnalytics(data) {
    try {
      // Envoyer au backend pour stockage
      await http.post('/analytics/track', data);
      
      // Envoyer à Google Analytics 4 (si configuré)
      if (window.gtag) {
        window.gtag('event', data.event, {
          ...data,
          send_to: process.env.NEXT_PUBLIC_GA4_ID
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
      // Ne pas bloquer l'application en cas d'erreur d'analytics
    }
  }

  // Récupérer les statistiques du tableau de bord
  async getDashboardStats(period = '7d') {
    try {
      const response = await http.get(`/analytics/dashboard?period=${period}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des ventes
  async getSalesStats(period = '30d', filters = {}) {
    try {
      const params = new URLSearchParams({
        period,
        ...filters
      }).toString();

      const response = await http.get(`/analytics/sales?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des produits
  async getProductStats(productId = null, period = '30d') {
    try {
      const params = new URLSearchParams({ period });
      if (productId) params.append('product_id', productId);

      const response = await http.get(`/analytics/products?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des utilisateurs
  async getUserStats(period = '30d') {
    try {
      const response = await http.get(`/analytics/users?period=${period}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Rapports personnalisés
  async getCustomReport(reportType, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/analytics/reports/${reportType}?${queryString}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Top produits
  async getTopProducts(limit = 10, period = '30d') {
    try {
      const response = await http.get(
        `/analytics/top-products?limit=${limit}&period=${period}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Top catégories
  async getTopCategories(limit = 10, period = '30d') {
    try {
      const response = await http.get(
        `/analytics/top-categories?limit=${limit}&period=${period}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Performance des vendeurs
  async getSellerPerformance(sellerId = null, period = '30d') {
    try {
      const params = new URLSearchParams({ period });
      if (sellerId) params.append('seller_id', sellerId);

      const response = await http.get(`/analytics/sellers?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Données de trafic
  async getTrafficData(period = '7d') {
    try {
      const response = await http.get(`/analytics/traffic?period=${period}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Taux de conversion
  async getConversionRates(period = '30d') {
    try {
      const response = await http.get(`/analytics/conversion?period=${period}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export des données
  async exportAnalyticsData(format = 'csv', params = {}) {
    try {
      const queryString = new URLSearchParams({ format, ...params }).toString();
      const response = await http.get(`/analytics/export?${queryString}`, {
        responseType: 'blob'
      });
      
      if (response.success) {
        // Télécharger le fichier
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics-export.${format}`);
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

  // Ajouter aux récemment consultés (méthode utilitaire)
  addToRecentlyViewed(productId) {
    if (typeof window === 'undefined') return;

    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = viewed.filter(id => id !== productId);
    filtered.unshift(productId);
    
    // Garder seulement les 20 derniers
    const recent = filtered.slice(0, 20);
    localStorage.setItem('recentlyViewed', JSON.stringify(recent));
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Analytics Service Error:', error);
    
    return {
      success: false,
      error: error.error || 'Analytics Service Error',
      message: error.message || 'Erreur lors de la récupération des statistiques',
      status: error.status,
      originalError: error,
    };
  }
}

export default new AnalyticsService();
