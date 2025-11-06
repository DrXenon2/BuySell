import { http } from './api';
import supabaseClient from './supabaseClient';

class CategoryService {
  // Récupérer toutes les catégories
  async getCategories(params = {}) {
    try {
      const {
        includeProducts = false,
        includeCount = true,
        parentOnly = false,
        featured = false
      } = params;

      const queryParams = new URLSearchParams({
        include_products: includeProducts,
        include_count: includeCount,
        parent_only: parentOnly,
        featured: featured
      }).toString();

      const response = await http.get(`/categories?${queryParams}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer une catégorie par ID
  async getCategoryById(id) {
    try {
      const response = await http.get(`/categories/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer une catégorie par slug
  async getCategoryBySlug(slug) {
    try {
      const response = await http.get(`/categories/slug/${slug}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les produits d'une catégorie
  async getCategoryProducts(categoryId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        sortBy = 'created_at',
        sortOrder = 'desc',
        minPrice,
        maxPrice,
        inStock
      } = filters;

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(inStock !== undefined && { in_stock: inStock })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/categories/${categoryId}/products?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les sous-catégories
  async getSubcategories(parentId) {
    try {
      const response = await http.get(`/categories/${parentId}/subcategories`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Rechercher des catégories
  async searchCategories(query) {
    try {
      const response = await http.get(`/categories/search?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Catégories populaires
  async getPopularCategories(limit = 10) {
    try {
      const response = await http.get(`/categories/popular?limit=${limit}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Arbre des catégories
  async getCategoryTree() {
    try {
      const response = await http.get('/categories/tree');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer une catégorie (admin)
  async createCategory(categoryData) {
    try {
      const response = await http.post('/categories', categoryData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour une catégorie (admin)
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await http.put(`/categories/${categoryId}`, categoryData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer une catégorie (admin)
  async deleteCategory(categoryId) {
    try {
      const response = await http.delete(`/categories/${categoryId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader l'image d'une catégorie
  async uploadCategoryImage(categoryId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await http.post(`/categories/${categoryId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Souscrire aux changements en temps réel
  subscribeToCategoryChanges(callback) {
    return supabaseClient
      .channel('category-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        callback
      )
      .subscribe();
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Category Service Error:', error);
    
    return {
      success: false,
      error: error.error || 'Category Service Error',
      message: error.message || 'Erreur lors de la récupération des catégories',
      status: error.status,
      originalError: error,
    };
  }
}

export default new CategoryService();
