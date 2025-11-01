const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Review pour la gestion des avis
 */
class Review {
  constructor() {
    this.table = 'reviews';
  }

  // Créer un avis
  async create(reviewData) {
    const review = {
      ...reviewData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(review)
      .select(`
        *,
        user:profiles(*),
        product:products(*)
      `)
      .single();

    if (error) throw error;

    // Mettre à jour la note moyenne du produit
    await this.updateProductRating(reviewData.product_id);

    return data;
  }

  // Trouver par ID
  async findById(reviewId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        user:profiles(*),
        product:products(*)
      `)
      .eq('id', reviewId)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un avis
  async update(reviewId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', reviewId)
      .select(`
        *,
        user:profiles(*),
        product:products(*)
      `)
      .single();

    if (error) throw error;

    // Mettre à jour la note moyenne du produit
    if (updates.rating !== undefined) {
      await this.updateProductRating(data.product_id);
    }

    return data;
  }

  // Supprimer un avis
  async delete(reviewId) {
    const review = await this.findById(reviewId);
    
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    // Mettre à jour la note moyenne du produit
    await this.updateProductRating(review.product_id);

    return true;
  }

  // Rechercher des avis
  async find(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        user:profiles(*),
        product:products(*)
      `, { count: 'exact' })
      .eq('status', 'approved');

    // Filtres
    if (query.product_id) {
      supabaseQuery = supabaseQuery.eq('product_id', query.product_id);
    }

    if (query.user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
    }

    if (query.rating) {
      supabaseQuery = supabaseQuery.eq('rating', query.rating);
    }

    if (query.with_images) {
      supabaseQuery = supabaseQuery.not('images', 'is', null);
    }

    if (query.is_verified) {
      supabaseQuery = supabaseQuery.eq('is_verified', true);
    }

    // Tri
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? true : false;

    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
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

  // Avis d'un produit
  async findByProduct(productId, query = {}) {
    return await this.find({
      product_id: productId,
      ...query
    });
  }

  // Statistiques des notes d'un produit
  async getProductRatingStats(productId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) throw error;

    const stats = {
      average: 0,
      total: data.length,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (data.length === 0) {
      return stats;
    }

    const totalRating = data.reduce((sum, review) => {
      stats.distribution[review.rating]++;
      return sum + review.rating;
    }, 0);

    stats.average = parseFloat((totalRating / data.length).toFixed(1));

    // Calculer les pourcentages
    for (let rating in stats.distribution) {
      stats.distribution[rating] = {
        count: stats.distribution[rating],
        percentage: parseFloat(((stats.distribution[rating] / data.length) * 100).toFixed(1))
      };
    }

    return stats;
  }

  // Mettre à jour la note moyenne du produit
  async updateProductRating(productId) {
    const { data, error } = await supabase.rpc('update_product_rating', {
      product_id: productId
    });

    if (error) throw error;
    return data;
  }

  // Marquer un avis comme utile
  async markHelpful(reviewId) {
    const { data, error } = await supabase.rpc('increment_helpful_count', {
      review_id: reviewId
    });

    if (error) throw error;
    return data;
  }

  // Signaler un avis
  async report(reviewId, reason) {
    const { data, error } = await supabase.rpc('increment_report_count', {
      review_id: reviewId
    });

    if (error) throw error;

    // Enregistrer le signalement
    await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reason: reason,
        created_at: new Date()
      });

    return data;
  }

  // Vérifier si l'utilisateur peut laisser un avis
  async canUserReview(productId, userId) {
    // Vérifier si l'utilisateur a déjà laissé un avis
    const { data: existingReview, error: findError } = await supabase
      .from(this.table)
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingReview) {
      return false;
    }

    // Vérifier si l'utilisateur a acheté le produit
    const { data: purchase, error: purchaseError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', productId)
      .in('order.status', ['delivered', 'completed'])
      .single();

    if (purchaseError && purchaseError.code !== 'PGRST116') {
      throw purchaseError;
    }

    return !!purchase;
  }

  // Avis en attente de modération
  async getPendingReviews(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        user:profiles(*),
        product:products(*)
      `, { count: 'exact' })
      .eq('status', 'pending');

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

  // Modérer un avis
  async moderate(reviewId, action, moderatorNotes = '') {
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    const { data, error } = await supabase
      .from(this.table)
      .update({
        status: status,
        moderator_notes: moderatorNotes,
        moderated_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    if (status === 'approved') {
      await this.updateProductRating(data.product_id);
    }

    return data;
  }
}

module.exports = new Review();
