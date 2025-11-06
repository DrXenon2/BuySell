/**
 * Service de gestion des boutiques officielles Buysell
 * Produits neufs, marques officielles, garanties et authentification
 */

import { supabaseClient } from './supabaseClient';

class OfficialStoresService {
  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Obtenir toutes les boutiques officielles
   */
  async getOfficialStores(options = {}) {
    try {
      const {
        category = null,
        featured = false,
        limit = 50,
        offset = 0
      } = options;

      let query = this.supabase
        .from('official_stores')
        .select(`
          *,
          categories (name),
          store_stats (
            total_products,
            total_sales,
            average_rating,
            response_rate
          )
        `)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category', category);
      }

      if (featured) {
        query = query.eq('featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo_url,
        banner: store.banner_url,
        category: store.categories?.name,
        categories: store.categories,
        featured: store.featured,
        verified: store.verified,
        contactEmail: store.contact_email,
        contactPhone: store.contact_phone,
        website: store.website_url,
        socialMedia: store.social_media,
        returnPolicy: store.return_policy,
        warrantyPolicy: store.warranty_policy,
        stats: store.store_stats?.[0] || {
          total_products: 0,
          total_sales: 0,
          average_rating: 0,
          response_rate: 0
        },
        createdAt: store.created_at,
        updatedAt: store.updated_at
      }));
    } catch (error) {
      console.error('Erreur récupération boutiques officielles:', error);
      throw new Error('Impossible de récupérer les boutiques officielles');
    }
  }

  /**
   * Obtenir une boutique officielle spécifique
   */
  async getOfficialStore(storeId) {
    try {
      const { data, error } = await this.supabase
        .from('official_stores')
        .select(`
          *,
          categories (name, slug),
          store_stats (
            total_products,
            total_sales,
            average_rating,
            response_rate,
            total_reviews
          )
        `)
        .eq('id', storeId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo_url,
        banner: data.banner_url,
        category: data.categories,
        featured: data.featured,
        verified: data.verified,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        website: data.website_url,
        socialMedia: data.social_media,
        returnPolicy: data.return_policy,
        warrantyPolicy: data.warranty_policy,
        shippingPolicy: data.shipping_policy,
        stats: data.store_stats?.[0] || {
          total_products: 0,
          total_sales: 0,
          average_rating: 0,
          response_rate: 0,
          total_reviews: 0
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération boutique:', error);
      throw new Error('Boutique non trouvée');
    }
  }

  /**
   * Obtenir les produits d'une boutique officielle
   */
  async getStoreProducts(storeId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'created_at',
        sortOrder = 'desc',
        minPrice = null,
        maxPrice = null,
        inStock = null
      } = options;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          product_stock (quantity, reserved_quantity),
          product_images (url, is_primary),
          brands (name, logo_url)
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category_id', category);
      }

      if (minPrice !== null) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
      }

      if (inStock !== null) {
        if (inStock) {
          query = query.gt('product_stock.quantity', 0);
        } else {
          query = query.eq('product_stock.quantity', 0);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.compare_price,
        sku: product.sku,
        brand: product.brands,
        category: product.categories,
        images: product.product_images.map(img => img.url),
        primaryImage: product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url,
        inStock: (product.product_stock?.[0]?.quantity || 0) > 0,
        stockQuantity: product.product_stock?.[0]?.quantity || 0,
        reservedQuantity: product.product_stock?.[0]?.reserved_quantity || 0,
        availableQuantity: (product.product_stock?.[0]?.quantity || 0) - (product.product_stock?.[0]?.reserved_quantity || 0),
        hasWarranty: product.has_warranty,
        warrantyDuration: product.warranty_duration,
        isNew: product.is_new,
        isFeatured: product.is_featured,
        rating: product.average_rating,
        reviewCount: product.review_count,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } catch (error) {
      console.error('Erreur récupération produits boutique:', error);
      throw new Error('Impossible de récupérer les produits de la boutique');
    }
  }

  /**
   * Rechercher des boutiques officielles
   */
  async searchOfficialStores(query, filters = {}) {
    try {
      const {
        category = null,
        verifiedOnly = false,
        minRating = 0,
        limit = 20
      } = filters;

      let searchQuery = this.supabase
        .from('official_stores')
        .select(`
          *,
          categories (name),
          store_stats (average_rating, total_products)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (category) {
        searchQuery = searchQuery.eq('category', category);
      }

      if (verifiedOnly) {
        searchQuery = searchQuery.eq('verified', true);
      }

      if (minRating > 0) {
        searchQuery = searchQuery.gte('store_stats.average_rating', minRating);
      }

      const { data, error } = await searchQuery;

      if (error) throw error;

      return data.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo_url,
        category: store.categories?.name,
        verified: store.verified,
        rating: store.store_stats?.[0]?.average_rating || 0,
        productCount: store.store_stats?.[0]?.total_products || 0,
        featured: store.featured
      }));
    } catch (error) {
      console.error('Erreur recherche boutiques:', error);
      return [];
    }
  }

  /**
   * Obtenir les nouvelles boutiques
   */
  async getNewStores(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('official_stores')
        .select(`
          *,
          categories (name),
          store_stats (total_products)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo_url,
        category: store.categories?.name,
        productCount: store.store_stats?.[0]?.total_products || 0,
        isNew: this.isNewStore(store.created_at),
        joinedDate: store.created_at
      }));
    } catch (error) {
      console.error('Erreur récupération nouvelles boutiques:', error);
      return [];
    }
  }

  /**
   * Obtenir les boutiques tendance
   */
  async getTrendingStores(limit = 8) {
    try {
      const { data, error } = await this.supabase
        .from('official_stores')
        .select(`
          *,
          categories (name),
          store_stats (total_sales, average_rating, total_products)
        `)
        .eq('is_active', true)
        .order('store_stats.total_sales', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo_url,
        category: store.categories?.name,
        sales: store.store_stats?.[0]?.total_sales || 0,
        rating: store.store_stats?.[0]?.average_rating || 0,
        productCount: store.store_stats?.[0]?.total_products || 0,
        trending: true
      }));
    } catch (error) {
      console.error('Erreur récupération boutiques tendance:', error);
      return [];
    }
  }

  /**
   * Obtenir les promotions d'une boutique
   */
  async getStorePromotions(storeId) {
    try {
      const { data, error } = await this.supabase
        .from('store_promotions')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      return data.map(promo => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        minPurchase: promo.min_purchase_amount,
        maxDiscount: promo.max_discount_amount,
        startDate: promo.start_date,
        endDate: promo.end_date,
        isActive: promo.is_active,
        usageLimit: promo.usage_limit,
        usedCount: promo.used_count
      }));
    } catch (error) {
      console.error('Erreur récupération promotions:', error);
      return [];
    }
  }

  /**
   * S'abonner aux notifications d'une boutique
   */
  async subscribeToStore(storeId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('store_subscriptions')
        .upsert({
          store_id: storeId,
          user_id: userId,
          subscribed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        subscriptionId: data.id,
        storeId,
        userId,
        subscribedAt: data.subscribed_at
      };
    } catch (error) {
      console.error('Erreur abonnement boutique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Se désabonner d'une boutique
   */
  async unsubscribeFromStore(storeId, userId) {
    try {
      const { error } = await this.supabase
        .from('store_subscriptions')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        storeId,
        userId
      };
    } catch (error) {
      console.error('Erreur désabonnement boutique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifier l'authenticité d'un produit
   */
  async verifyProductAuthenticity(productId) {
    try {
      const { data, error } = await this.supabase
        .from('product_authenticity')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      return {
        authentic: data.is_authentic,
        verificationMethod: data.verification_method,
        verifiedAt: data.verified_at,
        verifiedBy: data.verified_by,
        certificateUrl: data.certificate_url,
        notes: data.notes
      };
    } catch (error) {
      console.error('Erreur vérification authenticité:', error);
      return {
        authentic: false,
        verificationMethod: 'not_verified',
        notes: 'Produit non vérifié'
      };
    }
  }

  /**
   * Obtenir les informations de garantie d'un produit
   */
  async getProductWarranty(productId) {
    try {
      const { data, error } = await this.supabase
        .from('product_warranties')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      return {
        hasWarranty: data.has_warranty,
        durationMonths: data.duration_months,
        type: data.warranty_type,
        coverage: data.coverage_details,
        terms: data.terms_conditions,
        provider: data.warranty_provider,
        contactInfo: data.contact_information
      };
    } catch (error) {
      console.error('Erreur récupération garantie:', error);
      return {
        hasWarranty: false,
        durationMonths: 0,
        type: 'none',
        coverage: 'Aucune garantie'
      };
    }
  }

  /**
   * Obtenir les statistiques globales des boutiques officielles
   */
  async getOfficialStoresStats() {
    try {
      const { data, error } = await this.supabase
        .from('official_stores_stats')
        .select('*')
        .single();

      if (error) throw error;

      return {
        totalStores: data.total_stores,
        activeStores: data.active_stores,
        totalProducts: data.total_products,
        totalSales: data.total_sales,
        averageRating: data.average_rating,
        topCategories: data.top_categories,
        growthRate: data.growth_rate,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return {
        totalStores: 0,
        activeStores: 0,
        totalProducts: 0,
        totalSales: 0,
        averageRating: 0,
        topCategories: [],
        growthRate: 0
      };
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  isNewStore(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Nouveau si créé il y a moins de 30 jours
  }
}

// Instance singleton
const officialStoresService = new OfficialStoresService();

export default officialStoresService;
