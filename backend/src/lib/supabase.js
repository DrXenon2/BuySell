/**
 * Client Supabase étendu avec méthodes personnalisées
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Méthodes personnalisées pour les produits
supabase.products = {
  // Recherche de produits
  searchProducts: async (query, filters = {}) => {
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        categories (*),
        seller:profiles (*)
      `)
      .ilike('title', `%${query}%`)
      .eq('status', 'published');

    // Appliquer les filtres
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category_id', filters.category);
    }
    
    if (filters.minPrice) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice);
    }
    
    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice);
    }
    
    if (filters.condition) {
      queryBuilder = queryBuilder.eq('condition', filters.condition);
    }

    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data;
  },

  // Produits populaires
  getPopularProducts: async (limit = 10) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (*),
        seller:profiles (*),
        reviews (rating)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Produits par vendeur
  getProductsBySeller: async (sellerId, status = 'published') => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (*),
        reviews (rating)
      `)
      .eq('seller_id', sellerId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Méthodes pour les utilisateurs
supabase.users = {
  // Recherche d'utilisateurs
  searchUsers: async (query, role = null) => {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`);

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  },

  // Statistiques utilisateur
  getUserStats: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        products:products(count),
        orders:orders(count),
        reviews:reviews(count)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Méthodes pour les commandes
supabase.orders = {
  // Commandes par utilisateur
  getUserOrders: async (userId, status = null) => {
    let queryBuilder = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        shipping_address (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  },

  // Statistiques de commandes
  getOrderStats: async (period = 'month') => {
    const { data, error } = await supabase
      .rpc('get_order_stats', { period });

    if (error) throw error;
    return data;
  }
};

// Base de données alias
supabase.database = supabase;

module.exports = supabase;
