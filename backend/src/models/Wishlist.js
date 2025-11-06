const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Wishlist pour la gestion des listes de souhaits
 */
class Wishlist {
  constructor() {
    this.table = 'wishlists';
  }

  // Obtenir ou créer une liste de souhaits
  async getOrCreate(userId) {
    const { data: existingWishlist, error: findError } = await supabase
      .from(this.table)
      .select(`
        *,
        items:wishlist_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingWishlist) {
      return existingWishlist;
    }

    // Créer une nouvelle liste de souhaits
    const { data: newWishlist, error: createError } = await supabase
      .from(this.table)
      .insert({
        user_id: userId,
        name: 'Ma liste de souhaits',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select(`
        *,
        items:wishlist_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            quantity as stock_quantity,
            is_published
          )
        )
      `)
      .single();

    if (createError) throw createError;
    return newWishlist;
  }

  // Ajouter un produit à la liste de souhaits
  async addItem(userId, productId) {
    const wishlist = await this.getOrCreate(userId);

    // Vérifier si le produit est déjà dans la liste
    const { data: existingItem, error: findError } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingItem) {
      throw new Error('Ce produit est déjà dans votre liste de souhaits');
    }

    // Ajouter le produit
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlist.id,
        product_id: productId,
        created_at: new Date()
      })
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          price,
          compare_price,
          images,
          quantity as stock_quantity,
          is_published
        )
      `)
      .single();

    if (error) throw error;

    // Mettre à jour la date de modification
    await this.update(wishlist.id, { updated_at: new Date() });

    return data;
  }

  // Supprimer un produit de la liste de souhaits
  async removeItem(userId, productId) {
    const wishlist = await this.getOrCreate(userId);

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId);

    if (error) throw error;

    // Mettre à jour la date de modification
    await this.update(wishlist.id, { updated_at: new Date() });

    return true;
  }

  // Vider la liste de souhaits
  async clear(userId) {
    const wishlist = await this.getOrCreate(userId);

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id);

    if (error) throw error;

    // Mettre à jour la date de modification
    await this.update(wishlist.id, { updated_at: new Date() });

    return true;
  }

  // Mettre à jour la liste de souhaits
  async update(wishlistId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', wishlistId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir la liste de souhaits d'un utilisateur
  async findByUserId(userId) {
    return await this.getOrCreate(userId);
  }

  // Vérifier si un produit est dans la liste de souhaits
  async isInWishlist(userId, productId) {
    const wishlist = await this.getOrCreate(userId);

    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Obtenir les listes de souhaits publiques
  async getPublicWishlists(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        user:profiles(*),
        items:wishlist_items(
          product:products(
            id,
            name,
            slug,
            price,
            images
          )
        )
      `, { count: 'exact' })
      .eq('is_public', true);

    if (query.user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query.search}%,user.first_name.ilike.%${query.search}%,user.last_name.ilike.%${query.search}%`);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)
      .order('updated_at', { ascending: false });

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

  // Déplacer un produit vers le panier
  async moveToCart(userId, productId) {
    const wishlist = await this.getOrCreate(userId);
    
    // Vérifier si le produit est dans la liste de souhaits
    const { data: wishlistItem, error: findError } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .single();

    if (findError) {
      throw new Error('Produit non trouvé dans la liste de souhaits');
    }

    // Ajouter au panier
    const cartModel = require('./Cart');
    await cartModel.addItem(userId, {
      product_id: productId,
      quantity: 1
    });

    // Supprimer de la liste de souhaits
    await this.removeItem(userId, productId);

    return true;
  }

  // Produits populaires dans les listes de souhaits
  async getPopularWishlistProducts(limit = 10) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        product:products(
          id,
          name,
          slug,
          price,
          images,
          category:categories(*)
        )
      `)
      .limit(limit);

    if (error) throw error;

    // Compter les occurrences
    const productCounts = {};
    data.forEach(item => {
      const productId = item.product.id;
      productCounts[productId] = (productCounts[productId] || 0) + 1;
    });

    // Trier par popularité
    const popularProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId]) => {
        return data.find(item => item.product.id === productId).product;
      });

    return popularProducts;
  }

  // Créer une liste de souhaits personnalisée
  async createCustomWishlist(userId, name, isPublic = false) {
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        user_id: userId,
        name: name,
        is_public: isPublic,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select(`
        *,
        items:wishlist_items(
          *,
          product:products(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir toutes les listes de souhaits d'un utilisateur
  async getUserWishlists(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        items:wishlist_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            images
          )
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = new Wishlist();
