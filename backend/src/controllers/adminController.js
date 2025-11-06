const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class AdminController {
  // Obtenir les statistiques générales de la plateforme
  async getDashboardStats(req, res) {
    try {
      const [
        { count: totalUsers },
        { count: totalProducts },
        { count: totalOrders },
        { count: totalSellers },
        { data: revenueData },
        { data: recentOrders }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .eq('is_available', true),
        
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'cancelled'),
        
        supabase
          .from('seller_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'delivered'),
        
        supabase
          .from('orders')
          .select(`
            *,
            profiles (first_name, last_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Calculer le revenu total
      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Statistiques des commandes par statut
      const { data: ordersByStatus } = await supabase
        .from('orders')
        .select('status')
        .neq('status', 'cancelled');

      const statusStats = ordersByStatus?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}) || {};

      res.json({
        success: true,
        data: {
          overview: {
            total_users: totalUsers || 0,
            total_products: totalProducts || 0,
            total_orders: totalOrders || 0,
            total_sellers: totalSellers || 0,
            total_revenue: parseFloat(totalRevenue.toFixed(2))
          },
          orders_by_status: statusStats,
          recent_orders: recentOrders || []
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getDashboardStats:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Obtenir tous les utilisateurs avec filtres
  async getAllUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        role, 
        status = 'active',
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('profiles')
        .select(`
          *,
          seller_profiles (*)
        `, { count: 'exact' });

      // Filtres
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Tri
      const sortField = sort_by === 'last_login' ? 'last_login' : 'created_at';
      const sortDir = sort_order === 'asc' ? 'asc' : 'desc';

      const { data: users, error, count } = await query
        .order(sortField, { ascending: sortDir === 'asc', nullsFirst: false })
        .range(offset, offset + limit - 1);

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
      logger.error('Erreur contrôleur getAllUsers:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }

  // Obtenir toutes les commandes avec filtres
  async getAllOrders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        date_from, 
        date_to,
        search
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (first_name, last_name, email)
        `, { count: 'exact' });

      // Filtres
      if (status) {
        query = query.eq('status', status);
      }

      if (date_from) {
        query = query.gte('created_at', date_from);
      }

      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data: orders, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getAllOrders:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des commandes'
      });
    }
  }

  // Obtenir tous les produits avec filtres
  async getAllProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = 'published',
        category,
        search
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name),
          profiles (first_name, last_name),
          seller_profiles (store_name)
        `, { count: 'exact' });

      // Filtres
      if (status === 'published') {
        query = query.eq('is_published', true).eq('is_available', true);
      } else if (status === 'unpublished') {
        query = query.eq('is_published', false);
      } else if (status === 'out_of_stock') {
        query = query.eq('is_published', true).eq('is_available', false);
      }

      if (category) {
        query = query.eq('category_id', category);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      const { data: products, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getAllProducts:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des produits'
      });
    }
  }

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes, tracking_number } = req.body;

      // Vérifier que la commande existe
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', id)
        .single();

      if (!existingOrder) {
        return res.status(404).json({
          error: 'Commande non trouvée',
          message: 'La commande demandée n\'existe pas'
        });
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status,
          admin_notes,
          tracking_number,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          profiles (first_name, last_name, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Créer une notification pour l'utilisateur
      await supabase
        .from('notifications')
        .insert({
          user_id: order.user_id,
          type: 'ORDER_STATUS_UPDATED',
          title: `Statut de commande mis à jour - ${order.order_number}`,
          message: `Votre commande est maintenant ${status}`,
          action_url: `/orders/${order.id}`,
          priority: 'medium'
        });

      logger.info('Statut de commande mis à jour', { 
        orderId: id, 
        oldStatus: existingOrder.status, 
        newStatus: status,
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Statut de commande mis à jour avec succès',
        data: { order }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateOrderStatus:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour du statut'
      });
    }
  }

  // Gérer les vendeurs (approuver/désapprouver)
  async manageSeller(req, res) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // action: 'approve', 'reject', 'suspend'

      // Vérifier que le vendeur existe
      const { data: seller } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (!seller) {
        return res.status(404).json({
          error: 'Vendeur non trouvé',
          message: 'Le vendeur demandé n\'existe pas'
        });
      }

      let updateData = {};
      let notificationMessage = '';

      switch (action) {
        case 'approve':
          updateData = { is_verified: true, is_active: true };
          notificationMessage = 'Votre compte vendeur a été approuvé. Vous pouvez maintenant vendre sur notre plateforme.';
          break;
        case 'reject':
          updateData = { is_verified: false, is_active: false };
          notificationMessage = `Votre demande de compte vendeur a été rejetée. Raison: ${reason || 'Non spécifiée'}`;
          break;
        case 'suspend':
          updateData = { is_active: false };
          notificationMessage = `Votre compte vendeur a été suspendu. Raison: ${reason || 'Non spécifiée'}`;
          break;
        default:
          return res.status(400).json({
            error: 'Action invalide',
            message: 'L\'action doit être: approve, reject ou suspend'
          });
      }

      const { data: updatedSeller, error } = await supabase
        .from('seller_profiles')
        .update(updateData)
        .eq('user_id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Notification au vendeur
      await supabase
        .from('notifications')
        .insert({
          user_id: id,
          type: 'SELLER_ACCOUNT_UPDATE',
          title: 'Mise à jour de votre compte vendeur',
          message: notificationMessage,
          priority: 'high'
        });

      logger.info('Statut vendeur mis à jour', { 
        sellerId: id, 
        action,
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: `Vendeur ${action} avec succès`,
        data: { seller: updatedSeller }
      });

    } catch (error) {
      logger.error('Erreur contrôleur manageSeller:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la gestion du vendeur'
      });
    }
  }

  // Obtenir les logs système
  async getSystemLogs(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        type = 'all',
        date_from,
        date_to
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filtres
      if (type !== 'all') {
        query = query.eq('action', type);
      }

      if (date_from) {
        query = query.gte('created_at', date_from);
      }

      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const { data: logs, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getSystemLogs:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des logs'
      });
    }
  }
}

module.exports = new AdminController();
