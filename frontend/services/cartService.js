import { http } from './api';

class CartService {
  constructor() {
    this.storageKey = 'buySell_cart';
    this.initializeCart();
  }

  // Initialiser le panier
  initializeCart() {
    if (typeof window === 'undefined') return;

    const savedCart = localStorage.getItem(this.storageKey);
    if (!savedCart) {
      this.saveToStorage({ items: [], total: 0, count: 0 });
    }
  }

  // Sauvegarder dans le localStorage
  saveToStorage(cart) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
  }

  // Récupérer depuis le localStorage
  getFromStorage() {
    if (typeof window === 'undefined') return { items: [], total: 0, count: 0 };
    
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || { items: [], total: 0, count: 0 };
    } catch {
      return { items: [], total: 0, count: 0 };
    }
  }

  // Calculer le total
  calculateTotal(items) {
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const count = items.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

    return { total, count };
  }

  // Récupérer le panier
  async getCart() {
    try {
      // Si l'utilisateur est connecté, récupérer du serveur
      const response = await http.get('/cart');
      
      if (response.success) {
        // Synchroniser avec le localStorage
        this.saveToStorage(response.data.cart);
        return response;
      }
      
      // Sinon, utiliser le localStorage
      const localCart = this.getFromStorage();
      return { success: true, data: { cart: localCart } };
    } catch (error) {
      // En cas d'erreur, utiliser le localStorage
      const localCart = this.getFromStorage();
      return { success: true, data: { cart: localCart } };
    }
  }

  // Ajouter un article au panier
  async addToCart(product, quantity = 1, options = {}) {
    try {
      const cartItem = {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        image: product.images?.[0],
        quantity,
        options: options.variants || {},
        ...options
      };

      // Si l'utilisateur est connecté, synchroniser avec le serveur
      const response = await http.post('/cart/items', cartItem);
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
        return response;
      }

      // Sinon, mettre à jour le localStorage
      const localCart = this.getFromStorage();
      const existingItemIndex = localCart.items.findIndex(
        item => item.product_id === product.id && 
        this.areOptionsEqual(item.options, options.variants)
      );

      if (existingItemIndex > -1) {
        // Mettre à jour la quantité
        localCart.items[existingItemIndex].quantity += quantity;
      } else {
        // Ajouter un nouvel article
        localCart.items.push(cartItem);
      }

      // Recalculer le total
      const { total, count } = this.calculateTotal(localCart.items);
      localCart.total = total;
      localCart.count = count;

      this.saveToStorage(localCart);
      
      return { 
        success: true, 
        data: { cart: localCart },
        message: 'Produit ajouté au panier'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour la quantité
  async updateQuantity(itemId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeFromCart(itemId);
      }

      // Si l'utilisateur est connecté
      const response = await http.put(`/cart/items/${itemId}`, { quantity });
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
        return response;
      }

      // Sinon, mettre à jour le localStorage
      const localCart = this.getFromStorage();
      const itemIndex = localCart.items.findIndex(item => item.id === itemId);

      if (itemIndex > -1) {
        localCart.items[itemIndex].quantity = quantity;
        
        const { total, count } = this.calculateTotal(localCart.items);
        localCart.total = total;
        localCart.count = count;

        this.saveToStorage(localCart);
        
        return { 
          success: true, 
          data: { cart: localCart },
          message: 'Quantité mise à jour'
        };
      }

      throw new Error('Article non trouvé dans le panier');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer un article du panier
  async removeFromCart(itemId) {
    try {
      // Si l'utilisateur est connecté
      const response = await http.delete(`/cart/items/${itemId}`);
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
        return response;
      }

      // Sinon, mettre à jour le localStorage
      const localCart = this.getFromStorage();
      localCart.items = localCart.items.filter(item => item.id !== itemId);
      
      const { total, count } = this.calculateTotal(localCart.items);
      localCart.total = total;
      localCart.count = count;

      this.saveToStorage(localCart);
      
      return { 
        success: true, 
        data: { cart: localCart },
        message: 'Article retiré du panier'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vider le panier
  async clearCart() {
    try {
      // Si l'utilisateur est connecté
      const response = await http.delete('/cart');
      
      if (response.success) {
        this.saveToStorage({ items: [], total: 0, count: 0 });
        return response;
      }

      // Sinon, vider le localStorage
      this.saveToStorage({ items: [], total: 0, count: 0 });
      
      return { 
        success: true, 
        data: { cart: { items: [], total: 0, count: 0 } },
        message: 'Panier vidé'
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Appliquer un code promo
  async applyCoupon(code) {
    try {
      const response = await http.post('/cart/coupon', { code });
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
      }
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Retirer un code promo
  async removeCoupon() {
    try {
      const response = await http.delete('/cart/coupon');
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
      }
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Synchroniser le panier local avec le serveur
  async syncCart() {
    try {
      const localCart = this.getFromStorage();
      
      if (localCart.items.length === 0) {
        return { success: true };
      }

      const response = await http.post('/cart/sync', { items: localCart.items });
      
      if (response.success) {
        this.saveToStorage(response.data.cart);
        return response;
      }
    } catch (error) {
      console.error('Sync cart error:', error);
    }
  }

  // Vérifier l'égalité des options
  areOptionsEqual(options1, options2) {
    if (!options1 && !options2) return true;
    if (!options1 || !options2) return false;
    
    const keys1 = Object.keys(options1);
    const keys2 = Object.keys(options2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => options1[key] === options2[key]);
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Cart Service Error:', error);
    
    const cartErrors = {
      'Insufficient stock': 'Stock insuffisant pour ce produit',
      'Product not available': 'Produit non disponible',
      'Invalid coupon': 'Code promo invalide',
      'Coupon expired': 'Code promo expiré',
    };

    const message = cartErrors[error.message] || 
                   error.message || 
                   'Erreur lors de la modification du panier';

    return {
      success: false,
      error: error.error || 'Cart Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new CartService();
