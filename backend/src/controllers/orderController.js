const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class OrderController {
  // Obtenir les commandes de l'utilisateur
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 10, 
        status,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              slug,
              images
            )
          )
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Filtres
      if (status) {
        query = query.eq('status', status);
      }

      // Tri
      const sortField = sort_by === 'total_amount' ? 'total_amount' : 'created_at';
      const sortDir = sort_order === 'asc' ? 'asc' : 'desc';

      const { data: orders, error, count } = await query
        .order(sortField, { ascending: sortDir === 'asc' })
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
      logger.error('Erreur contrôleur getUserOrders:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des commandes'
      });
    }
  }

  // Obtenir une commande spécifique
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              slug,
              images,
              specifications,
              profiles (first_name, last_name),
              seller_profiles (store_name)
            )
          ),
          payments (*),
          coupons (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Commande non trouvée',
            message: 'La commande demandée n\'existe pas'
          });
        }
        throw error;
      }

      // Vérifier que l'utilisateur a le droit de voir cette commande
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous n\'avez pas accès à cette commande'
        });
      }

      res.json({
        success: true,
        data: { order }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getOrderById:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la commande'
      });
    }
  }

  // Créer une nouvelle commande
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { 
        shipping_address_id, 
        billing_address_id, 
        cart_items, 
        coupon_code,
        payment_method 
      } = req.body;

      // Validation
      if (!shipping_address_id) {
        return res.status(400).json({
          error: 'Adresse manquante',
          message: 'L\'adresse de livraison est requise'
        });
      }

      // Vérifier l'adresse de livraison
      const { data: shippingAddress } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', shipping_address_id)
        .eq('user_id', userId)
        .single();

      if (!shippingAddress) {
        return res.status(404).json({
          error: 'Adresse non trouvée',
          message: 'L\'adresse de livraison spécifiée n\'existe pas'
        });
      }

      // Utiliser les articles du panier ou ceux fournis
      let items = cart_items;
      if (!items || items.length === 0) {
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              track_quantity,
              quantity as stock_quantity,
              is_available,
              is_published
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!cartItems || cartItems.length === 0) {
          return res.status(400).json({
            error: 'Panier vide',
            message: 'Votre panier est vide'
          });
        }

        items = cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.products
        }));
      }

      // Valider les articles et calculer le total
      let subtotal = 0;
      let itemsCount = 0;

      for (const item of items) {
        const product = item.product;

        // Vérifier la disponibilité
        if (!product.is_available || !product.is_published) {
          return res.status(400).json({
            error: 'Produit non disponible',
            message: `Le produit "${product.name}" n'est plus disponible`
          });
        }

        // Vérifier le stock
        if (product.track_quantity && product.stock_quantity < item.quantity) {
          return res.status(400).json({
            error: 'Stock insuffisant',
            message: `Stock insuffisant pour "${product.name}"`
          });
        }

        subtotal += product.price * item.quantity;
        itemsCount += item.quantity;
      }

      // Appliquer le coupon si fourni
      let discount_amount = 0;
      let coupon_id = null;

      if (coupon_code) {
        const { data: validation } = await supabase.rpc('validate_coupon', {
          coupon_code,
          user_id: userId,
          order_amount: subtotal
        });

        if (!validation.valid) {
          return res.status(400).json({
            error: 'Coupon invalide',
            message: validation.errors?.[0] || 'Code promo invalide'
          });
        }

        discount_amount = validation.discount_amount;
        coupon_id = validation.coupon.id;
      }

      // Calculer les frais de livraison
      const shipping_cost = await supabase.rpc('calculate_shipping_cost', {
        city: shippingAddress.city,
        country: shippingAddress.country,
        order_amount: subtotal
      });

      // Calculer les taxes (exemple: 18%)
      const tax_amount = subtotal * 0.18;

      // Calculer le total final
      const total_amount = subtotal + shipping_cost + tax_amount - discount_amount;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_number: await this.generateOrderNumber(),
          status: 'pending',
          subtotal: parseFloat(subtotal.toFixed(2)),
          shipping_cost: parseFloat(shipping_cost.toFixed(2)),
          tax_amount: parseFloat(tax_amount.toFixed(2)),
          discount_amount: parseFloat(discount_amount.toFixed(2)),
          total_amount: parseFloat(total_amount.toFixed(2)),
          items_count: itemsCount,
          shipping_address: shippingAddress,
          billing_address: billing_address_id ? 
            (await supabase.from('addresses').select('*').eq('id', billing_address_id).single()).data : 
            shippingAddress,
          coupon_id
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Créer les order_items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        specifications: item.product.specifications || {}
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Vider le panier
      await supabase
        .from('cart_items')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      logger.info('Nouvelle commande créée', { 
        orderId: order.id, 
        userId,
        total: order.total_amount 
      });

      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        data: { order }
      });

    } catch (error) {
      logger.error('Erreur contrôleur createOrder:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de la commande'
      });
    }
  }

  // Annuler une commande
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      // Vérifier que la commande existe
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (!order) {
        return res.status(404).json({
          error: 'Commande non trouvée',
          message: 'La commande demandée n\'existe pas'
        });
      }

      // Vérifier les permissions
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous ne pouvez annuler que vos propres commandes'
        });
      }

      // Vérifier que la commande peut être annulée
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          error: 'Commande non annulable',
          message: 'Cette commande ne peut plus être annulée'
        });
      }

      // Annuler la commande
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: userId,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Restaurer le stock
      await supabase.rpc('restore_product_stock', { order_id: id });

      logger.info('Commande annulée', { 
        orderId: id, 
        userId,
        reason 
      });

      res.json({
        success: true,
        message: 'Commande annulée avec succès',
        data: { order: updatedOrder }
      });

    } catch (error) {
      logger.error('Erreur contrôleur cancelOrder:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'annulation de la commande'
      });
    }
  }

  // Générer un numéro de commande unique
  async generateOrderNumber() {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BS-${timestamp}-${random}`;
  }
}

module.exports = new OrderController();
