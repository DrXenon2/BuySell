'use client';

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const SearchContext = createContext();

// Types d'actions
const SEARCH_ACTIONS = {
  SET_QUERY: 'SET_QUERY',
  SET_RESULTS: 'SET_RESULTS',
  SET_LOADING: 'SET_LOADING',
  SET_FILTERS: 'SET_FILTERS',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
  SET_SEARCH_TYPE: 'SET_SEARCH_TYPE',
  SET_PAGINATION: 'SET_PAGINATION'
};

// État initial
const initialState = {
  // Recherche actuelle
  query: '',
  searchType: 'products', // products, sellers, categories
  results: [],
  suggestions: [],
  
  // État de chargement
  isLoading: false,
  isSearching: false,
  
  // Filtres de recherche
  filters: {
    category: null,
    priceRange: { min: 0, max: 10000 },
    sortBy: 'relevance',
    sortOrder: 'desc',
    inStock: false,
    onSale: false,
    rating: null,
    tags: []
  },
  
  // Pagination
  pagination: {
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0
  },
  
  // Historique et tendances
  searchHistory: [],
  popularSearches: [],
  
  // Métadonnées
  lastSearch: null,
  hasSearched: false
};

// Reducer
function searchReducer(state, action) {
  switch (action.type) {
    case SEARCH_ACTIONS.SET_QUERY:
      return {
        ...state,
        query: action.payload,
        hasSearched: action.payload.length > 0
      };

    case SEARCH_ACTIONS.SET_RESULTS:
      return {
        ...state,
        results: action.payload.results,
        pagination: {
          ...state.pagination,
          ...action.payload.pagination
        },
        isLoading: false,
        isSearching: false,
        lastSearch: new Date().toISOString()
      };

    case SEARCH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        isSearching: action.payload.isSearching || false
      };

    case SEARCH_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case SEARCH_ACTIONS.SET_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.payload
      };

    case SEARCH_ACTIONS.CLEAR_SEARCH:
      return {
        ...initialState,
        searchHistory: state.searchHistory,
        popularSearches: state.popularSearches
      };

    case SEARCH_ACTIONS.SET_SEARCH_TYPE:
      return {
        ...state,
        searchType: action.payload,
        results: [],
        pagination: { ...initialState.pagination }
      };

    case SEARCH_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload
        }
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Provider
export function SearchProvider({ children }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { notify } = useNotification();

  // Charger l'historique et les recherches populaires au démarrage
  useEffect(() => {
    loadSearchHistory();
    loadPopularSearches();
  }, []);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('search-history');
      if (history) {
        dispatch({
          type: SEARCH_ACTIONS.SET_LOADING,
          payload: { searchHistory: JSON.parse(history) }
        });
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadPopularSearches = async () => {
    try {
      const response = await fetch('/api/search/popular');
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: SEARCH_ACTIONS.SET_LOADING,
          payload: { popularSearches: data.data.searches }
        });
      }
    } catch (error) {
      console.error('Error loading popular searches:', error);
    }
  };

  // Sauvegarder l'historique de recherche
  const saveToHistory = useCallback((query) => {
    if (!query.trim()) return;

    const newHistory = [
      query,
      ...state.searchHistory.filter(item => item !== query)
    ].slice(0, 10); // Garder seulement les 10 dernières recherches

    localStorage.setItem('search-history', JSON.stringify(newHistory));
    dispatch({
      type: SEARCH_ACTIONS.SET_LOADING,
      payload: { searchHistory: newHistory }
    });
  }, [state.searchHistory]);

  // Recherche principale
  const search = useCallback(async (query = state.query, filters = state.filters, page = 1) => {
    if (!query.trim()) {
      dispatch({ type: SEARCH_ACTIONS.CLEAR_SEARCH });
      return;
    }

    try {
      dispatch({
        type: SEARCH_ACTIONS.SET_LOADING,
        payload: { isLoading: true, isSearching: true }
      });

      // Construire les paramètres de recherche
      const searchParams = new URLSearchParams({
        q: query,
        type: state.searchType,
        page: page.toString(),
        limit: state.pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.category && { category: filters.category }),
        ...(filters.priceRange && { 
          minPrice: filters.priceRange.min.toString(),
          maxPrice: filters.priceRange.max.toString()
        }),
        ...(filters.inStock && { inStock: 'true' }),
        ...(filters.onSale && { onSale: 'true' }),
        ...(filters.rating && { rating: filters.rating.toString() }),
        ...(filters.tags.length > 0 && { tags: filters.tags.join(',') })
      });

      const response = await fetch(`/api/search?${searchParams}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      dispatch({
        type: SEARCH_ACTIONS.SET_RESULTS,
        payload: {
          results: data.data.results,
          pagination: data.data.pagination
        }
      });

      // Sauvegarder dans l'historique
      saveToHistory(query);

    } catch (error) {
      console.error('Search error:', error);
      notify.error('Erreur de recherche', error.message);
      dispatch({
        type: SEARCH_ACTIONS.SET_LOADING,
        payload: { isLoading: false, isSearching: false }
      });
    }
  }, [state.query, state.searchType, state.filters, state.pagination.limit, saveToHistory, notify]);

  // Recherche en temps réel (suggestions)
  const searchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      dispatch({ type: SEARCH_ACTIONS.SET_SUGGESTIONS, payload: [] });
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        dispatch({
          type: SEARCH_ACTIONS.SET_SUGGESTIONS,
          payload: data.data.suggestions
        });
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  }, []);

  // Actions
  const setQuery = (query) => {
    dispatch({ type: SEARCH_ACTIONS.SET_QUERY, payload: query });
    
    // Rechercher les suggestions en temps réel
    if (query.length >= 2) {
      searchSuggestions(query);
    } else {
      dispatch({ type: SEARCH_ACTIONS.SET_SUGGESTIONS, payload: [] });
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: SEARCH_ACTIONS.SET_FILTERS, payload: filters });
  };

  const setSearchType = (type) => {
    dispatch({ type: SEARCH_ACTIONS.SET_SEARCH_TYPE, payload: type });
  };

  const setPage = (page) => {
    dispatch({ 
      type: SEARCH_ACTIONS.SET_PAGINATION, 
      payload: { page } 
    });
    search(state.query, state.filters, page);
  };

  const clearSearch = () => {
    dispatch({ type: SEARCH_ACTIONS.CLEAR_SEARCH });
  };

  const clearHistory = () => {
    localStorage.removeItem('search-history');
    dispatch({
      type: SEARCH_ACTIONS.SET_LOADING,
      payload: { searchHistory: [] }
    });
  };

  // Recherche rapide (avec debounce)
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (query, filters, page = 1) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          search(query, filters, page);
        }, 500); // Debounce de 500ms
      };
    })(),
    [search]
  );

  const value = {
    // State
    ...state,

    // Actions
    search,
    debouncedSearch,
    setQuery,
    setFilters,
    setSearchType,
    setPage,
    clearSearch,
    clearHistory,
    searchSuggestions,

    // Getters
    hasResults: state.results.length > 0,
    totalResults: state.pagination.total,
    currentPage: state.pagination.page,
    totalPages: state.pagination.totalPages,
    canGoNext: state.pagination.page < state.pagination.totalPages,
    canGoPrev: state.pagination.page > 1
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}
