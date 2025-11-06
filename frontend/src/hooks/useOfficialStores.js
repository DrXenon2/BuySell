import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * Hook spécialisé pour la gestion des boutiques officielles
 * Fournit des fonctionnalités spécifiques aux marques officielles et produits neufs
 */

export const useOfficialStores = () => {
  const [officialStores, setOfficialStores] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [storeProducts, setStoreProducts] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Catégories de boutiques officielles
  const STORE_CATEGORIES = {
    ELECTRONICS: 'electronics',
    FASHION: 'fashion',
    HOME: 'home',
    BEAUTY: 'beauty',
    SPORTS: 'sports',
    AUTOMOTIVE: 'automotive',
    OTHER: 'other'
  };

  // Charger toutes les boutiques officielles
  const loadOfficialStores = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const stores = await productService.getOfficialStores({
        category: options.category,
        featured: options.featured,
        limit: options.limit
      });
      
      setOfficialStores(stores);
      
      // Séparer les boutiques featured
      const featured = stores.filter(store => store.featured);
      setFeaturedStores(featured);
      
      setLoading(false);
      return stores;
    } catch (err) {
      setError('Erreur lors du chargement des boutiques officielles');
      setLoading(false);
      return [];
    }
  }, []);

  // Charger les produits d'une boutique spécifique
  const loadStoreProducts = useCallback(async (storeId, page = 1, filters = {}) => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const products = await productService.getStoreProducts(storeId, {
        page,
        limit: 20,
        ...filters
      });
      
      // Mettre à jour le cache des produits par boutique
      setStoreProducts(prev => {
        const newMap = new Map(prev);
        newMap.set(storeId, {
          products,
          page,
          hasMore: products.length === 20 // Suppose qu'il y a plus si on a le nombre maximum
        });
        return newMap;
      });
      
      setCurrentPage(page);
      setLoading(false);
      return products;
    } catch (err) {
      setError('Erreur lors du chargement des produits de la boutique');
      setLoading(false);
      return [];
    }
  }, []);

  // Sélectionner une boutique
  const selectStore = useCallback(async (storeId) => {
    const store = officialStores.find(s => s.id === storeId);
    if (store) {
      setSelectedStore(store);
      await loadStoreProducts(storeId, 1);
    }
  }, [officialStores, loadStoreProducts]);

  // Rechercher des boutiques officielles
  const searchStores = useCallback(async (query, filters = {}) => {
    setLoading(true);
    try {
      const results = await productService.searchOfficialStores(query, filters);
      setLoading(false);
      return results;
    } catch (err) {
      setError('Erreur lors de la recherche de boutiques');
      setLoading(false);
      return [];
    }
  }, []);

  // Obtenir les boutiques par catégorie
  const getStoresByCategory = useCallback((category) => {
    return officialStores.filter(store => 
      store.categories?.includes(category)
    );
  }, [officialStores]);

  // Obtenir les nouvelles boutiques
  const getNewStores = useCallback(async (limit = 10) => {
    setLoading(true);
    try {
      const newStores = await productService.getNewStores(limit);
      setLoading(false);
      return newStores;
    } catch (err) {
      setError('Erreur lors du chargement des nouvelles boutiques');
      setLoading(false);
      return [];
    }
  }, []);

  // Obtenir les boutiques tendance
  const getTrendingStores = useCallback(async (limit = 8) => {
    setLoading(true);
    try {
      const trending = await productService.getTrendingStores(limit);
      setLoading(false);
      return trending;
    } catch (err) {
      setError('Erreur lors du chargement des boutiques tendance');
      setLoading(false);
      return [];
    }
  }, []);

  // Vérifier les promotions d'une boutique
  const getStorePromotions = useCallback(async (storeId) => {
    if (!storeId) return [];
    
    try {
      const promotions = await productService.getStorePromotions(storeId);
      return promotions;
    } catch (err) {
      console.error('Erreur lors du chargement des promotions:', err);
      return [];
    }
  }, []);

  // S'abonner aux notifications d'une boutique
  const subscribeToStore = useCallback(async (storeId) => {
    try {
      const result = await productService.subscribeToStore(storeId);
      return result;
    } catch (err) {
      return { success: false, error: 'Erreur lors de l\'abonnement' };
    }
  }, []);

  // Se désabonner d'une boutique
  const unsubscribeFromStore = useCallback(async (storeId) => {
    try {
      const result = await productService.unsubscribeFromStore(storeId);
      return result;
    } catch (err) {
      return { success: false, error: 'Erreur lors du désabonnement' };
    }
  }, []);

  // Obtenir les statistiques des boutiques
  const getStoreStats = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await productService.getOfficialStoresStats();
      setLoading(false);
      return stats;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      setLoading(false);
      return null;
    }
  }, []);

  // Vérifier l'authenticité d'un produit de boutique officielle
  const verifyProductAuthenticity = useCallback(async (productId) => {
    try {
      const verification = await productService.verifyProductAuthenticity(productId);
      return verification;
    } catch (err) {
      return { authentic: false, reason: 'Erreur de vérification' };
    }
  }, []);

  // Obtenir la garantie d'un produit
  const getProductWarranty = useCallback(async (productId) => {
    try {
      const warranty = await productService.getProductWarranty(productId);
      return warranty;
    } catch (err) {
      return { hasWarranty: false, duration: '0 mois' };
    }
  }, []);

  // Charger plus de produits pour la boutique sélectionnée
  const loadMoreProducts = useCallback(async () => {
    if (!selectedStore) return;
    
    const nextPage = currentPage + 1;
    await loadStoreProducts(selectedStore.id, nextPage);
  }, [selectedStore, currentPage, loadStoreProducts]);

  // Réinitialiser la sélection
  const resetSelection = useCallback(() => {
    setSelectedStore(null);
    setCurrentPage(1);
  }, []);

  // Obtenir les produits de la boutique sélectionnée
  const getCurrentStoreProducts = useCallback(() => {
    if (!selectedStore) return [];
    return storeProducts.get(selectedStore.id)?.products || [];
  }, [selectedStore, storeProducts]);

  // Vérifier s'il y a plus de produits à charger
  const hasMoreProducts = useCallback(() => {
    if (!selectedStore) return false;
    return storeProducts.get(selectedStore.id)?.hasMore || false;
  }, [selectedStore, storeProducts]);

  useEffect(() => {
    // Charger les boutiques officielles au montage
    loadOfficialStores({ featured: true, limit: 50 });
  }, [loadOfficialStores]);

  return {
    // État
    officialStores,
    featuredStores,
    storeProducts: getCurrentStoreProducts(),
    selectedStore,
    loading,
    error,
    currentPage,
    
    // Catégories
    storeCategories: STORE_CATEGORIES,
    
    // Actions
    loadOfficialStores,
    loadStoreProducts,
    selectStore,
    searchStores,
    getStoresByCategory,
    getNewStores,
    getTrendingStores,
    getStorePromotions,
    subscribeToStore,
    unsubscribeFromStore,
    getStoreStats,
    verifyProductAuthenticity,
    getProductWarranty,
    loadMoreProducts,
    resetSelection,
    
    // Utilitaires
    hasStores: officialStores.length > 0,
    hasFeaturedStores: featuredStores.length > 0,
    hasSelectedStore: !!selectedStore,
    hasMoreProducts: hasMoreProducts(),
    totalStores: officialStores.length
  };
};

/**
 * Hook pour la gestion d'une boutique officielle spécifique
 */
export const useOfficialStore = (storeId) => {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStore = useCallback(async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [storeData, storeProducts] = await Promise.all([
        productService.getOfficialStore(id),
        productService.getStoreProducts(id, { page: 1, limit: 20 })
      ]);
      
      setStore(storeData);
      setProducts(storeProducts);
      setLoading(false);
    } catch (err) {
      setError('Boutique non trouvée');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      loadStore(storeId);
    }
  }, [storeId, loadStore]);

  return {
    store,
    products,
    loading,
    error,
    reload: () => loadStore(storeId)
  };
};

export default useOfficialStores;
