const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Profile pour les données utilisateur étendues
 */
class Profile {
  constructor() {
    this.table = 'profiles';
  }

  // Créer un profil utilisateur
  async create(userId, profileData) {
    const profile = {
      id: userId,
      ...profileData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Mettre à jour le profil
  async update(userId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer le profil
  async delete(userId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  }

  // Rechercher des profils
  async find(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact' });

    // Filtres
    if (query.role) {
      supabaseQuery = supabaseQuery.eq('role', query.role);
    }

    if (query.is_active !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_active', query.is_active);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

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

  // Méthodes spécifiques
  async getSellerStats(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        products:products(count),
        orders:orders(count)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateLastLogin(userId) {
    return await this.update(userId, {
      last_login: new Date()
    });
  }
}

module.exports = new Profile();
