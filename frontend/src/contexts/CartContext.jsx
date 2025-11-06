'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Types d'actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART: 'SET_CART',
  LOAD_CART: 'LOAD_CART',
  SET_LOADING: 'SET_LOADING',
  SYNC_CART: 'SYNC_CART'
};

// Reducer pour gérer l'état du panier
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload || [],
        isLoading: false
      };

    case CART_ACTIONS.ADD_ITEM:
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && 
        JSON.stringify(item.options) === JSON.stringify(action.payload.options)
      );

      if (existingItemIndex >= 0) {
        // Item existe déjà, mettre à jour la quantité
        const updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { 
                ...item, 
                quantity: Math.min(item.quantity + action.payload.quantity, item.maxQuantity)
              }
            : item
        );
        return { ...state, items: updatedItems };
      } else {
        // Nouvel item
        return { ...state, items: [...state.items, action.payload] };
      }

    case CART_ACTIONS.UPDATE_QUANTITY:
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id)
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(action.payload.quantity, item.maxQuantity) }
            : item
        )
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case CART_ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    case CART_ACTIONS.SET_CART:
      return { ...state, items: action.payload };

    case CART_ACTIONS.SYNC_CART:
      return {
        ...state,
        items: action.payload,
        isLoading: false
      };

    default:
      return state;
  }
}

// Hook personnalisé pour utiliser le contexte
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Provider du contexte
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isLoading: true
  });

  const { notify } = useNotification();
  const { user, isAuthenticated } = useAuth();

  // Charger le panier au montage
  useEffect(() => {
    const loadCart = async () => {
      try {
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

        if (isAuthenticated && user) {
          // Si l'utilisateur est connecté, charger depuis l'API
          await syncCartWithServer();
        } else {
          // Sinon, charger depuis le localStorage
          const savedCart = localStorage.getItem('buy-sell-cart');
          if (savedCart) {
            const cartData = JSON.parse(savedCart);
            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
          } else {
            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: [] });
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback au localStorage en cas d'erreur
        const savedCart = localStorage.getItem('buy-sell-cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
        } else {
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: [] });
        }
      }
    };

    loadCart();
  }, [isAuthenticated, user]);

  // Sauvegarder le panier dans le localStorage à chaque changement
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('buy-sell-cart', JSON.stringify(state.items));
    }
  }, [state.items, state.isLoading]);

  // Synchroniser le panier avec le serveur quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated && user && !state.isLoading) {
      syncCartWithServer();
    }
  }, [isAuthenticated, user]);

  // Calculer les totaux
  const total = state.items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);

  // Synchroniser avec le serveur
  const syncCartWithServer = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth-token');
      
      // Récupérer le panier du serveur
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Fusionner les paniers (serveur + local)
          const serverItems = data.data.items || [];
          const localItems = JSON.parse(localStorage.getItem('buy-sell-cart') || '[]');
          
          // Fusion simple - priorité au serveur
          const mergedItems = [...serverItems];
          
          // Ajouter les items locaux qui n'existent pas sur le serveur
          localItems.forEach(localItem => {
            const exists = mergedItems.some(serverItem => 
              serverItem.id === localItem.id
            );
            if (!exists) {
              mergedItems.push(localItem);
            }
          });

          dispatch({ type: CART_ACTIONS.SYNC_CART, payload: mergedItems });
          
          // Sauvegarder le panier fusionné sur le serveur
          await saveCartToServer(mergedItems);
        }
      }
    } catch (error) {
      console.error('Error syncing cart with server:', error);
    }
  };

  // Sauvegarder le panier sur le serveur
  const saveCartToServer = async (items) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth-token');
      
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
    } catch (error) {
      console.error('Error saving cart to server:', error);
    }
  };

  // Actions
  const addItem = async (product, quantity = 1, options = {}) => {
    try {
      const cartItem = {
        id: `${product.id}-${JSON.stringify(options)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        image: product.images?.[0] || '/images/placeholder.jpg',
        quantity,
        options,
        stockQuantity: product.stockQuantity,
        slug: product.slug,
        sellerId: product.sellerId,
        maxQuantity: Math.min(product.stockQuantity, 10)
      };

      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: cartItem });

      // Sauvegarder sur le serveur si connecté
      if (isAuthenticated) {
        await saveCartToServer(state.items);
      }

      // Notification de succès
      notify.success(
        'Ajouté au panier',
        `${quantity} × ${product.name} a été ajouté à votre panier`,
        {
          duration: 3000,
          action: {
            label: 'Voir le panier',
            onClick: () => {
              window.location.href = '/cart';
            }
          }
        }
      );

      return { success: true };
    } catch (error) {
      notify.error('Erreur', 'Impossible d\'ajouter le produit au panier');
      return { success: false, error: error.message };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (quantity < 0) return;

      const item = state.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Article non trouvé');
      }

      if (quantity > item.maxQuantity) {
        notify.warning(
          'Quantité maximale',
          `Vous ne pouvez pas commander plus de ${item.maxQuantity} unités de ce produit`
        );
        return;
      }

      dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id: itemId, quantity } });

      // Sauvegarder sur le serveur si connecté
      if (isAuthenticated) {
        await saveCartToServer(state.items);
      }

      if (quantity === 0) {
        notify.info('Article supprimé', `${item.name} a été retiré du panier`);
      }

      return { success: true };
    } catch (error) {
      notify.error('Erreur', 'Impossible de mettre à jour la quantité');
      return { success: false, error: error.message };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const item = state.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Article non trouvé');
      }

      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });

      // Sauvegarder sur le serveur si connecté
      if (isAuthenticated) {
        await saveCartToServer(state.items);
      }

      notify.info(
        'Article supprimé',
        `${item.name} a été retiré de votre panier`,
        { duration: 3000 }
      );

      return { success: true };
    } catch (error) {
      notify.error('Erreur', 'Impossible de supprimer l\'article');
      return { success: false, error: error.message };
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.CLEAR_CART });

      // Sauvegarder sur le serveur si connecté
      if (isAuthenticated) {
        await saveCartToServer([]);
      }

      notify.info('Panier vidé', 'Tous les articles ont été retirés de votre panier');
      return { success: true };
    } catch (error) {
      notify.error('Erreur', 'Impossible de vider le panier');
      return { success: false, error: error.message };
    }
  };

  const getItemQuantity = (productId, options = {}) => {
    const itemId = `${productId}-${JSON.stringify(options)}`;
    const item = state.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const value = {
    // State
    items: state.items,
    total,
    itemCount,
    isLoading: state.isLoading,

    // Actions
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    syncCartWithServer
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
