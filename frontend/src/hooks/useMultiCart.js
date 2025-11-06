import { useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';

/**
 * Hook pour la gestion avancée du panier avec fonctionnalités multiples
 * Support des quantités variables, produits multiples, sauvegarde, partage
 */

export const useMultiCart = () => {
  const [cart, setCart] = useState([]);
  const [savedCarts, setSavedCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Charger le panier depuis le service
  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData.items || []);
      setLoading(false);
      return cartData;
    } catch (err) {
      setError('Erreur lors du chargement du panier');
      setLoading(false);
      return { items: [] };
    }
  }, []);

  // Charger les paniers sauvegardés
  const loadSavedCarts = useCallback(async () => {
    try {
      const saved = await cartService.getSavedCarts();
      setSavedCarts(saved);
      return saved;
    } catch (err) {
      console.error('Erreur lors du chargement des paniers sauvegardés:', err);
      return [];
    }
  }, []);

  // Ajouter un produit au panier avec quantité personnalisée
  const addToCart = useCallback(async (product, quantity = 1, options = {}) => {
    setLoading(true);
    try {
      const result = await cartService.addToCart({
        productId: product.id,
        quantity,
        options: options.variants || {},
        isSecondHand: product.isSecondHand || false
      });
      
      if (result.success) {
        await loadCart(); // Recharger le panier
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors de l\'ajout au panier');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [loadCart]);

  // Ajouter plusieurs produits en une seule opération
  const addMultipleToCart = useCallback(async (products) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        products.map(product => 
          cartService.addToCart({
            productId: product.id,
            quantity: product.quantity || 1,
            options: product.options || {}
          })
        )
      );
      
      await loadCart(); // Recharger le panier après tous les ajouts
      setLoading(false);
      
      return {
        success: results.every(r => r.success),
        results: results.map((result, index) => ({
          product: products[index],
          success: result.success,
          error: result.error
        }))
      };
    } catch (err) {
      setError('Erreur lors de l\'ajout multiple au panier');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [loadCart]);

  // Mettre à jour la quantité d'un produit
  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return await removeFromCart(productId);
    }
    
    setLoading(true);
    try {
      const result = await cartService.updateQuantity(productId, newQuantity);
      
      if (result.success) {
        setCart(prev => prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors de la mise à jour de la quantité');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Supprimer un produit du panier
  const removeFromCart = useCallback(async (productId) => {
    setLoading(true);
    try {
      const result = await cartService.removeFromCart(productId);
      
      if (result.success) {
        setCart(prev => prev.filter(item => item.productId !== productId));
        setSelectedItems(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(productId);
          return newSelected;
        });
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors de la suppression du produit');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Vider complètement le panier
  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cartService.clearCart();
      
      if (result.success) {
        setCart([]);
        setSelectedItems(new Set());
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors de la vidange du panier');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sélectionner/désélectionner un produit
  const toggleItemSelection = useCallback((productId) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  }, []);

  // Sélectionner tous les produits
  const selectAllItems = useCallback(() => {
    setSelectedItems(new Set(cart.map(item => item.productId)));
  }, [cart]);

  // Désélectionner tous les produits
  const deselectAllItems = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Obtenir les produits sélectionnés
  const getSelectedItems = useCallback(() => {
    return cart.filter(item => selectedItems.has(item.productId));
  }, [cart, selectedItems]);

  // Sauvegarder le panier actuel
  const saveCart = useCallback(async (name, description = '') => {
    setLoading(true);
    try {
      const result = await cartService.saveCart({
        name,
        description,
        items: cart
      });
      
      if (result.success) {
        await loadSavedCarts(); // Recharger la liste des paniers sauvegardés
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors de la sauvegarde du panier');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [cart, loadSavedCarts]);

  // Charger un panier sauvegardé
  const loadSavedCart = useCallback(async (savedCartId) => {
    setLoading(true);
    try {
      const result = await cartService.loadSavedCart(savedCartId);
      
      if (result.success) {
        setCart(result.items);
        setSelectedItems(new Set());
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors du chargement du panier sauvegardé');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Partager le panier
  const shareCart = useCallback(async (email, message = '') => {
    setLoading(true);
    try {
      const result = await cartService.shareCart({
        recipientEmail: email,
        message,
        items: getSelectedItems().length > 0 ? getSelectedItems() : cart
      });
      
      setLoading(false);
      return result;
    } catch (err) {
      setError('Erreur lors du partage du panier');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [cart, getSelectedItems]);

  // Calculer le total du panier
  const calculateTotals = useCallback(() => {
    const itemsToCalculate = getSelectedItems().length > 0 ? getSelectedItems() : cart;
    
    const subtotal = itemsToCalculate.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 50000 ? 0 : 2000; // Livraison gratuite au-dessus de 50,000 XOF
    const tax = subtotal * 0.18; // TVA 18%
    const total = subtotal + shipping + tax;
    
    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount: itemsToCalculate.reduce((sum, item) => sum + item.quantity, 0),
      productCount: itemsToCalculate.length
    };
  }, [cart, getSelectedItems]);

  // Vérifier la disponibilité des produits
  const checkAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const availability = await cartService.checkCartAvailability(cart);
      setLoading(false);
      return availability;
    } catch (err) {
      setError('Erreur lors de la vérification de disponibilité');
      setLoading(false);
      return { available: false, unavailableItems: [] };
    }
  }, [cart]);

  useEffect(() => {
    // Charger le panier et les paniers sauvegardés au montage
    loadCart();
    loadSavedCarts();
  }, [loadCart, loadSavedCarts]);

  return {
    // État
    cart,
    savedCarts,
    selectedItems: Array.from(selectedItems),
    loading,
    error,
    
    // Actions
    addToCart,
    addMultipleToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    getSelectedItems,
    saveCart,
    loadSavedCart,
    shareCart,
    checkAvailability,
    
    // Calculs
    totals: calculateTotals(),
    
    // Utilitaires
    hasItems: cart.length > 0,
    hasSelectedItems: selectedItems.size > 0,
    isAllSelected: selectedItems.size === cart.length && cart.length > 0,
    cartSize: cart.reduce((sum, item) => sum + item.quantity, 0)
  };
};

export default useMultiCart;
