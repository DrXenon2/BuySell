import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * Hook spécialisé pour la gestion des produits de seconde main (Djassa)
 * Fournit des fonctionnalités spécifiques aux articles d'occasion
 */

export const useSecondHand = () => {
  const [secondHandProducts, setSecondHandProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    priceRange: { min: 0, max: 1000000 },
    location: '',
    sellerRating: 0
  });
  const [sortBy, setSortBy] = useState('newest');

  // États pour les conditions des produits
  const CONDITIONS = {
    EXCELLENT: { value: 'excellent', label: 'Excellent état', discount: 0.1 },
    VERY_GOOD: { value: 'very_good', label: 'Très bon état', discount: 0.2 },
    GOOD: { value: 'good', label: 'Bon état', discount: 0.3 },
    FAIR: { value: 'fair', label: 'État correct', discount: 0.4 },
    POOR: { value: 'poor', label: 'État moyen', discount: 0.5 }
  };

  // Charger les produits de seconde main
  const loadSecondHandProducts = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const products = await productService.getSecondHandProducts({
        page: options.page || 1,
        limit: options.limit || 20,
        filters: options.filters || filters,
        sortBy: options.sortBy || sortBy
      });
      
      setSecondHandProducts(products);
      setFilteredProducts(products);
      setLoading(false);
      return products;
    } catch (err) {
      setError('Erreur lors du chargement des produits de seconde main');
      setLoading(false);
      return [];
    }
  }, [filters, sortBy]);

  // Appliquer les filtres
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Rechercher dans les produits de seconde main
  const searchSecondHand = useCallback(async (query, searchFilters = {}) => {
    setLoading(true);
    try {
      const results = await productService.searchSecondHandProducts(query, {
        ...filters,
        ...searchFilters
      });
      
      setFilteredProducts(results);
      setLoading(false);
      return results;
    } catch (err) {
      setError('Erreur lors de la recherche');
      setLoading(false);
      return [];
    }
  }, [filters]);

  // Obtenir les produits similaires
  const getSimilarProducts = useCallback(async (productId, limit = 8) => {
    try {
      const similar = await productService.getSimilarSecondHandProducts(productId, limit);
      return similar;
    } catch (err) {
      console.error('Erreur lors du chargement des produits similaires:', err);
      return [];
    }
  }, []);

  // Obtenir les produits tendance de seconde main
  const getTrendingSecondHand = useCallback(async (limit = 10) => {
    setLoading(true);
    try {
      const trending = await productService.getTrendingSecondHand(limit);
      setLoading(false);
      return trending;
    } catch (err) {
      setError('Erreur lors du chargement des produits tendance');
      setLoading(false);
      return [];
    }
  }, []);

  // Calculer le prix recommandé pour un produit de seconde main
  const calculateSecondHandPrice = useCallback((originalPrice, condition, ageInMonths = 0) => {
    const conditionDiscount = CONDITIONS[condition]?.discount || 0.3;
    const ageDiscount = Math.min(ageInMonths * 0.02, 0.5); // Max 50% de réduction pour l'âge
    
    const totalDiscount = conditionDiscount + ageDiscount;
    const recommendedPrice = originalPrice * (1 - totalDiscount);
    
    return Math.max(recommendedPrice, originalPrice * 0.1); // Minimum 10% du prix original
  }, []);

  // Vérifier l'éligibilité pour la vente en seconde main
  const checkSellEligibility = useCallback((productDetails) => {
    const { category, ageInMonths, condition, originalPrice } = productDetails;
    
    const eligibility = {
      eligible: true,
      reasons: [],
      recommendations: []
    };

    // Vérifications d'éligibilité
    if (ageInMonths > 60) { // 5 ans maximum
      eligibility.eligible = false;
      eligibility.reasons.push('Produit trop ancien');
    }

    if (condition === 'poor' && originalPrice < 5000) {
      eligibility.eligible = false;
      eligibility.reasons.push('Produit en trop mauvais état pour la revente');
    }

    if (originalPrice < 1000) {
      eligibility.recommendations.push('Le prix de vente pourrait être trop bas pour être intéressant');
    }

    if (eligibility.eligible) {
      eligibility.recommendedPrice = calculateSecondHandPrice(originalPrice, condition, ageInMonths);
    }

    return eligibility;
  }, [calculateSecondHandPrice]);

  // Obtenir les statistiques de vente seconde main
  const getSecondHandStats = useCallback(async () => {
    setLoading(true);
    try {
      // Simulation d'appel API pour les stats
      const stats = {
        totalListings: Math.floor(Math.random() * 50000) + 10000,
        averagePrice: Math.floor(Math.random() * 50000) + 5000,
        successRate: (Math.random() * 20 + 70).toFixed(1), // 70-90%
        popularCategories: ['Vêtements', 'Électronique', 'Maison'],
        trendingItems: ['Smartphones', 'Chaussures', 'Meubles']
      };
      
      setLoading(false);
      return stats;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      setLoading(false);
      return null;
    }
  }, []);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      category: '',
      condition: '',
      priceRange: { min: 0, max: 1000000 },
      location: '',
      sellerRating: 0
    });
  }, []);

  return {
    // État
    secondHandProducts,
    filteredProducts,
    loading,
    error,
    filters,
    sortBy,
    conditions: CONDITIONS,
    
    // Actions
    loadSecondHandProducts,
    applyFilters,
    searchSecondHand,
    getSimilarProducts,
    getTrendingSecondHand,
    calculateSecondHandPrice,
    checkSellEligibility,
    getSecondHandStats,
    resetFilters,
    setSortBy,
    
    // Utilitaires
    hasProducts: secondHandProducts.length > 0,
    hasFilters: Object.values(filters).some(filter => 
      filter !== '' && 
      filter !== 0 && 
      (!priceRange || (priceRange.min > 0 || priceRange.max < 1000000))
    )
  };
};

/**
 * Hook pour la gestion d'un produit de seconde main spécifique
 */
export const useSecondHandProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = useCallback(async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const productData = await productService.getSecondHandProduct(id);
      setProduct(productData);
      setLoading(false);
    } catch (err) {
      setError('Produit non trouvé');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId, loadProduct]);

  return {
    product,
    loading,
    error,
    reload: () => loadProduct(productId)
  };
};

export default useSecondHand;
