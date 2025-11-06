/**
 * Service de gestion des produits de seconde main (Djassa) pour Buysell
 * Articles d'occasion, évaluation, prix et conditions
 */

import { supabaseClient } from './supabaseClient';

class SecondHandService {
  constructor() {
    this.supabase = supabaseClient;
    this.conditions = {
      EXCELLENT: { value: 'excellent', label: 'Excellent état', discount: 0.1 },
      VERY_GOOD: { value: 'very_good', label: 'Très bon état', discount: 0.2 },
      GOOD: { value: 'good', label: 'Bon état', discount: 0.3 },
      FAIR: { value: 'fair', label: 'État correct', discount: 0.4 },
      POOR: { value: 'poor', label: 'État moyen', discount: 0.5 }
    };
  }

  /**
   * Obtenir les produits de seconde main
   */
  async getSecondHandProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        condition = null,
        minPrice = null,
        maxPrice = null,
        location = null,
        sellerRating = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('second_hand_products')
        .select(`
          *,
          categories (name, slug),
          sellers:users!seller_id (
            id,
            username,
            avatar_url,
            seller_rating,
            response_rate,
            joined_at
          ),
          product_images (url, is_primary),
          condition:condition_type (label, description)
        `)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      // Appliquer les filtres
      if (category) {
        query = query.eq('category_id', category);
      }

      if (condition) {
        query = query.eq('condition_type', condition);
      }

      if (minPrice !== null) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (sellerRating !== null) {
        query = query.gte('sellers.seller_rating', sellerRating);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        products: data.map(product => this.formatSecondHandProduct(product)),
        pagination: {
          page,
          limit,
          total: await this.getSecondHandProductsCount(options),
          totalPages: Math.ceil(await this.getSecondHandProductsCount(options) / limit)
        }
      };
    } catch (error) {
      console.error('Erreur récupération produits seconde main:', error);
      throw new Error('Impossible de récupérer les produits de seconde main');
    }
  }

  /**
   * Obtenir un produit de seconde main spécifique
   */
  async getSecondHandProduct(productId) {
    try {
      const { data, error } = await this.supabase
        .from('second_hand_products')
        .select(`
          *,
          categories (name, slug),
          sellers:users!seller_id (
            id,
            username,
            avatar_url,
            seller_rating,
            response_rate,
            total_sales,
            joined_at,
            verified
          ),
          product_images (url, is_primary, caption),
          condition:condition_type (label, description, discount_rate),
          product_authenticity (is_verified, verification_date, verified_by)
        `)
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return this.formatSecondHandProduct(data, true);
    } catch (error) {
      console.error('Erreur récupération produit seconde main:', error);
      throw new Error('Produit non trouvé');
    }
  }

  /**
   * Rechercher des produits de seconde main
   */
  async searchSecondHandProducts(query, filters = {}) {
    try {
      const {
        category = null,
        condition = null,
        minPrice = null,
        maxPrice = null,
        location = null,
        limit = 20
      } = filters;

      let searchQuery = this.supabase
        .from('second_hand_products')
        .select(`
          *,
          categories (name),
          sellers:users!seller_id (username, seller_rating),
          product_images (url)
        `)
        .eq('is_active', true)
        .eq('is_approved', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(limit);

      if (category) {
        searchQuery = searchQuery.eq('category_id', category);
      }

      if (condition) {
        searchQuery = searchQuery.eq('condition_type', condition);
      }

      if (minPrice !== null) {
        searchQuery = searchQuery.gte('price', minPrice);
      }

      if (maxPrice !== null) {
        searchQuery = searchQuery.lte('price', maxPrice);
      }

      if (location) {
        searchQuery = searchQuery.ilike('location', `%${location}%`);
      }

      const { data, error } = await searchQuery;

      if (error) throw error;

      return data.map(product => this.formatSecondHandProduct(product));
    } catch (error) {
      console.error('Erreur recherche produits seconde main:', error);
      return [];
    }
  }

  /**
   * Obtenir les produits similaires
   */
  async getSimilarSecondHandProducts(productId, limit = 8) {
    try {
      // Obtenir le produit actuel pour trouver des similaires
      const currentProduct = await this.getSecondHandProduct(productId);

      const { data, error } = await this.supabase
        .from('second_hand_products')
        .select(`
          *,
          categories (name),
          sellers:users!seller_id (username, seller_rating),
          product_images (url)
        `)
        .eq('category_id', currentProduct.category.id)
        .eq('is_active', true)
        .eq('is_approved', true)
        .neq('id', productId)
        .limit(limit);

      if (error) throw error;

      return data.map(product => this.formatSecondHandProduct(product));
    } catch (error) {
      console.error('Erreur récupération produits similaires:', error);
      return [];
    }
  }

  /**
   * Obtenir les produits tendance de seconde main
   */
  async getTrendingSecondHand(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('second_hand_products')
        .select(`
          *,
          categories (name),
          sellers:users!seller_id (username, seller_rating),
          product_images (url),
          product_views (view_count)
        `)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('product_views.view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(product => this.formatSecondHandProduct(product));
    } catch (error) {
      console.error('Erreur récupération produits tendance:', error);
      return [];
    }
  }

  /**
   * Créer une annonce de produit de seconde main
   */
  async createSecondHandListing(listingData, sellerId) {
    try {
      const {
        title,
        description,
        categoryId,
        brand,
        condition,
        originalPrice,
        sellingPrice,
        location,
        images,
        attributes = {}
      } = listingData;

      // Valider les données
      const validation = this.validateListingData(listingData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Calculer le prix recommandé
      const recommendedPrice = this.calculateRecommendedPrice(originalPrice, condition);

      const { data, error } = await this.supabase
        .from('second_hand_products')
        .insert({
          seller_id: sellerId,
          title,
          description,
          category_id: categoryId,
          brand,
          condition_type: condition,
          original_price: originalPrice,
          price: sellingPrice || recommendedPrice,
          recommended_price: recommendedPrice,
          location,
          attributes,
          is_active: true,
          is_approved: false, // Nécessite approbation
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Upload des images
      if (images && images.length > 0) {
        await this.uploadProductImages(data.id, images);
      }

      return {
        success: true,
        productId: data.id,
        listing: this.formatSecondHandProduct(data),
        message: 'Annonce créée avec succès. En attente de modération.'
      };
    } catch (error) {
      console.error('Erreur création annonce:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mettre à jour une annonce de seconde main
   */
  async updateSecondHandListing(productId, updates, sellerId) {
    try {
      // Vérifier que le vendeur est propriétaire du produit
      const { data: existingProduct } = await this.supabase
        .from('second_hand_products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      if (!existingProduct || existingProduct.seller_id !== sellerId) {
        throw new Error('Non autorisé à modifier cette annonce');
      }

      // Recalculer le prix si nécessaire
      if (updates.condition || updates.originalPrice) {
        const condition = updates.condition || existingProduct.condition_type;
        const originalPrice = updates.originalPrice || existingProduct.original_price;
        updates.recommended_price = this.calculateRecommendedPrice(originalPrice, condition);
      }

      const { data, error } = await this.supabase
        .from('second_hand_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          is_approved: false // Re-mettre en attente d'approbation si modifications
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        productId: data.id,
        listing: this.formatSecondHandProduct(data),
        message: 'Annonce mise à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur mise à jour annonce:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer une annonce de seconde main
   */
  async deleteSecondHandListing(productId, sellerId) {
    try {
      // Vérifier la propriété
      const { data: existingProduct } = await this.supabase
        .from('second_hand_products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      if (!existingProduct || existingProduct.seller_id !== sellerId) {
        throw new Error('Non autorisé à supprimer cette annonce');
      }

      const { error } = await this.supabase
        .from('second_hand_products')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      return {
        success: true,
        productId,
        message: 'Annonce supprimée avec succès'
      };
    } catch (error) {
      console.error('Erreur suppression annonce:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Évaluer l'éligibilité d'un produit pour la revente
   */
  async checkSellEligibility(productDetails) {
    const {
      category,
      ageInMonths,
      condition,
      originalPrice,
      brand,
      functionality
    } = productDetails;

    const eligibility = {
      eligible: true,
      reasons: [],
      recommendations: [],
      estimatedPrice: 0
    };

    // Vérifications d'éligibilité
    if (ageInMonths > 60) { // 5 ans maximum
      eligibility.eligible = false;
      eligibility.reasons.push('Produit trop ancien');
    }

    if (condition === 'poor' && originalPrice < 5000) {
      eligibility.eligible = false;
      eligibility.reasons.push('Produit en trop mauvais état pour la revente');
    }

    if (!functionality) {
      eligibility.eligible = false;
      eligibility.reasons.push('Produit non fonctionnel');
    }

    if (originalPrice < 1000) {
      eligibility.recommendations.push('Le prix de vente pourrait être trop bas pour être intéressant');
    }

    // Calcul du prix estimé
    if (eligibility.eligible) {
      eligibility.estimatedPrice = this.calculateRecommendedPrice(originalPrice, condition, ageInMonths);
    }

    return eligibility;
  }

  /**
   * Obtenir les statistiques de vente seconde main
   */
  async getSecondHandStats() {
    try {
      const { data, error } = await this.supabase
        .from('second_hand_stats')
        .select('*')
        .single();

      if (error) throw error;

      return {
        totalListings: data.total_listings,
        activeListings: data.active_listings,
        totalSales: data.total_sales,
        averagePrice: data.average_price,
        successRate: data.success_rate,
        popularCategories: data.popular_categories,
        averageTimeToSell: data.average_time_to_sell,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return {
        totalListings: 0,
        activeListings: 0,
        totalSales: 0,
        averagePrice: 0,
        successRate: 0,
        popularCategories: [],
        averageTimeToSell: 0
      };
    }
  }

  /**
   * Contacter le vendeur
   */
  async contactSeller(productId, buyerId, message) {
    try {
      const { data, error } = await this.supabase
        .from('seller_messages')
        .insert({
          product_id: productId,
          buyer_id: buyerId,
          message,
          sent_at: new Date().toISOString(),
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        messageId: data.id,
        sentAt: data.sent_at
      };
    } catch (error) {
      console.error('Erreur envoi message vendeur:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Signaler un produit
   */
  async reportProduct(productId, reason, description, reporterId) {
    try {
      const { data, error } = await this.supabase
        .from('product_reports')
        .insert({
          product_id: productId,
          reporter_id: reporterId,
          reason,
          description,
          reported_at: new Date().toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        reportId: data.id,
        reportedAt: data.reported_at
      };
    } catch (error) {
      console.error('Erreur signalement produit:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  formatSecondHandProduct(product, detailed = false) {
    const baseProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      originalPrice: product.original_price,
      recommendedPrice: product.recommended_price,
      brand: product.brand,
      condition: product.condition_type,
      conditionLabel: product.condition?.label,
      conditionDescription: product.condition?.description,
      category: product.categories,
      location: product.location,
      images: product.product_images?.map(img => img.url) || [],
      primaryImage: product.product_images?.find(img => img.is_primary)?.url || product.product_images?.[0]?.url,
      seller: {
        id: product.sellers?.id,
        username: product.sellers?.username,
        avatar: product.sellers?.avatar_url,
        rating: product.sellers?.seller_rating,
        responseRate: product.sellers?.response_rate,
        totalSales: product.sellers?.total_sales,
        verified: product.sellers?.verified,
        joinedAt: product.sellers?.joined_at
      },
      attributes: product.attributes || {},
      isAuthentic: product.product_authenticity?.is_verified || false,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };

    if (detailed) {
      return {
        ...baseProduct,
        authenticity: product.product_authenticity,
        viewCount: product.view_count,
        favoriteCount: product.favorite_count,
        contactCount: product.contact_count
      };
    }

    return baseProduct;
  }

  calculateRecommendedPrice(originalPrice, condition, ageInMonths = 0) {
    const conditionInfo = Object.values(this.conditions).find(c => c.value === condition);
    const conditionDiscount = conditionInfo?.discount || 0.3;
    const ageDiscount = Math.min(ageInMonths * 0.02, 0.5); // Max 50% de réduction pour l'âge
    
    const totalDiscount = conditionDiscount + ageDiscount;
    const recommendedPrice = originalPrice * (1 - totalDiscount);
    
    return Math.max(Math.round(recommendedPrice), originalPrice * 0.1); // Minimum 10% du prix original
  }

  validateListingData(listingData) {
    const { title, description, categoryId, condition, originalPrice, location } = listingData;

    if (!title || title.length < 5) {
      return { valid: false, error: 'Le titre doit contenir au moins 5 caractères' };
    }

    if (!description || description.length < 20) {
      return { valid: false, error: 'La description doit contenir au moins 20 caractères' };
    }

    if (!categoryId) {
      return { valid: false, error: 'La catégorie est requise' };
    }

    if (!condition) {
      return { valid: false, error: 'La condition du produit est requise' };
    }

    if (!originalPrice || originalPrice < 100) {
      return { valid: false, error: 'Le prix original doit être d\'au moins 100 XOF' };
    }

    if (!location) {
      return { valid: false, error: 'La localisation est requise' };
    }

    return { valid: true };
  }

  async uploadProductImages(productId, images) {
    try {
      const imageRecords = images.map((image, index) => ({
        product_id: productId,
        url: image.url, // En production, uploader vers Supabase Storage
        is_primary: index === 0,
        caption: image.caption || '',
        uploaded_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('product_images')
        .insert(imageRecords);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erreur upload images:', error);
      return { success: false, error: error.message };
    }
  }

  async getSecondHandProductsCount(filters = {}) {
    try {
      let query = this.supabase
        .from('second_hand_products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_approved', true);

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.condition) {
        query = query.eq('condition_type', filters.condition);
      }

      if (filters.minPrice !== null) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== null) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Erreur comptage produits seconde main:', error);
      return 0;
    }
  }
}

// Instance singleton
const secondHandService = new SecondHandService();

export default secondHandService;
