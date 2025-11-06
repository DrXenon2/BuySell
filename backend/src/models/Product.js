const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Product pour la gestion des produits
 */
class Product {
  constructor() {
    this.table = 'products';
  }

  // Créer un produit
  async create(productData) {
    const product = {
      ...productData,
      slug: this.generateSlug(productData.name),
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(product)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(productId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*),
        reviews:reviews(*),
        images:product_images(*)
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par slug
  async findBySlug(slug) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*),
        reviews:reviews(*),
        images:product_images(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un produit
  async update(productId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        slug: updates.name ? this.generateSlug(updates.name) : undefined,
        updated_at: new Date()
      })
      .eq('id', productId)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un produit
  async delete(productId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return true;
  }

  // Rechercher des produits
  async find(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*),
        reviews:reviews(*)
      `, { count: 'exact' });

    // Filtres
    if (query.category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', query.category_id);
    }

    if (query.seller_id) {
      supabaseQuery = supabaseQuery.eq('seller_id', query.seller_id);
    }

    if (query.min_price !== undefined) {
      supabaseQuery = supabaseQuery.gte('price', query.min_price);
    }

    if (query.max_price !== undefined) {
      supabaseQuery = supabaseQuery.lte('price', query.max_price);
    }

    if (query.in_stock !== undefined) {
      if (query.in_stock) {
        supabaseQuery = supabaseQuery.gt('quantity', 0);
      } else {
        supabaseQuery = supabaseQuery.eq('quantity', 0);
      }
    }

    if (query.is_published !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_published', query.is_published);
    }

    if (query.is_featured !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_featured', query.is_featured);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%,brand.ilike.%${query.search}%`);
    }

    if (query.tags) {
      const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
      supabaseQuery = supabaseQuery.overlaps('tags', tags);
    }

    // Tri
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? true : false;

    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Produits populaires
  async getPopular(limit = 10) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*)
      `)
      .eq('is_published', true)
      .gt('quantity', 0)
      .order('views_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Produits recommandés
  async getRecommended(productId, limit = 5) {
    const product = await this.findById(productId);
    
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        category:categories(*),
        seller:profiles(*)
      `)
      .eq('category_id', product.category_id)
      .neq('id', productId)
      .eq('is_published', true)
      .gt('quantity', 0)
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Mettre à jour le stock
  async updateStock(productId, quantityChange) {
    const { data, error } = await supabase.rpc('update_product_stock', {
      product_id: productId,
      quantity_change: quantityChange
    });

    if (error) throw error;
    return data;
  }

  // Générer un slug unique
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Mettre à jour les statistiques
  async updateRating(productId) {
    const { data, error } = await supabase.rpc('update_product_rating', {
      product_id: productId
    });

    if (error) throw error;
    return data;
  }
}

module.exports = new Product();
