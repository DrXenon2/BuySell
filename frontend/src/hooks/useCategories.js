import { useState, useEffect, useCallback } from 'react';
import { 
  CATEGORIES_CONFIG, 
  getCategoryBySlug, 
  getSubcategoryBySlug,
  getFeaturedCategories,
  getSecondHandCategories,
  searchCategories 
} from '../config/categories';

/**
 * Hook pour la gestion des catégories Buysell
 * Fournit les fonctionnalités de navigation et recherche des catégories
 */

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger toutes les catégories au montage
  useEffect(() => {
    setLoading(true);
    try {
      const allCategories = Object.values(CATEGORIES_CONFIG);
      const featured = getFeaturedCategories();
      
      setCategories(allCategories);
      setFeaturedCategories(featured);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      setLoading(false);
    }
  }, []);

  // Sélectionner une catégorie par slug
  const selectCategory = useCallback((categorySlug) => {
    const category = getCategoryBySlug(categorySlug);
    setSelectedCategory(category);
    setSelectedSubcategory(null); // Reset subcategory when category changes
    return category;
  }, []);

  // Sélectionner une sous-catégorie
  const selectSubcategory = useCallback((categorySlug, subcategorySlug) => {
    const subcategory = getSubcategoryBySlug(categorySlug, subcategorySlug);
    setSelectedSubcategory(subcategory);
    return subcategory;
  }, []);

  // Rechercher dans les catégories
  const searchInCategories = useCallback((query) => {
    if (!query || query.length < 2) return [];
    return searchCategories(query);
  }, []);

  // Obtenir les catégories de seconde main
  const getSecondHand = useCallback(() => {
    return getSecondHandCategories();
  }, []);

  // Obtenir les boutiques officielles
  const getOfficialStores = useCallback(() => {
    return CATEGORIES_CONFIG.OFFICIAL_STORES.subcategories;
  }, []);

  // Obtenir les catégories populaires (avec produits)
  const getPopularCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Simulation d'appel API pour les catégories populaires
      const popularCategories = featuredCategories.map(cat => ({
        ...cat,
        productCount: Math.floor(Math.random() * 1000) + 100,
        trending: Math.random() > 0.5
      }));
      
      setLoading(false);
      return popularCategories;
    } catch (err) {
      setError('Erreur lors du chargement des catégories populaires');
      setLoading(false);
      return [];
    }
  }, [featuredCategories]);

  // Obtenir les statistiques des catégories
  const getCategoryStats = useCallback(async (categorySlug) => {
    setLoading(true);
    try {
      // Simulation d'appel API pour les stats
      const stats = {
        totalProducts: Math.floor(Math.random() * 5000) + 1000,
        activeSellers: Math.floor(Math.random() * 500) + 50,
        averageRating: (Math.random() * 2 + 3).toFixed(1),
        monthlySales: Math.floor(Math.random() * 10000) + 1000
      };
      
      setLoading(false);
      return stats;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      setLoading(false);
      return null;
    }
  }, []);

  // Réinitialiser la sélection
  const resetSelection = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  }, []);

  return {
    // État
    categories,
    featuredCategories,
    selectedCategory,
    selectedSubcategory,
    loading,
    error,
    
    // Actions
    selectCategory,
    selectSubcategory,
    searchInCategories,
    getSecondHand,
    getOfficialStores,
    getPopularCategories,
    getCategoryStats,
    resetSelection,
    
    // Utilitaires
    hasSelectedCategory: !!selectedCategory,
    hasSelectedSubcategory: !!selectedSubcategory
  };
};

/**
 * Hook pour la gestion d'une catégorie spécifique
 */
export const useCategory = (categorySlug) => {
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categorySlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const categoryData = getCategoryBySlug(categorySlug);
      
      if (categoryData) {
        setCategory(categoryData);
        setSubcategories(categoryData.subcategories || []);
      } else {
        setError('Catégorie non trouvée');
      }
      
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement de la catégorie');
      setLoading(false);
    }
  }, [categorySlug]);

  return {
    category,
    subcategories,
    loading,
    error,
    exists: !!category
  };
};

export default useCategories;
