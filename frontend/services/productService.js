import { http } from './api';
import supabaseClient from './supabaseClient';

class ProductService {
  // Récupérer tous les produits avec pagination et filtres
  async getProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        search,
        minPrice,
        maxPrice,
        sortBy = 'created_at',
        sortOrder = 'desc',
        inStock,
        onSale,
        featured,
        sellerId
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(category && { category }),
        ...(search && { search }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(inStock !== undefined && { in_stock: inStock }),
        ...(onSale !== undefined && { on_sale: onSale }),
        ...(featured !== undefined && { featured }),
        ...(sellerId && { seller_id: sellerId })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/products?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer un produit par ID
  async getProductById(id) {
    try {
      const response = await http.get(`/products/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer un produit par slug
  async getProductBySlug(slug) {
    try {
      const response = await http.get(`/products/slug/${slug}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Recherche de produits
  async searchProducts(query, options = {}) {
    try {
      const params = {
        q: query,
        ...options
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/products/search?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Produits similaires
  async getSimilarProducts(productId, limit = 6) {
    try {
      const response = await http.get(`/products/${productId}/similar?limit=${limit}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Produits populaires
  async getPopularProducts(limit = 8) {
    try {
      const response = await http.get(`/products/popular?limit=${limit}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Produits récemment consultés
  async getRecentlyViewed(limit = 6) {
    try {
      // Récupérer depuis le localStorage
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      if (viewed.length === 0) {
        return { success: true, data: [] };
      }

      // Récupérer les détails des produits
      const productIds = viewed.slice(0, limit).join(',');
      const response = await http.get(`/products/batch?ids=${productIds}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ajouter un produit aux récemment consultés
  async addToRecentlyViewed(productId) {
    try {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      // Retirer si déjà présent
      const filtered = viewed.filter(id => id !== productId);
      
      // Ajouter au début
      filtered.unshift(productId);
      
      // Garder seulement les 20 derniers
      const recent = filtered.slice(0, 20);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(recent));
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  }

  // Créer un produit (vendeur/admin)
  async createProduct(productData) {
    try {
      const response = await http.post('/products', productData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour un produit (vendeur/admin)
  async updateProduct(productId, productData) {
    try {
      const response = await http.put(`/products/${productId}`, productData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer un produit (vendeur/admin)
  async deleteProduct(productId) {
    try {
      const response = await http.delete(`/products/${productId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gérer les images du produit
  async uploadProductImages(productId, images) {
    try {
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await http.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteProductImage(productId, imageId) {
    try {
      const response = await http.delete(`/products/${productId}/images/${imageId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gérer l'inventaire
  async updateInventory(productId, inventoryData) {
    try {
      const response = await http.patch(`/products/${productId}/inventory`, inventoryData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vérifier la disponibilité
  async checkAvailability(productId, quantity = 1) {
    try {
      const response = await http.get(`/products/${productId}/availability?quantity=${quantity}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Statistiques des produits (vendeur)
  async getProductStats(productId) {
    try {
      const response = await http.get(`/products/${productId}/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Souscrire aux changements en temps réel
  subscribeToProductChanges(callback) {
    return supabaseClient
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        callback
      )
      .subscribe();
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Product Service Error:', error);
    
    const productErrors = {
      'Product not found': 'Produit non trouvé',
      'Insufficient stock': 'Stock insuffisant',
      'Product not available': 'Produit non disponible',
    };

    const message = productErrors[error.message] || 
                   error.message || 
                   'Erreur lors de la récupération des produits';

    return {
      success: false,
      error: error.error || 'Product Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new ProductService();
