/**
 * Service de gestion des catégories Buysell
 * Navigation, produits par catégorie, filtres et recherche
 */

import { supabaseClient } from './supabaseClient';
import { CATEGORIES_CONFIG } from '../config/categories';

class CategoryService {
  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Obtenir toutes les catégories principales
   */
  async getAllCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id (name),
          children:categories!parent_id (
            id,
            name,
            slug,
            description,
            image_url,
            product_count
          )
        `)
        .is('parent_id', null) // Catégories racines seulement
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image_url,
        icon: category.icon,
        color: category.color,
        productCount: category.product_count,
        featured: category.featured,
        children: category.children || [],
        displayOrder: category.display_order,
        createdAt: category.created_at
      }));
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      // Fallback vers la configuration statique
      return Object.values(CATEGORIES_CONFIG).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        color: cat.color,
        featured: cat.featured,
        productCount: 0,
        children: cat.subcategories || []
      }));
    }
  }

  /**
   * Obtenir une catégorie spécifique par slug
   */
  async getCategoryBySlug(slug) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id (name, slug),
          children:categories!parent_id (
            id,
            name,
            slug,
            description,
            image_url,
            product_count,
            featured
          ),
          category_stats (
            total_products,
            total_sellers,
            average_rating,
            monthly_sales
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image_url,
        banner: data.banner_url,
        icon: data.icon,
        color: data.color,
        parent: data.parent,
        children: data.children || [],
        featured: data.featured,
        productCount: data.product_count,
        stats: data.category_stats?.[0] || {
          total_products: 0,
          total_sellers: 0,
          average_rating: 0,
          monthly_sales: 0
        },
        seoTitle: data.seo_title,
        seoDescription: data.seo_description,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération catégorie:', error);
      // Fallback vers la configuration statique
      const staticCategory = Object.values(CATEGORIES_CONFIG).find(cat => cat.slug === slug);
      if (staticCategory) {
        return {
          ...staticCategory,
          productCount: 0,
          stats: {
            total_products: 0,
            total_sellers: 0,
            average_rating: 0,
            monthly_sales: 0
          }
        };
      }
      throw new Error('Catégorie non trouvée');
    }
  }

  /**
   * Obtenir les produits d'une catégorie
   */
  async getCategoryProducts(categorySlug, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        minPrice = null,
        maxPrice = null,
        brands = [],
        ratings = [],
        attributes = {},
        inStock = null
      } = options;

      const offset = (page - 1) * limit;

      // Obtenir l'ID de la catégorie
      const category = await this.getCategoryBySlug(categorySlug);
      const categoryIds = [category.id, ...category.children.map(child => child.id)];

      let query = this.supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          brands (name, logo_url),
          product_images (url, is_primary),
          product_stock (quantity, reserved_quantity),
          product_ratings (average_rating, review_count)
        `)
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      // Appliquer les filtres
      if (minPrice !== null) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== null) {
        query = query.lte('price', maxPrice);
      }

      if (brands.length > 0) {
        query = query.in('brand_id', brands);
      }

      if (ratings.length > 0) {
        const ratingConditions = ratings.map(rating => 
          `product_ratings.average_rating.gte.${rating}`
        );
        query = query.or(ratingConditions.join(','));
      }

      if (inStock !== null) {
        if (inStock) {
          query = query.gt('product_stock.quantity', 0);
        } else {
          query = query.eq('product_stock.quantity', 0);
        }
      }

      // Filtres d'attributs
      if (Object.keys(attributes).length > 0) {
        for (const [key, value] of Object.entries(attributes)) {
          if (Array.isArray(value)) {
            query = query.in(`attributes->${key}`, value);
          } else {
            query = query.eq(`attributes->${key}`, value);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        products: data.map(product => this.formatProduct(product)),
        pagination: {
          page,
          limit,
          total: await this.getCategoryProductsCount(categoryIds, options),
          totalPages: Math.ceil(await this.getCategoryProductsCount(categoryIds, options) / limit)
        },
        filters: await this.getCategoryFilters(categoryIds)
      };
    } catch (error) {
      console.error('Erreur récupération produits catégorie:', error);
      throw new Error('Impossible de récupérer les produits de la catégorie');
    }
  }

  /**
   * Obtenir les catégories populaires
   */
  async getPopularCategories(limit = 8) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select(`
          *,
          category_stats (monthly_sales, total_products)
        `)
        .eq('is_active', true)
        .order('category_stats.monthly_sales', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image_url,
        productCount: category.product_count,
        monthlySales: category.category_stats?.[0]?.monthly_sales || 0,
        trending: this.isCategoryTrending(category)
      }));
    } catch (error) {
      console.error('Erreur récupération catégories populaires:', error);
      return [];
    }
  }

  /**
   * Obtenir les catégories featured
   */
  async getFeaturedCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image_url,
        icon: category.icon,
        color: category.color,
        productCount: category.product_count
      }));
    } catch (error) {
      console.error('Erreur récupération catégories featured:', error);
      // Fallback vers la configuration statique
      return Object.values(CATEGORIES_CONFIG)
        .filter(cat => cat.featured)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          icon: cat.icon,
          color: cat.color,
          productCount: 0
        }));
    }
  }

  /**
   * Rechercher dans les catégories
   */
  async searchCategories(searchTerm, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image_url,
        productCount: category.product_count,
        type: 'category'
      }));
    } catch (error) {
      console.error('Erreur recherche catégories:', error);
      return [];
    }
  }

  /**
   * Obtenir les filtres disponibles pour une catégorie
   */
  async getCategoryFilters(categoryIds) {
    try {
      const filters = {
        price: { min: 0, max: 1000000 },
        brands: [],
        ratings: [4, 3, 2, 1],
        attributes: {}
      };

      // Obtenir la plage de prix
      const { data: priceData } = await this.supabase
        .from('products')
        .select('price')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      if (priceData && priceData.length > 0) {
        const prices = priceData.map(p => p.price).filter(p => p > 0);
        filters.price = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }

      // Obtenir les marques
      const { data: brandData } = await this.supabase
        .from('products')
        .select('brand_id, brands!inner(name)')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      if (brandData) {
        const brandCounts = brandData.reduce((acc, item) => {
          const brandName = item.brands.name;
          acc[brandName] = (acc[brandName] || 0) + 1;
          return acc;
        }, {});

        filters.brands = Object.entries(brandCounts).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count);
      }

      // Obtenir les attributs spécifiques à la catégorie
      const { data: attributeData } = await this.supabase
        .from('category_attributes')
        .select('*')
        .in('category_id', categoryIds);

      if (attributeData) {
        attributeData.forEach(attr => {
          filters.attributes[attr.name] = {
            type: attr.type,
            values: attr.values || [],
            multiple: attr.multiple
          };
        });
      }

      return filters;
    } catch (error) {
      console.error('Erreur récupération filtres:', error);
      return {
        price: { min: 0, max: 1000000 },
        brands: [],
        ratings: [4, 3, 2, 1],
        attributes: {}
      };
    }
  }

  /**
   * Obtenir les statistiques d'une catégorie
   */
  async getCategoryStats(categoryId) {
    try {
      const { data, error } = await this.supabase
        .from('category_stats')
        .select('*')
        .eq('category_id', categoryId)
        .single();

      if (error) throw error;

      return {
        totalProducts: data.total_products,
        activeSellers: data.active_sellers,
        averageRating: data.average_rating,
        monthlySales: data.monthly_sales,
        growthRate: data.growth_rate,
        topProducts: data.top_products,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération statistiques catégorie:', error);
      return {
        totalProducts: 0,
        activeSellers: 0,
        averageRating: 0,
        monthlySales: 0,
        growthRate: 0,
        topProducts: []
      };
    }
  }

  /**
   * Obtenir le breadcrumb d'une catégorie
   */
  async getCategoryBreadcrumb(categorySlug) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('name, slug, parent_id')
        .eq('slug', categorySlug)
        .single();

      if (error) throw error;

      const breadcrumb = [{ name: data.name, slug: data.slug }];

      // Remonter la hiérarchie
      let currentParentId = data.parent_id;
      while (currentParentId) {
        const { data: parent } = await this.supabase
          .from('categories')
          .select('name, slug, parent_id')
          .eq('id', currentParentId)
          .single();

        if (parent) {
          breadcrumb.unshift({ name: parent.name, slug: parent.slug });
          currentParentId = parent.parent_id;
        } else {
          break;
        }
      }

      // Ajouter la racine
      breadcrumb.unshift({ name: 'Accueil', slug: '/' });

      return breadcrumb;
    } catch (error) {
      console.error('Erreur récupération breadcrumb:', error);
      return [
        { name: 'Accueil', slug: '/' },
        { name: 'Catégories', slug: '/categories' }
      ];
    }
  }

  /**
   * Obtenir les catégories similaires
   */
  async getSimilarCategories(categoryId, limit = 6) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .neq('id', categoryId)
        .eq('is_active', true)
        .order('product_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image_url,
        productCount: category.product_count
      }));
    } catch (error) {
      console.error('Erreur récupération catégories similaires:', error);
      return [];
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  formatProduct(product) {
    return {
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
      rating: product.product_ratings?.[0]?.average_rating || 0,
      reviewCount: product.product_ratings?.[0]?.review_count || 0,
      isNew: this.isProductNew(product.created_at),
      isFeatured: product.is_featured,
      attributes: product.attributes || {},
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  }

  isProductNew(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Nouveau si créé il y a moins de 30 jours
  }

  isCategoryTrending(category) {
    const stats = category.category_stats?.[0];
    if (!stats) return false;
    
    // Considérer comme trending si croissance > 10% ou ventes mensuelles > 1000
    return stats.growth_rate > 10 || stats.monthly_sales > 1000;
  }

  async getCategoryProductsCount(categoryIds, filters = {}) {
    try {
      let query = this.supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .eq('is_approved', true);

      // Appliquer les mêmes filtres que pour la requête principale
      if (filters.minPrice !== null) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== null) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.brands && filters.brands.length > 0) {
        query = query.in('brand_id', filters.brands);
      }

      if (filters.inStock !== null) {
        if (filters.inStock) {
          query = query.gt('product_stock.quantity', 0);
        } else {
          query = query.eq('product_stock.quantity', 0);
        }
      }

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Erreur comptage produits:', error);
      return 0;
    }
  }
}

// Instance singleton
const categoryService = new CategoryService();

export default categoryService;
