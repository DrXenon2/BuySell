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

export { http, upload };
export default api;
