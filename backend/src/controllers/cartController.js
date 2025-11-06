const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class CartController {
  // Obtenir le panier de l'utilisateur
  async getCart(req, res) {
    try {
      const userId = req.user.id;

      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            slug,
            price,
            compare_price,
            images,
            specifications,
            track_quantity,
            quantity as stock_quantity,
            is_available
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Calculer le total
      const total = cartItems.reduce((sum, item) => {
        return sum + (item.products.price * item.quantity);
      }, 0);

      res.json({
        success: true,
        data: {
          items: cartItems,
          summary: {
            items_count: cartItems.length,
            total: parseFloat(total.toFixed(2))
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCart:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du panier'
      });
    }
  }

  // Ajouter un produit au panier
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, quantity = 1, variant_id = null } = req.body;

      // Validation
      if (!product_id) {
        return res.status(400).json({
          error: 'Produit manquant',
          message: 'L\'ID du produit est requis'
        });
      }

      // Vérifier si le produit existe et est disponible
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price, track_quantity, quantity, is_available, is_published')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          error: 'Produit non trouvé',
          message: 'Le produit demandé n\'existe pas'
        });
      }

      if (!product.is_available || !product.is_published) {
        return res.status(400).json({
          error: 'Produit non disponible',
          message: 'Ce produit n\'est pas disponible pour le moment'
        });
      }

      // Vérifier le stock
      if (product.track_quantity && product.quantity < quantity) {
        return res.status(400).json({
          error: 'Stock insuffisant',
          message: 'La quantité demandée n\'est pas disponible en stock'
        });
      }

      // Vérifier si l'article est déjà dans le panier
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .eq('variant_id', variant_id)
        .eq('is_active', true)
        .single();

      let cartItem;

      if (existingItem) {
        // Mettre à jour la quantité
        const newQuantity = existingItem.quantity + quantity;
        
        // Vérifier à nouveau le stock
        if (product.track_quantity && product.quantity < newQuantity) {
          return res.status(400).json({
            error: 'Stock insuffisant',
            message: 'La quantité totale demandée dépasse le stock disponible'
          });
        }

        const { data: updatedItem, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select(`
            *,
            products (
              id,
              name,
              slug,
              price,
              images,
              specifications
            )
          `)
          .single();

        if (updateError) {
          throw updateError;
        }

        cartItem = updatedItem;
      } else {
        // Ajouter un nouvel article
        const { data: newItem, error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id,
            variant_id,
            quantity
          })
          .select(`
            *,
            products (
              id,
              name,
              slug,
              price,
              images,
              specifications
            )
          `)
          .single();

        if (insertError) {
          throw insertError;
        }

        cartItem = newItem;
      }

      logger.info('Produit ajouté au panier', { 
        userId, 
        productId: product_id,
        quantity 
      });

      res.status(201).json({
        success: true,
        message: 'Produit ajouté au panier',
        data: { cartItem }
      });

    } catch (error) {
      logger.error('Erreur contrôleur addToCart:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'ajout au panier'
      });
    }
  }

  // Mettre à jour la quantité d'un article
  async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          error: 'Quantité invalide',
          message: 'La quantité doit être au moins 1'
        });
      }

      // Vérifier que l'article appartient à l'utilisateur
      const { data: cartItem, error: fetchError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            track_quantity,
            quantity as stock_quantity
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (fetchError || !cartItem) {
        return res.status(404).json({
          error: 'Article non trouvé',
          message: 'L\'article demandé n\'existe pas dans votre panier'
        });
      }

      // Vérifier le stock
      if (cartItem.products.track_quantity && cartItem.products.stock_quantity < quantity) {
        return res.status(400).json({
          error: 'Stock insuffisant',
          message: 'La quantité demandée n\'est pas disponible en stock'
        });
      }

      // Mettre à jour la quantité
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .select(`
          *,
          products (
            id,
            name,
            slug,
            price,
            images,
            specifications
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: 'Quantité mise à jour',
        data: { cartItem: updatedItem }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateCartItem:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour du panier'
      });
    }
  }

  // Supprimer un article du panier
  async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Vérifier que l'article appartient à l'utilisateur
      const { data: cartItem } = await supabase
        .from('cart_items')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!cartItem) {
        return res.status(404).json({
          error: 'Article non trouvé',
          message: 'L\'article demandé n\'existe pas dans votre panier'
        });
      }

      // Soft delete
      const { error } = await supabase
        .from('cart_items')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info('Article retiré du panier', { userId, cartItemId: id });

      res.json({
        success: true,
        message: 'Article retiré du panier'
      });

    } catch (error) {
      logger.error('Erreur contrôleur removeFromCart:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de l\'article'
      });
    }
  }

  // Vider le panier
  async clearCart(req, res) {
    try {
      const userId = req.user.id;

      const { error } = await supabase
        .from('cart_items')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      logger.info('Panier vidé', { userId });

      res.json({
        success: true,
        message: 'Panier vidé avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur clearCart:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du vidage du panier'
      });
    }
  }

  // Obtenir le nombre d'articles dans le panier
  async getCartCount(req, res) {
    try {
      const userId = req.user.id;

      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: { count: count || 0 }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCartCount:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du comptage des articles'
      });
    }
  }
}

module.exports = new CartController();
