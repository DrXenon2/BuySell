import { http } from './api';

class UserService {
  // Récupérer le profil utilisateur
  async getProfile() {
    try {
      const response = await http.get('/users/profile');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour le profil
  async updateProfile(profileData) {
    try {
      const response = await http.put('/users/profile', profileData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Changer la photo de profil
  async updateAvatar(imageFile) {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);

      const response = await http.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gérer les adresses
  async getAddresses() {
    try {
      const response = await http.get('/users/addresses');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addAddress(addressData) {
    try {
      const response = await http.post('/users/addresses', addressData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAddress(addressId, addressData) {
    try {
      const response = await http.put(`/users/addresses/${addressId}`, addressData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAddress(addressId) {
    try {
      const response = await http.delete(`/users/addresses/${addressId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gérer la liste de souhaits
  async getWishlist() {
    try {
      const response = await http.get('/users/wishlist');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addToWishlist(productId) {
    try {
      const response = await http.post('/users/wishlist', { productId });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeFromWishlist(productId) {
    try {
      const response = await http.delete(`/users/wishlist/${productId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gérer les paramètres de notification
  async getNotificationSettings() {
    try {
      const response = await http.get('/users/notifications/settings');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateNotificationSettings(settings) {
    try {
      const response = await http.put('/users/notifications/settings', settings);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Historique des commandes
  async getOrderHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await http.get(`/users/orders?${queryParams}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques utilisateur
  async getUserStats() {
    try {
      const response = await http.get('/users/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Désactiver le compte
  async deactivateAccount() {
    try {
      const response = await http.post('/users/deactivate');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Exporter les données
  async exportData() {
    try {
      const response = await http.get('/users/export-data');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('User Service Error:', error);
    
    return {
      success: false,
      error: error.error || 'User Service Error',
      message: error.message || 'Une erreur est survenue',
      status: error.status,
      originalError: error,
    };
  }
}

export default new UserService();
