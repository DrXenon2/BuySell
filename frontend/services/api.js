import axios from 'axios';
import { getSession } from 'next-auth/react';

// Configuration de base d'Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Instance Axios principale
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    try {
      // Récupérer la session pour NextAuth
      const session = await getSession();
      
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
      
      // Ajouter un ID de requête pour le tracking
      config.headers['X-Request-ID'] = generateRequestId();
      
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    // Transforme la réponse pour un format standard
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  },
  (error) => {
    // Gestion centralisée des erreurs
    const errorResponse = {
      success: false,
      error: 'Erreur réseau',
      message: 'Impossible de contacter le serveur',
      status: error.response?.status,
      data: error.response?.data
    };

    if (error.response) {
      // Erreur du serveur
      const { status, data } = error.response;
      
      errorResponse.status = status;
      errorResponse.error = data?.error || 'Erreur serveur';
      errorResponse.message = data?.message || 'Une erreur est survenue';
      errorResponse.data = data;

      // Gestion spécifique des codes d'erreur
      switch (status) {
        case 401:
          errorResponse.message = 'Session expirée. Veuillez vous reconnecter.';
          // Déconnexion automatique
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?session=expired';
          }
          break;
        case 403:
          errorResponse.message = 'Accès non autorisé';
          break;
        case 404:
          errorResponse.message = 'Ressource non trouvée';
          break;
        case 429:
          errorResponse.message = 'Trop de requêtes. Veuillez patienter.';
          break;
        case 500:
          errorResponse.message = 'Erreur interne du serveur';
          break;
        default:
          errorResponse.message = data?.message || 'Erreur inconnue';
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      errorResponse.error = 'Network Error';
      errorResponse.message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    console.error('API Error:', errorResponse);
    return Promise.reject(errorResponse);
  }
);

// Génère un ID unique pour chaque requête
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Méthodes HTTP utilitaires
const http = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
};

// Méthodes spécifiques pour l'upload de fichiers
const upload = (url, formData, onProgress = null) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.buysell.ci/v1'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Produits
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/products?${queryString}`)
  }

  async getProduct(id) {
    return this.request(`/products/${id}`)
  }

  async getFeaturedProducts() {
    return this.request('/products/featured')
  }

  async getOfficialStoreProducts() {
    return this.request('/products/official-stores')
  }

  async getDjassaProducts() {
    return this.request('/products/djassa')
  }

  // Catégories
  async getCategories() {
    return this.request('/categories')
  }

  async getCategory(slug) {
    return this.request(`/categories/${slug}`)
  }

  // Panier
  async getCart() {
    return this.request('/cart', {
      headers: this.getAuthHeaders()
    })
  }

  async addToCart(productId, quantity = 1, variantId = null) {
    return this.request('/cart/items', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ productId, quantity, variantId })
    })
  }

  async updateCartItem(itemId, quantity) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ quantity })
    })
  }

  async removeCartItem(itemId) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
  }

  // Commandes
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
  }

  async getOrders() {
    return this.request('/orders', {
      headers: this.getAuthHeaders()
    })
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`, {
      headers: this.getAuthHeaders()
    })
  }

  // Paiements
  async initiatePayment(paymentData) {
    return this.request('/payments/initiate', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(paymentData)
    })
  }

  async confirmPayment(paymentId) {
    return this.request(`/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
  }

  // Authentification
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async getProfile() {
    return this.request('/auth/profile', {
      headers: this.getAuthHeaders()
    })
  }

  // Vendeurs
  async getSellerDashboard() {
    return this.request('/seller/dashboard', {
      headers: this.getAuthHeaders()
    })
  }

  async createProduct(productData) {
    return this.request('/seller/products', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData)
    })
  }

  // Support
  async getFAQs() {
    return this.request('/support/faqs')
  }

  async createSupportTicket(ticketData) {
    return this.request('/support/tickets', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(ticketData)
    })
  }

  // Utilitaires
  getAuthHeaders() {
    const token = localStorage.getItem('buysell_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}

export const apiService = new ApiService()

export { http, upload };
export default api;

