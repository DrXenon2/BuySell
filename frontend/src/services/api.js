/**
 * API service - Configuration et fonctions générales pour les appels API
 */

import { STORAGE_KEYS, ERROR_MESSAGES } from '../utils/constants';
import { handleApiError, isAuthError } from '../utils/errorHandler';

// Configuration de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Classe ApiService pour gérer les appels HTTP
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get stored token
   */
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return null;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  }

  /**
   * Remove authentication token
   */
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.getAuthHeaders(),
      timeout: this.timeout,
      ...options,
    };

    // Add body for non-GET requests
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') 
        ? await response.json() 
        : await response.text();

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: data,
          },
          message: data?.message || ERROR_MESSAGES.SERVER_ERROR,
        };
      }

      return data;
    } catch (error) {
      const formattedError = handleApiError(error);
      
      // Auto-logout on auth errors
      if (isAuthError(error)) {
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw formattedError;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   */
  async upload(endpoint, formData, onProgress = null) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(handleApiError({
            response: {
              status: xhr.status,
              data: xhr.responseText,
            },
          }));
        }
      });

      xhr.addEventListener('error', () => {
        reject(handleApiError({
          response: null,
          message: ERROR_MESSAGES.NETWORK_ERROR,
        }));
      });

      xhr.addEventListener('timeout', () => {
        reject(handleApiError({
          response: null,
          message: ERROR_MESSAGES.TIMEOUT_ERROR,
        }));
      });

      xhr.open('POST', url);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.timeout = this.timeout;
      xhr.send(formData);
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const api = {
  get: (endpoint, params) => apiService.get(endpoint, params),
  post: (endpoint, data) => apiService.post(endpoint, data),
  put: (endpoint, data) => apiService.put(endpoint, data),
  patch: (endpoint, data) => apiService.patch(endpoint, data),
  delete: (endpoint) => apiService.delete(endpoint),
  upload: (endpoint, formData, onProgress) => apiService.upload(endpoint, formData, onProgress),
};

export default apiService;
