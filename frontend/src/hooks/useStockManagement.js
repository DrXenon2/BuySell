import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '../services/productService';

/**
 * Hook pour la gestion en temps réel des stocks
 * Surveillance des quantités, alertes de rupture, mise à jour automatique
 */

export const useStockManagement = () => {
  const [stockData, setStockData] = useState(new Map());
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsConnection = useRef(null);

  // Seuils pour les alertes de stock
  const STOCK_THRESHOLDS = {
    LOW_STOCK: 10,
    CRITICAL_STOCK: 3,
    OUT_OF_STOCK: 0
  };

  // Charger les données de stock initiales
  const loadStockData = useCallback(async (productIds = []) => {
    setLoading(true);
    try {
      const stockInfo = await productService.getStockInfo(productIds);
      
      const stockMap = new Map();
      const lowStock = [];
      const outOfStock = [];
      
      stockInfo.forEach(item => {
        stockMap.set(item.productId, item);
        
        if (item.quantity <= STOCK_THRESHOLDS.OUT_OF_STOCK) {
          outOfStock.push(item);
        } else if (item.quantity <= STOCK_THRESHOLDS.LOW_STOCK) {
          lowStock.push(item);
        }
      });
      
      setStockData(stockMap);
      setLowStockAlerts(lowStock);
      setOutOfStockItems(outOfStock);
      setLoading(false);
      
      return stockInfo;
    } catch (err) {
      setError('Erreur lors du chargement des données de stock');
      setLoading(false);
      return [];
    }
  }, []);

  // Obtenir le stock d'un produit spécifique
  const getProductStock = useCallback((productId) => {
    return stockData.get(productId) || { quantity: 0, reserved: 0, available: 0 };
  }, [stockData]);

  // Vérifier la disponibilité d'un produit
  const checkAvailability = useCallback((productId, quantity = 1) => {
    const stock = getProductStock(productId);
    const available = stock.quantity - stock.reserved;
    return available >= quantity;
  }, [getProductStock]);

  // Mettre à jour le stock après une commande
  const updateStockAfterOrder = useCallback(async (orderItems) => {
    setLoading(true);
    try {
      const updates = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        operation: 'decrement'
      }));
      
      await productService.bulkUpdateStock(updates);
      
      // Mettre à jour le state local
      const updatedStock = new Map(stockData);
      orderItems.forEach(item => {
        const currentStock = updatedStock.get(item.productId);
        if (currentStock) {
          updatedStock.set(item.productId, {
            ...currentStock,
            quantity: Math.max(0, currentStock.quantity - item.quantity),
            reserved: currentStock.reserved
          });
        }
      });
      
      setStockData(updatedStock);
      setLoading(false);
      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour du stock');
      setLoading(false);
      return false;
    }
  }, [stockData]);

  // Réserver du stock temporairement
  const reserveStock = useCallback(async (productId, quantity, reservationId) => {
    try {
      const result = await productService.reserveStock(productId, quantity, reservationId);
      
      if (result.success) {
        // Mettre à jour le state local
        const updatedStock = new Map(stockData);
        const currentStock = updatedStock.get(productId);
        
        if (currentStock) {
          updatedStock.set(productId, {
            ...currentStock,
            reserved: currentStock.reserved + quantity
          });
          setStockData(updatedStock);
        }
      }
      
      return result;
    } catch (err) {
      return { success: false, error: 'Erreur lors de la réservation' };
    }
  }, [stockData]);

  // Libérer du stock réservé
  const releaseStock = useCallback(async (reservationId) => {
    try {
      const result = await productService.releaseStock(reservationId);
      
      if (result.success) {
        // Mettre à jour le state local
        const updatedStock = new Map(stockData);
        const productId = result.productId;
        const currentStock = updatedStock.get(productId);
        
        if (currentStock) {
          updatedStock.set(productId, {
            ...currentStock,
            reserved: Math.max(0, currentStock.reserved - result.releasedQuantity)
          });
          setStockData(updatedStock);
        }
      }
      
      return result;
    } catch (err) {
      return { success: false, error: 'Erreur lors de la libération du stock' };
    }
  }, [stockData]);

  // Surveiller les changements de stock en temps réel
  const startStockMonitoring = useCallback(() => {
    if (wsConnection.current) return;
    
    // Simulation de WebSocket pour les mises à jour en temps réel
    const ws = {
      onmessage: null,
      close: () => {}
    };
    
    wsConnection.current = ws;
    
    // Simuler des mises à jour périodiques
    const interval = setInterval(() => {
      // En production, cela serait remplacé par de vraies mises à jour WebSocket
      const randomProductId = Array.from(stockData.keys())[
        Math.floor(Math.random() * stockData.size)
      ];
      
      if (randomProductId) {
        const currentStock = stockData.get(randomProductId);
        const newQuantity = Math.max(0, currentStock.quantity - Math.floor(Math.random() * 3));
        
        const updatedStock = new Map(stockData);
        updatedStock.set(randomProductId, {
          ...currentStock,
          quantity: newQuantity
        });
        
        setStockData(updatedStock);
        
        // Vérifier les alertes
        if (newQuantity <= STOCK_THRESHOLDS.LOW_STOCK && currentStock.quantity > STOCK_THRESHOLDS.LOW_STOCK) {
          console.log(`Alerte stock bas: Produit ${randomProductId}`);
        }
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => {
      clearInterval(interval);
      wsConnection.current = null;
    };
  }, [stockData]);

  // Obtenir le niveau de stock sous forme de pourcentage
  const getStockLevel = useCallback((productId) => {
    const stock = getProductStock(productId);
    if (!stock.maxQuantity) return 0;
    
    return (stock.quantity / stock.maxQuantity) * 100;
  }, [getProductStock]);

  // Obtenir le statut de stock
  const getStockStatus = useCallback((productId) => {
    const stock = getProductStock(productId);
    const available = stock.quantity - stock.reserved;
    
    if (available <= STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return 'out_of_stock';
    } else if (available <= STOCK_THRESHOLDS.CRITICAL_STOCK) {
      return 'critical';
    } else if (available <= STOCK_THRESHOLDS.LOW_STOCK) {
      return 'low';
    } else {
      return 'in_stock';
    }
  }, [getProductStock]);

  // Générer un rapport de stock
  const generateStockReport = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const report = await productService.generateStockReport(options);
      setLoading(false);
      return report;
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
      setLoading(false);
      return null;
    }
  }, []);

  // Synchroniser le stock avec l'inventaire physique
  const syncPhysicalInventory = useCallback(async (updates) => {
    setLoading(true);
    try {
      const results = await productService.syncInventory(updates);
      setLoading(false);
      return results;
    } catch (err) {
      setError('Erreur lors de la synchronisation');
      setLoading(false);
      return { success: false, errors: [err.message] };
    }
  }, []);

  useEffect(() => {
    // Démarrer la surveillance du stock
    const cleanup = startStockMonitoring();
    return cleanup;
  }, [startStockMonitoring]);

  return {
    // État
    stockData: Array.from(stockData.values()),
    lowStockAlerts,
    outOfStockItems,
    loading,
    error,
    thresholds: STOCK_THRESHOLDS,
    
    // Actions
    loadStockData,
    getProductStock,
    checkAvailability,
    updateStockAfterOrder,
    reserveStock,
    releaseStock,
    getStockLevel,
    getStockStatus,
    generateStockReport,
    syncPhysicalInventory,
    
    // Utilitaires
    hasLowStockAlerts: lowStockAlerts.length > 0,
    hasOutOfStockItems: outOfStockItems.length > 0,
    totalProductsMonitored: stockData.size
  };
};

/**
 * Hook pour la gestion du stock d'un produit spécifique
 */
export const useProductStock = (productId) => {
  const [stock, setStock] = useState({ quantity: 0, reserved: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStock = useCallback(async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const stockData = await productService.getProductStock(id);
      setStock(stockData);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement du stock');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      loadStock(productId);
    }
  }, [productId, loadStock]);

  return {
    stock,
    loading,
    error,
    available: stock.quantity - stock.reserved,
    reload: () => loadStock(productId)
  };
};

export default useStockManagement;
