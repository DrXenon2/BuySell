/**
 * Service de gestion avancée du panier Buysell
 * Support des quantités multiples, sauvegarde, partage et fonctionnalités avancées
 */

import { supabaseClient } from './supabaseClient';

class MultiCartService {
  constructor() {
    this.supabase = supabaseClient;
  }

  /**
   * Obtenir le panier de l'utilisateur
   */
  async getCart(userId = null) {
    try {
      // Si userId est fourni, récupérer depuis la base de données
      if (userId) {
        const { data, error } = await this.supabase
          .from('user_carts')
          .select(`
            *,
            cart_items (
              *,
              products (
                name,
                price,
                images,
                sku,
                brands (name),
                product_stock (quantity, reserved_quantity)
              )
            )
          `)
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            items: data.cart_items.map(item => this.formatCartItem(item)),
            total: data.total_amount,
            itemCount: data.item_count,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      }

      // Fallback: panier local (session)
      return this.getLocalCart();
    } catch (error) {
      console.error('Erreur récupération panier:', error);
      return this.getLocalCart();
    }
  }

  /**
   * Ajouter un produit au panier
   */
  async addToCart(cartItem, userId = null) {
    try {
      const { productId, quantity, options, isSecondHand } = cartItem;

      // Vérifier la disponibilité
      const availability = await this.checkProductAvailability(productId, quantity);
      if (!availability.available) {
        return {
          success: false,
          error: 'Produit non disponible',
          availableQuantity: availability.availableQuantity
        };
      }

      if (userId) {
        // Ajouter au panier utilisateur en base de données
        return await this.addToUserCart(userId, cartItem);
      } else {
        // Ajouter au panier local
        return await this.addToLocalCart(cartItem);
      }
    } catch (error) {
      console.error('Erreur ajout au panier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mettre à jour la quantité d'un produit
   */
  async updateQuantity(productId, newQuantity, userId = null) {
    try {
      if (newQuantity < 1) {
        return await this.removeFromCart(productId, userId);
      }

      // Vérifier la disponibilité
      const availability = await this.checkProductAvailability(productId, newQuantity);
      if (!availability.available) {
        return {
          success: false,
          error: 'Quantité non disponible',
          availableQuantity: availability.availableQuantity
        };
      }

      if (userId) {
        return await this.updateUserCartQuantity(userId, productId, newQuantity);
      } else {
        return await this.updateLocalCartQuantity(productId, newQuantity);
      }
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer un produit du panier
   */
  async removeFromCart(productId, userId = null) {
    try {
      if (userId) {
        const { error } = await this.supabase
          .from('cart_items')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', userId);

        if (error) throw error;

        return { success: true, productId };
      } else {
        return await this.removeFromLocalCart(productId);
      }
    } catch (error) {
      console.error('Erreur suppression panier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vider complètement le panier
   */
  async clearCart(userId = null) {
    try {
      if (userId) {
        const { error } = await this.supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        return { success: true };
      } else {
        localStorage.removeItem('buysell_cart');
        return { success: true };
      }
    } catch (error) {
      console.error('Erreur vidage panier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sauvegarder le panier actuel
   */
  async saveCart(saveData, userId = null) {
    try {
      const { name, description, items } = saveData;

      if (userId) {
        const { data, error } = await this.supabase
          .from('saved_carts')
          .insert({
            user_id: userId,
            name,
            description,
            cart_data: items || await this.getCartItems(userId),
            saved_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          savedCartId: data.id,
          name: data.name,
          savedAt: data.saved_at
        };
      } else {
        const localCart = this.getLocalCart();
        const savedCarts = this.getSavedCarts();
        
        const newSavedCart = {
          id: Date.now().toString(),
          name,
          description,
          items: localCart.items,
          savedAt: new Date().toISOString(),
          itemCount: localCart.items.length,
          total: this.calculateTotal(localCart.items)
        };

        savedCarts.push(newSavedCart);
        localStorage.setItem('buysell_saved_carts', JSON.stringify(savedCarts));

        return {
          success: true,
          savedCartId: newSavedCart.id,
          name: newSavedCart.name,
          savedAt: newSavedCart.savedAt
        };
      }
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les paniers sauvegardés
   */
  async getSavedCarts(userId = null) {
    try {
      if (userId) {
        const { data, error } = await this.supabase
          .from('saved_carts')
          .select('*')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false });

        if (error) throw error;

        return data.map(cart => ({
          id: cart.id,
          name: cart.name,
          description: cart.description,
          items: cart.cart_data,
          savedAt: cart.saved_at,
          itemCount: cart.cart_data.length,
          total: this.calculateTotal(cart.cart_data)
        }));
      } else {
        return this.getLocalSavedCarts();
      }
    } catch (error) {
      console.error('Erreur récupération paniers sauvegardés:', error);
      return [];
    }
  }

  /**
   * Charger un panier sauvegardé
   */
  async loadSavedCart(savedCartId, userId = null) {
    try {
      if (userId) {
        const { data, error } = await this.supabase
          .from('saved_carts')
          .select('*')
          .eq('id', savedCartId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        // Vider le panier actuel
        await this.clearCart(userId);

        // Ajouter les items du panier sauvegardé
        for (const item of data.cart_data) {
          await this.addToCart(item, userId);
        }

        return {
          success: true,
          loadedCart: data,
          itemCount: data.cart_data.length
        };
      } else {
        const savedCarts = this.getLocalSavedCarts();
        const savedCart = savedCarts.find(cart => cart.id === savedCartId);

        if (!savedCart) {
          throw new Error('Panier sauvegardé non trouvé');
        }

        // Remplacer le panier actuel
        localStorage.setItem('buysell_cart', JSON.stringify({
          items: savedCart.items,
          updatedAt: new Date().toISOString()
        }));

        return {
          success: true,
          loadedCart: savedCart,
          itemCount: savedCart.items.length
        };
      }
    } catch (error) {
      console.error('Erreur chargement panier sauvegardé:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Partager le panier
   */
  async shareCart(shareData, userId = null) {
    try {
      const { recipientEmail, message, items } = shareData;

      // Créer un lien de partage unique
      const shareId = this.generateShareId();
      const shareUrl = `${window.location.origin}/shared-cart/${shareId}`;

      if (userId) {
        // Sauvegarder le partage en base de données
        const { data, error } = await this.supabase
          .from('cart_shares')
          .insert({
            share_id: shareId,
            user_id: userId,
            recipient_email: recipientEmail,
            message,
            cart_data: items || await this.getCartItems(userId),
            share_url: shareUrl,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
          })
          .select()
          .single();

        if (error) throw error;

        // Ici, vous intégreriez un service d'email
        await this.sendShareEmail(recipientEmail, shareUrl, message);

        return {
          success: true,
          shareId: data.share_id,
          shareUrl: data.share_url,
          expiresAt: data.expires_at
        };
      } else {
        // Partage local
        const sharedCarts = this.getLocalSharedCarts();
        const localCart = this.getLocalCart();

        const sharedCart = {
          shareId,
          items: items || localCart.items,
          sharedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          shareUrl
        };

        sharedCarts.push(sharedCart);
        localStorage.setItem('buysell_shared_carts', JSON.stringify(sharedCarts));

        // Simulation envoi email
        await this.sendShareEmail(recipientEmail, shareUrl, message);

        return {
          success: true,
          shareId,
          shareUrl,
          expiresAt: sharedCart.expiresAt
        };
      }
    } catch (error) {
      console.error('Erreur partage panier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifier la disponibilité des produits du panier
   */
  async checkCartAvailability(cartItems, userId = null) {
    try {
      const items = cartItems || await this.getCartItems(userId);
      const availabilityResults = [];

      for (const item of items) {
        const availability = await this.checkProductAvailability(item.productId, item.quantity);
        availabilityResults.push({
          productId: item.productId,
          available: availability.available,
          availableQuantity: availability.availableQuantity,
          requestedQuantity: item.quantity,
          productName: item.productName
        });
      }

      const allAvailable = availabilityResults.every(result => result.available);
      const unavailableItems = availabilityResults.filter(result => !result.available);

      return {
        available: allAvailable,
        unavailableItems,
        results: availabilityResults
      };
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return {
        available: false,
        unavailableItems: [],
        error: error.message
      };
    }
  }

  /**
   * Obtenir les suggestions de produits complémentaires
   */
  async getCartSuggestions(cartItems, limit = 4) {
    try {
      // Simuler des suggestions basées sur les produits du panier
      const categories = [...new Set(cartItems.map(item => item.categoryId))];
      const brands = [...new Set(cartItems.map(item => item.brandId))];

      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          categories (name),
          brands (name),
          product_images (url),
          product_stock (quantity)
        `)
        .in('category_id', categories.slice(0, 3))
        .eq('is_active', true)
        .gt('product_stock.quantity', 0)
        .limit(limit);

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.product_images?.[0]?.url,
        category: product.categories?.name,
        brand: product.brands?.name,
        inStock: (product.product_stock?.[0]?.quantity || 0) > 0,
        reason: 'Souvent acheté ensemble'
      }));
    } catch (error) {
      console.error('Erreur récupération suggestions:', error);
      return [];
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  async addToUserCart(userId, cartItem) {
    const { productId, quantity, options, isSecondHand } = cartItem;

    // Vérifier si le produit est déjà dans le panier
    const { data: existingItem } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + quantity;
      const { error } = await this.supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Ajouter un nouvel item
      const { error } = await this.supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
          options: options || {},
          is_second_hand: isSecondHand || false,
          added_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return { success: true, productId, quantity };
  }

  async addToLocalCart(cartItem) {
    const localCart = this.getLocalCart();
    const existingItemIndex = localCart.items.findIndex(item => item.productId === cartItem.productId);

    if (existingItemIndex !== -1) {
      localCart.items[existingItemIndex].quantity += cartItem.quantity;
    } else {
      localCart.items.push({
        ...cartItem,
        addedAt: new Date().toISOString()
      });
    }

    localCart.updatedAt = new Date().toISOString();
    localStorage.setItem('buysell_cart', JSON.stringify(localCart));

    return { success: true, productId: cartItem.productId, quantity: cartItem.quantity };
  }

  getLocalCart() {
    try {
      const cartData = localStorage.getItem('buysell_cart');
      if (cartData) {
        const cart = JSON.parse(cartData);
        return {
          items: cart.items || [],
          updatedAt: cart.updatedAt,
          total: this.calculateTotal(cart.items || [])
        };
      }
    } catch (error) {
      console.error('Erreur lecture panier local:', error);
    }

    return {
      items: [],
      updatedAt: new Date().toISOString(),
      total: 0
    };
  }

  formatCartItem(item) {
    return {
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name,
      price: item.products?.price,
      image: item.products?.images?.[0],
      sku: item.products?.sku,
      brand: item.products?.brands?.name,
      quantity: item.quantity,
      options: item.options,
      isSecondHand: item.is_second_hand,
      stock: item.products?.product_stock?.[0],
      addedAt: item.added_at
    };
  }

  calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  async checkProductAvailability(productId, quantity) {
    try {
      const { data, error } = await this.supabase
        .from('product_stock')
        .select('quantity, reserved_quantity')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      const available = data.quantity - data.reserved_quantity;
      return {
        available: available >= quantity,
        availableQuantity: available,
        totalQuantity: data.quantity,
        reservedQuantity: data.reserved_quantity
      };
    } catch (error) {
      console.error('Erreur vérification disponibilité produit:', error);
      return {
        available: false,
        availableQuantity: 0,
        totalQuantity: 0,
        reservedQuantity: 0
      };
    }
  }

  async getCartItems(userId) {
    if (userId) {
      const cart = await this.getCart(userId);
      return cart.items;
    } else {
      const localCart = this.getLocalCart();
      return localCart.items;
    }
  }

  getLocalSavedCarts() {
    try {
      const savedCarts = localStorage.getItem('buysell_saved_carts');
      return savedCarts ? JSON.parse(savedCarts) : [];
    } catch (error) {
      return [];
    }
  }

  getLocalSharedCarts() {
    try {
      const sharedCarts = localStorage.getItem('buysell_shared_carts');
      return sharedCarts ? JSON.parse(sharedCarts) : [];
    } catch (error) {
      return [];
    }
  }

  generateShareId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async sendShareEmail(recipientEmail, shareUrl, message) {
    // Simulation d'envoi d'email
    console.log(`Email envoyé à ${recipientEmail}: ${message} - ${shareUrl}`);
    // En production, intégrer avec un service d'email comme Resend, SendGrid, etc.
    return { success: true };
  }

  async updateUserCartQuantity(userId, productId, newQuantity) {
    const { error } = await this.supabase
      .from('cart_items')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;

    return { success: true, productId, newQuantity };
  }

  async updateLocalCartQuantity(productId, newQuantity) {
    const localCart = this.getLocalCart();
    const itemIndex = localCart.items.findIndex(item => item.productId === productId);

    if (itemIndex !== -1) {
      localCart.items[itemIndex].quantity = newQuantity;
      localCart.updatedAt = new Date().toISOString();
      localStorage.setItem('buysell_cart', JSON.stringify(localCart));
    }

    return { success: true, productId, newQuantity };
  }

  async removeFromLocalCart(productId) {
    const localCart = this.getLocalCart();
    localCart.items = localCart.items.filter(item => item.productId !== productId);
    localCart.updatedAt = new Date().toISOString();
    localStorage.setItem('buysell_cart', JSON.stringify(localCart));

    return { success: true, productId };
  }
}

// Instance singleton
const multiCartService = new MultiCartService();

export default multiCartService;
