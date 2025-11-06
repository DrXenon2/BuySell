/**
 * Client Supabase configuré pour l'application
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase';

// Créer le client Supabase
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'buy-sell-platform',
        'x-application-version': '1.0.0',
      },
    },
  }
);

// Helper pour les uploads
export const storage = {
  // Uploader un fichier
  uploadFile: async (bucket, path, file, options = {}) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options,
      });

    if (error) throw error;
    return data;
  },

  // Obtenir l'URL publique d'un fichier
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Supprimer un fichier
  deleteFile: async (bucket, paths) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;
    return data;
  },

  // Lister les fichiers d'un dossier
  listFiles: async (bucket, path, options = {}) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, options);

    if (error) throw error;
    return data;
  },
};

// Helper pour l'authentification
export const auth = {
  // Connexion avec email/mot de passe
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Inscription
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Déconnexion
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Mot de passe oublié
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  // Mettre à jour le mot de passe
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  // Obtenir la session actuelle
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  },

  // Écouter les changements d'authentification
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper pour les données en temps réel
export const realtime = {
  // S'abonner aux changements d'une table
  subscribe: (table, event, callback) => {
    return supabase
      .channel('public:' + table)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
        },
        callback
      )
      .subscribe();
  },

  // Se désabonner
  unsubscribe: (channel) => {
    return supabase.removeChannel(channel);
  },
};

// Helper pour les requêtes courantes
export const database = {
  // Récupérer un profil utilisateur
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour un profil
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Rechercher des produits
  searchProducts: async (query, filters = {}, page = 1, limit = 24) => {
    let queryBuilder = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('is_active', true);

    // Filtre par recherche texte
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Filtre par catégorie
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category_id', filters.category);
    }

    // Filtre par prix
    if (filters.minPrice) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice);
    }

    // Filtre par stock
    if (filters.inStock) {
      queryBuilder = queryBuilder.gt('stock_quantity', 0);
    }

    // Filtre par promotion
    if (filters.onSale) {
      queryBuilder = queryBuilder.not('sale_price', 'is', null);
    }

    // Tri
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? true : false;
    queryBuilder = queryBuilder.order(sortField, { ascending: sortOrder });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      products: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },
};

export default supabase;
