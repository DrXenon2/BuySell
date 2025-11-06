const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Category pour la gestion des catégories
 */
class Category {
  constructor() {
    this.table = 'categories';
  }

  // Créer une catégorie
  async create(categoryData) {
    const category = {
      ...categoryData,
      slug: this.generateSlug(categoryData.name),
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(categoryId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        parent:categories(*),
        children:categories(*)
      `)
      .eq('id', categoryId)
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
        parent:categories(*),
        children:categories(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour une catégorie
  async update(categoryId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        slug: updates.name ? this.generateSlug(updates.name) : undefined,
        updated_at: new Date()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer une catégorie
  async delete(categoryId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    return true;
  }

  // Obtenir toutes les catégories
  async findAll(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (query.parent_id !== undefined) {
      supabaseQuery = supabaseQuery.eq('parent_id', query.parent_id);
    }

    if (query.include_inactive) {
      supabaseQuery = supabaseQuery.neq('is_active', false);
    }

    supabaseQuery = supabaseQuery.order('sort_order', { ascending: true })
                               .order('name', { ascending: true });

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    return {
      data,
      total: count
    };
  }

  // Obtenir l'arborescence des catégories
  async getTree() {
    const { data: categories, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    // Construire l'arborescence
    const categoryMap = new Map();
    const rootCategories = [];

    // Créer un map de toutes les catégories
    categories.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
    });

    // Organiser en arborescence
    categories.forEach(category => {
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id);
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  // Obtenir les produits d'une catégorie
  async getProducts(categoryId, query = {}) {
    let supabaseQuery = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        seller:profiles(*)
      `, { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .gt('quantity', 0);

    // Filtres supplémentaires
    if (query.min_price !== undefined) {
      supabaseQuery = supabaseQuery.gte('price', query.min_price);
    }

    if (query.max_price !== undefined) {
      supabaseQuery = supabaseQuery.lte('price', query.max_price);
    }

    if (query.brand) {
      supabaseQuery = supabaseQuery.eq('brand', query.brand);
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

  // Générer un slug
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Compter les produits par catégorie
  async getProductsCount() {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
}

module.exports = new Category();
