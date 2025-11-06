'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const AppContext = createContext();

// Types d'actions
const APP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_MODAL: 'SET_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_SIDEBAR: 'SET_SIDEBAR',
  SET_PAGE_TITLE: 'SET_PAGE_TITLE',
  SET_BREADCRUMBS: 'SET_BREADCRUMBS',
  SET_APP_STATE: 'SET_APP_STATE',
  SET_FILTERS: 'SET_FILTERS'
};

// État initial
const initialState = {
  // État de chargement global
  isLoading: false,
  loadingMessage: '',
  
  // Gestion des modals
  modal: {
    isOpen: false,
    type: null,
    data: null,
    size: 'md' // sm, md, lg, xl
  },
  
  // Navigation et sidebar
  sidebar: {
    isOpen: false,
    type: 'main' // main, cart, filters, etc.
  },
  
  // Métadonnées de page
  pageTitle: '',
  breadcrumbs: [],
  
  // État global de l'application
  appState: {
    isOnline: true,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    language: 'fr',
    currency: 'EUR',
    theme: 'light'
  },
  
  // Filtres globaux
  filters: {
    category: null,
    priceRange: { min: 0, max: 10000 },
    sortBy: 'created_at',
    sortOrder: 'desc',
    searchQuery: '',
    tags: []
  },
  
  // Données globales (cache)
  globalData: {
    categories: [],
    featuredProducts: [],
    popularSellers: []
  }
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingMessage: action.payload.message || ''
      };

    case APP_ACTIONS.SET_MODAL:
      return {
        ...state,
        modal: {
          isOpen: true,
          type: action.payload.type,
          data: action.payload.data,
          size: action.payload.size || 'md'
        }
      };

    case APP_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modal: {
          isOpen: false,
          type: null,
          data: null,
          size: 'md'
        }
      };

    case APP_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebar: {
          isOpen: action.payload.isOpen,
          type: action.payload.type || 'main'
        }
      };

    case APP_ACTIONS.SET_PAGE_TITLE:
      return {
        ...state,
        pageTitle: action.payload
      };

    case APP_ACTIONS.SET_BREADCRUMBS:
      return {
        ...state,
        breadcrumbs: action.payload
      };

    case APP_ACTIONS.SET_APP_STATE:
      return {
        ...state,
        appState: {
          ...state.appState,
          ...action.payload
        }
      };

    case APP_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { notify } = useNotification();

  // Détection de la connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: APP_ACTIONS.SET_APP_STATE,
        payload: { isOnline: true }
      });
      notify.success('Connexion rétablie', 'Vous êtes de nouveau en ligne');
    };

    const handleOffline = () => {
      dispatch({
        type: APP_ACTIONS.SET_APP_STATE,
        payload: { isOnline: false }
      });
      notify.warning('Hors ligne', 'Votre connexion semble interrompue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notify]);

  // Détection du type d'appareil
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      dispatch({
        type: APP_ACTIONS.SET_APP_STATE,
        payload: { isMobile, isTablet, isDesktop }
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Charger les données globales au démarrage
  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      dispatch({
        type: APP_ACTIONS.SET_LOADING,
        payload: { isLoading: true, message: 'Chargement des données...' }
      });

      // Charger les catégories
      const categoriesResponse = await fetch('/api/categories?limit=50');
      const categoriesData = await categoriesResponse.json();
      
      if (categoriesData.success) {
        dispatch({
          type: APP_ACTIONS.SET_APP_STATE,
          payload: { 
            globalData: {
              ...state.appState.globalData,
              categories: categoriesData.data.categories
            }
          }
        });
      }

      // Charger les produits populaires
      const productsResponse = await fetch('/api/products?featured=true&limit=8');
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        dispatch({
          type: APP_ACTIONS.SET_APP_STATE,
          payload: { 
            globalData: {
              ...state.appState.globalData,
              featuredProducts: productsData.data.products
            }
          }
        });
      }

    } catch (error) {
      console.error('Error loading global data:', error);
    } finally {
      dispatch({
        type: APP_ACTIONS.SET_LOADING,
        payload: { isLoading: false }
      });
    }
  };

  // Actions
  const setLoading = (isLoading, message = '') => {
    dispatch({
      type: APP_ACTIONS.SET_LOADING,
      payload: { isLoading, message }
    });
  };

  const openModal = (type, data = null, size = 'md') => {
    dispatch({
      type: APP_ACTIONS.SET_MODAL,
      payload: { type, data, size }
    });
  };

  const closeModal = () => {
    dispatch({ type: APP_ACTIONS.CLOSE_MODAL });
  };

  const toggleSidebar = (type = 'main') => {
    dispatch({
      type: APP_ACTIONS.SET_SIDEBAR,
      payload: { 
        isOpen: !state.sidebar.isOpen || state.sidebar.type !== type,
        type 
      }
    });
  };

  const closeSidebar = () => {
    dispatch({
      type: APP_ACTIONS.SET_SIDEBAR,
      payload: { isOpen: false, type: 'main' }
    });
  };

  const setPageTitle = (title) => {
    dispatch({ type: APP_ACTIONS.SET_PAGE_TITLE, payload: title });
    document.title = `${title} | BuySell Platform`;
  };

  const setBreadcrumbs = (breadcrumbs) => {
    dispatch({ type: APP_ACTIONS.SET_BREADCRUMBS, payload: breadcrumbs });
  };

  const updateAppState = (updates) => {
    dispatch({ type: APP_ACTIONS.SET_APP_STATE, payload: updates });
  };

  const updateFilters = (filters) => {
    dispatch({ type: APP_ACTIONS.SET_FILTERS, payload: filters });
  };

  const resetFilters = () => {
    dispatch({ 
      type: APP_ACTIONS.SET_FILTERS, 
      payload: initialState.filters 
    });
  };

  // Méthodes utilitaires
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: state.appState.currency
    }).format(price);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const value = {
    // State
    ...state,

    // Actions
    setLoading,
    openModal,
    closeModal,
    toggleSidebar,
    closeSidebar,
    setPageTitle,
    setBreadcrumbs,
    updateAppState,
    updateFilters,
    resetFilters,

    // Méthodes utilitaires
    formatPrice,
    formatDate,
    truncateText,

    // Getters
    isMobile: state.appState.isMobile,
    isTablet: state.appState.isTablet,
    isDesktop: state.appState.isDesktop,
    isOnline: state.appState.isOnline
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <GlobalModal />
      <GlobalSidebar />
    </AppContext.Provider>
  );
}

// Composant Modal Global
function GlobalModal() {
  const { modal, closeModal } = useApp();

  if (!modal.isOpen) return null;

  const modalSizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4 text-center">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closeModal}
        />
        
        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl transform transition-all w-full ${modalSizes[modal.size]}`}>
          {/* Contenu du modal sera injecté ici */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modal.type}
            </h3>
            <p>Modal content for {modal.type}</p>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Sidebar Global
function GlobalSidebar() {
  const { sidebar, closeSidebar } = useApp();

  if (!sidebar.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeSidebar}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {sidebar.type === 'cart' && 'Mon Panier'}
            {sidebar.type === 'filters' && 'Filtres'}
            {sidebar.type === 'main' && 'Menu'}
          </h3>
          <button
            onClick={closeSidebar}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {/* Contenu du sidebar selon le type */}
          {sidebar.type === 'cart' && <CartSidebarContent />}
          {sidebar.type === 'filters' && <FiltersSidebarContent />}
          {sidebar.type === 'main' && <MainSidebarContent />}
        </div>
      </div>
    </>
  );
}

// Composants de contenu des sidebars
function CartSidebarContent() {
  const { closeSidebar } = useApp();
  return (
    <div>
      <p>Contenu du panier</p>
      <button
        onClick={closeSidebar}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md"
      >
        Voir le panier complet
      </button>
    </div>
  );
}

function FiltersSidebarContent() {
  return <div>Filtres de recherche</div>;
}

function MainSidebarContent() {
  return <div>Navigation principale</div>;
}
