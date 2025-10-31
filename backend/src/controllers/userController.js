const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class UserController {
  // Obtenir tous les utilisateurs (admin seulement)
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Filtres
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      // Pagination
      const { data: users, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getUsers:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }

  // Obtenir un utilisateur par ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabase
        .from('profiles')
        .select(`
          *,
          seller_profiles (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Utilisateur non trouvé',
            message: 'L\'utilisateur demandé n\'existe pas'
          });
        }
        throw error;
      }

      // Ne pas retourner les données sensibles
      const { password, ...safeUser } = user;

      res.json({
        success: true,
        data: { user: safeUser }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getUserById:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'utilisateur'
      });
    }
  }

  // Mettre à jour un utilisateur (admin ou propre compte)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const currentUser = req.user;

      // Vérifier les permissions
      if (currentUser.id !== id && currentUser.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous ne pouvez modifier que votre propre profil'
        });
      }

      // Champs autorisés selon le rôle
      let allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url', 'bio', 'location'];
      
      if (currentUser.role === 'admin') {
        allowedFields = [...allowedFields, 'role', 'is_active'];
      }

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      const { data: user, error } = await supabase
        .from('profiles')
        .update(filteredData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Utilisateur mis à jour', { userId: id, updatedBy: currentUser.id });

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: { user }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateUser:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour de l\'utilisateur'
      });
    }
  }

  // Désactiver un utilisateur
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Utilisateur désactivé', { userId: id, deactivatedBy: req.user.id });

      res.json({
        success: true,
        message: 'Utilisateur désactivé avec succès',
        data: { user }
      });

    } catch (error) {
      logger.error('Erreur contrôleur deactivateUser:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la désactivation de l\'utilisateur'
      });
    }
  }

  // Obtenir les statistiques utilisateur
  async getUserStats(req, res) {
    try {
      const { id } = req.params;

      // Compter les commandes, avis, etc.
      const [
        { count: ordersCount },
        { count: reviewsCount },
        { data: sellerProfile }
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id),
        
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id),
        
        supabase
          .from('seller_profiles')
          .select('total_sales, total_orders, rating')
          .eq('user_id', id)
          .single()
      ]);

      const stats = {
        orders: ordersCount || 0,
        reviews: reviewsCount || 0,
        seller_stats: sellerProfile || null
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getUserStats:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
}

module.exports = new UserController();
