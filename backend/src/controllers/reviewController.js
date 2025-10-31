const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class ReviewController {
  // Obtenir les avis d'un produit
  async getProductReviews(req, res) {
    try {
      const { product_id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        rating,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('product_id', product_id)
        .eq('status', 'approved');

      // Filtres
      if (rating) {
        query = query.eq('rating', parseInt(rating));
      }

      // Tri
      const sortField = sort_by === 'rating' ? 'rating' : 'created_at';
      const sortDir = sort_order === 'asc' ? 'asc' : 'desc';

      const { data: reviews, error, count } = await query
        .order(sortField, { ascending: sortDir === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Calculer les statistiques des notes
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product_id)
        .eq('status', 'approved');

      const ratingStats = this.calculateRatingStats(allReviews || []);

      res.json({
        success: true,
        data: {
          reviews,
          statistics: ratingStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getProductReviews:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des avis'
      });
    }
  }

  // Créer un nouvel avis
  async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, rating, title, comment, images = [] } = req.body;

      // Validation
      if (!product_id || !rating) {
        return res.status(400).json({
          error: 'Champs manquants',
          message: 'Le produit et la note sont requis'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Note invalide',
          message: 'La note doit être comprise entre 1 et 5'
        });
      }

      // Vérifier que l'utilisateur a acheté le produit
      const { data: purchase } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', product_id)
        .in('orders.status', ['delivered', 'completed'])
        .single();

      if (!purchase && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Achat requis',
          message: 'Vous devez avoir acheté ce produit pour laisser un avis'
        });
      }

      // Vérifier si l'utilisateur a déjà laissé un avis
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', userId)
        .single();

      if (existingReview) {
        return res.status(409).json({
          error: 'Avis existant',
          message: 'Vous avez déjà laissé un avis pour ce produit'
        });
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          product_id,
          user_id: userId,
          order_id: purchase?.order_id,
          rating: parseInt(rating),
          title,
          comment,
          images,
          is_verified: true,
          status: 'approved' // Ou 'pending' selon la modération
        })
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      logger.info('Nouvel avis créé', { 
        reviewId: review.id, 
        userId,
        productId: product_id,
        rating 
      });

      res.status(201).json({
        success: true,
        message: 'Avis créé avec succès',
        data: { review }
      });

    } catch (error) {
      logger.error('Erreur contrôleur createReview:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de l\'avis'
      });
    }
  }

  // Mettre à jour un avis
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { rating, title, comment, images } = req.body;

      // Vérifier que l'avis existe et appartient à l'utilisateur
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingReview) {
        return res.status(404).json({
          error: 'Avis non trouvé',
          message: 'L\'avis demandé n\'existe pas'
        });
      }

      const updateData = {};
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (title !== undefined) updateData.title = title;
      if (comment !== undefined) updateData.comment = comment;
      if (images !== undefined) updateData.images = images;

      const { data: review, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      logger.info('Avis mis à jour', { 
        reviewId: id, 
        userId 
      });

      res.json({
        success: true,
        message: 'Avis mis à jour avec succès',
        data: { review }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateReview:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour de l\'avis'
      });
    }
  }

  // Supprimer un avis
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que l'avis existe et appartient à l'utilisateur
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!existingReview && req.user.role !== 'admin') {
        return res.status(404).json({
          error: 'Avis non trouvé',
          message: 'L\'avis demandé n\'existe pas'
        });
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info('Avis supprimé', { 
        reviewId: id, 
        userId 
      });

      res.json({
        success: true,
        message: 'Avis supprimé avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur deleteReview:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de l\'avis'
      });
    }
  }

  // Signaler un avis comme utile
  async markHelpful(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: review, error } = await supabase
        .from('reviews')
        .select('helpful_count')
        .eq('id', id)
        .single();

      if (error || !review) {
        return res.status(404).json({
          error: 'Avis non trouvé',
          message: 'L\'avis demandé n\'existe pas'
        });
      }

      // Incrémenter le compteur
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ 
          helpful_count: (review.helpful_count || 0) + 1 
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: 'Avis marqué comme utile'
      });

    } catch (error) {
      logger.error('Erreur contrôleur markHelpful:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du marquage de l\'avis'
      });
    }
  }

  // Signaler un avis
  async reportReview(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const { data: review, error } = await supabase
        .from('reviews')
        .select('report_count')
        .eq('id', id)
        .single();

      if (error || !review) {
        return res.status(404).json({
          error: 'Avis non trouvé',
          message: 'L\'avis demandé n\'existe pas'
        });
      }

      // Incrémenter le compteur de signalements
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ 
          report_count: (review.report_count || 0) + 1 
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Journaliser le signalement
      await supabase
        .from('audit_logs')
        .insert({
          user_id: req.user.id,
          action: 'REVIEW_REPORTED',
          resource_type: 'review',
          resource_id: parseInt(id),
          details: { reason }
        });

      logger.info('Avis signalé', { 
        reviewId: id, 
        userId: req.user.id,
        reason 
      });

      res.json({
        success: true,
        message: 'Avis signalé avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur reportReview:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du signalement de l\'avis'
      });
    }
  }

  // Méthode helper pour calculer les statistiques des notes
  calculateRatingStats(reviews) {
    const stats = {
      average: 0,
      total: reviews.length,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (reviews.length === 0) {
      return stats;
    }

    const totalRating = reviews.reduce((sum, review) => {
      stats.distribution[review.rating]++;
      return sum + review.rating;
    }, 0);

    stats.average = parseFloat((totalRating / reviews.length).toFixed(1));

    // Calculer les pourcentages
    for (let rating in stats.distribution) {
      stats.distribution[rating] = {
        count: stats.distribution[rating],
        percentage: parseFloat(((stats.distribution[rating] / reviews.length) * 100).toFixed(1))
      };
    }

    return stats;
  }
}

module.exports = new ReviewController();
