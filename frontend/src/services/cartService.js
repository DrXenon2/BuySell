/**
 * Cart service
 */

import { apiService } from './api';
import { setToStorage, getFromStorage, removeFromStorage } from '../utils/localStorage';
import { STORAGE_KEYS } from '../utils/constants';

class CartService {
  constructor() {
    this.initializeCart();
  }

  /**
   * Initialize cart from localStorage or API
   */
  async initializeCart() {
    // Try to get cart from API first (if user is authenticated)
    try {
      const userCart = await this.getUserCart();
      if (userCart && userCart.items && userCart.items.length > 0) {
        this.setLocalCart(userCart);
        return;
      }
    } catch (error) {
      console.log('Could not fetch user cart, using local storage:', error);
    }

    // Fallback to local storage
    const localCart = this.getLocalCart();
    if (!localCart) {
      this.setLocalCart({ items: [], total: 0, count: 0 });
    }
  }

  /**
   * Get cart from local storage
   */
  getLocalCart() {
    return getFromStorage(STORAGE_KEYS.CART_ITEMS) || { items: [], total: 0, count: 0 };
  }

  /**
   * Set cart in local storage
   */
  setLocalCart(cart) {
    setToStorage(STORAGE_KEYS.CART_ITEMS, cart);
  }

  /**
   * Clear local cart
   */
  clearLocalCart() {
    removeFromStorage(STORAGE_KEYS.CART_ITEMS);
  }

  /**
   * Get user cart from API
   */
  async getUserCart() {
    return await apiService.get('/cart');
  }

  /**
   * Sync local cart with server
   */
  async syncCart() {
    const localCart = this.getLocalCart();
    
    if (localCart.items.length === 0) {
      return await this.getUserCart();
    }

    try {
      // Merge local cart with server cart
      const serverCart = await this.getUserCart();
      const mergedItems = this.mergeCartItems(localCart.items, serverCart.items);
      
      // Update server cart with merged items
      const updatedCart = await this.updateCart(mergedItems);
      this.setLocalCart(updatedCart);
      
      return updatedCart;
    } catch (error) {
      console.log('Cart sync failed, using local cart:', error);
      return localCart;
    }
  }

  /**
   * Merge local and server cart items
   */
  mergeCartItems(localItems, serverItems) {
    const merged = [...serverItems];
    
    localItems.forEach(localItem => {
      const existingIndex = merged.findIndex(
        serverItem => serverItem.productId === localItem.productId
      );
      
      if (existingIndex > -1) {
        // Update quantity if product exists
        merged[existingIndex].quantity += localItem.quantity;
      } else {
        // Add new item
        merged.push(localItem);
      }
    });
    
    return merged;
  }

  /**
   * Add item to cart
   */
  async addToCart(product, quantity = 1, options = {}) {
    const cartItem = {
      productId: product.id,
      product,
      quantity,
      price: product.discountedPrice || product.price,
      options: options.variants || {},
      notes: options.notes || '',
    };

    try {
      // Try to add to server cart first
      const response = await apiService.post('/cart/items', cartItem);
      this.setLocalCart(response.cart);
      return response.cart;
    } catch (error) {
      // Fallback to local storage
      console.log('Server cart update failed, using local storage:', error);
      return this.addToLocalCart(cartItem);
    }
  }

  /**
   * Add item to local cart
   */
  addToLocalCart(cartItem) {
    const cart = this.getLocalCart();
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === cartItem.productId
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += cartItem.quantity;
    } else {
      // Add new item
      cart.items.push(cartItem);
    }

    this.updateCartTotals(cart);
    this.setLocalCart(cart);
    return cart;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(productId, quantity) {
    if (quantity <= 0) {
      return await this.removeFromCart(productId);
    }

    try {
      // Try to update server cart first
      const response = await apiService.put(`/cart/items/${productId}`, { quantity });
      this.setLocalCart(response.cart);
      return response.cart;
    } catch (error) {
      // Fallback to local storage
      console.log('Server cart update failed, using local storage:', error);
      return this.updateLocalCartItem(productId, quantity);
    }
  }

  /**
   * Update local cart item
   */
  updateLocalCartItem(productId, quantity) {
    const cart = this.getLocalCart();
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      this.updateCartTotals(cart);
      this.setLocalCart(cart);
    }

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId) {
    try {
      // Try to remove from server cart first
      const response = await apiService.delete(`/cart/items/${productId}`);
      this.setLocalCart(response.cart);
      return response.cart;
    } catch (error) {
      // Fallback to local storage
      console.log('Server cart update failed, using local storage:', error);
      return this.removeFromLocalCart(productId);
    }
  }

  /**
   * Remove item from local cart
   */
  removeFromLocalCart(productId) {
    const cart = this.getLocalCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    this.updateCartTotals(cart);
    this.setLocalCart(cart);
    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart() {
    try {
      // Try to clear server cart first
      const response = await apiService.delete('/cart');
      this.setLocalCart(response.cart);
      return response.cart;
    } catch (error) {
      // Fallback to local storage
      console.log('Server cart clear failed, using local storage:', error);
      return this.clearLocalCart();
    }
  }

  /**
   * Get cart total and count
   */
  updateCartTotals(cart) {
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    cart.count = cart.items.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

    return cart;
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(couponCode) {
    try {
      const response = await apiService.post('/cart/coupon', { couponCode });
      this.setLocalCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon() {
    try {
      const response = await apiService.delete('/cart/coupon');
      this.setLocalCart(response.cart);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get shipping options for cart
   */
  async getShippingOptions(address) {
    const cart = this.getLocalCart();
    
    return await apiService.post('/cart/shipping-options', {
      items: cart.items,
      address,
    });
  }

  /**
   * Calculate cart totals with shipping and tax
   */
  async calculateTotals(shippingMethod = null, address = null) {
    const cart = this.getLocalCart();
    
    const data = {
      items: cart.items,
      shippingMethod,
      address,
    };

    return await apiService.post('/cart/calculate-totals', data);
  }

  /**
   * Move cart to user account (after login)
   */
  async moveCartToUser() {
    const localCart = this.getLocalCart();
    
    if (localCart.items.length === 0) {
      return await this.getUserCart();
    }

    try {
      // Add all local cart items to user cart
      for (const item of localCart.items) {
        await apiService.post('/cart/items', item);
      }

      // Get updated user cart
      const userCart = await this.getUserCart();
      this.setLocalCart(userCart);
      
      return userCart;
    } catch (error) {
      console.log('Failed to move cart to user account:', error);
      return localCart;
    }
  }

  /**
   * Save cart for later
   */
  async saveForLater(productId) {
    try {
      const response = await apiService.post(`/cart/items/${productId}/save`);
      // Remove from current cart
      await this.removeFromCart(productId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get saved items
   */
  async getSavedItems() {
    return await apiService.get('/cart/saved');
  }

  /**
   * Move saved item to cart
   */
  async moveToCart(productId) {
    try {
      const response = await apiService.post(`/cart/saved/${productId}/move`);
      // Add to local cart
      const cart = this.getLocalCart();
      cart.items.push(response.item);
      this.updateCartTotals(cart);
      this.setLocalCart(cart);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove saved item
   */
  async removeSavedItem(productId) {
    return await apiService.delete(`/cart/saved/${productId}`);
  }

  /**
   * Check product availability in cart
   */
  async checkAvailability() {
    const cart = this.getLocalCart();
    
    return await apiService.post('/cart/check-availability', {
      items: cart.items,
    });
  }

  /**
   * Get cart summary
   */
  getCartSummary() {
    const cart = this.getLocalCart();
    return {
      itemCount: cart.count,
      total: cart.total,
      items: cart.items,
    };
  }

  /**
   * Check if cart is empty
   */
  isEmpty() {
    const cart = this.getLocalCart();
    return cart.items.length === 0;
  }

  /**
   * Get cart item count
   */
  getItemCount() {
    const cart = this.getLocalCart();
    return cart.count;
  }

  /**
   * Get cart total
   */
  getTotal() {
    const cart = this.getLocalCart();
    return cart.total;
  }
}

// Create singleton instance
export const cartService = new CartService();

export default cartService;
