/**
 * Service de gestion des stocks en temps réel pour Buysell
 * Surveillance, alertes, réservations et mises à jour automatiques
 */

import { supabaseClient } from './supabaseClient';

class StockService {
  constructor() {
    this.supabase = supabaseClient;
    this.lowStockThreshold = 10;
    this.criticalStockThreshold = 3;
  }

  /**
   * Obtenir les informations de stock d'un produit
   */
  async getProductStock(productId) {
    try {
      const { data, error } = await this.supabase
        .from('product_stock')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;

      return {
        productId: data.product_id,
        quantity: data.quantity,
        reserved: data.reserved_quantity,
        available: data.quantity - data.reserved_quantity,
        lowStock: data.quantity <= this.lowStockThreshold,
        criticalStock: data.quantity <= this.criticalStockThreshold,
        lastUpdated: data.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération stock:', error);
      throw new Error('Impossible de récupérer les informations de stock');
    }
  }

  /**
   * Obtenir les stocks de plusieurs produits
   */
  async getBulkStockInfo(productIds) {
    try {
      const { data, error } = await this.supabase
        .from('product_stock')
        .select('*')
        .in('product_id', productIds);

      if (error) throw error;

      return data.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        reserved: item.reserved_quantity,
        available: item.quantity - item.reserved_quantity,
        lowStock: item.quantity <= this.lowStockThreshold,
        criticalStock: item.quantity <= this.criticalStockThreshold,
        lastUpdated: item.updated_at
      }));
    } catch (error) {
      console.error('Erreur récupération stocks multiples:', error);
      throw new Error('Impossible de récupérer les stocks');
    }
  }

  /**
   * Vérifier la disponibilité d'un produit
   */
  async checkAvailability(productId, quantity = 1) {
    try {
      const stock = await this.getProductStock(productId);
      return {
        available: stock.available >= quantity,
        availableQuantity: stock.available,
        requestedQuantity: quantity,
        productId
      };
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return {
        available: false,
        availableQuantity: 0,
        requestedQuantity: quantity,
        productId
      };
    }
  }

  /**
   * Réserver du stock temporairement
   */
  async reserveStock(productId, quantity, reservationId, expiresIn = 900) { // 15 minutes par défaut
    try {
      const { data, error } = await this.supabase.rpc('reserve_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_reservation_id: reservationId,
        p_expires_in: expiresIn
      });

      if (error) throw error;

      if (data.success) {
        return {
          success: true,
          reservationId,
          productId,
          quantity,
          expiresAt: new Date(Date.now() + expiresIn * 1000)
        };
      } else {
        throw new Error(data.message || 'Échec de la réservation');
      }
    } catch (error) {
      console.error('Erreur réservation stock:', error);
      return {
        success: false,
        error: error.message,
        reservationId,
        productId,
        quantity
      };
    }
  }

  /**
   * Libérer du stock réservé
   */
  async releaseStock(reservationId) {
    try {
      const { data, error } = await this.supabase.rpc('release_stock_reservation', {
        p_reservation_id: reservationId
      });

      if (error) throw error;

      return {
        success: true,
        reservationId,
        releasedQuantity: data.released_quantity,
        productId: data.product_id
      };
    } catch (error) {
      console.error('Erreur libération stock:', error);
      return {
        success: false,
        error: error.message,
        reservationId
      };
    }
  }

  /**
   * Mettre à jour le stock après commande
   */
  async updateStockAfterOrder(orderItems) {
    try {
      const updates = orderItems.map(item => ({
        product_id: item.productId,
        quantity: -item.quantity // Déduction du stock
      }));

      const { data, error } = await this.supabase.rpc('bulk_update_stock', {
        p_updates: updates
      });

      if (error) throw error;

      return {
        success: true,
        updatedItems: data.updated_items,
        failedItems: data.failed_items
      };
    } catch (error) {
      console.error('Erreur mise à jour stock commande:', error);
      throw new Error('Impossible de mettre à jour le stock');
    }
  }

  /**
   * Mettre à jour le stock manuellement
   */
  async updateStock(productId, newQuantity, reason = 'manual_update') {
    try {
      const { data, error } = await this.supabase
        .from('stock_updates')
        .insert({
          product_id: productId,
          previous_quantity: await this.getCurrentQuantity(productId),
          new_quantity: newQuantity,
          change_type: 'manual',
          reason,
          updated_by: 'system' // En production, utiliser l'ID utilisateur
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la table de stock
      const { error: updateError } = await this.supabase
        .from('product_stock')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId);

      if (updateError) throw updateError;

      return {
        success: true,
        productId,
        previousQuantity: data.previous_quantity,
        newQuantity,
        change: newQuantity - data.previous_quantity
      };
    } catch (error) {
      console.error('Erreur mise à jour stock manuelle:', error);
      return {
        success: false,
        error: error.message,
        productId
      };
    }
  }

  /**
   * Obtenir l'historique des modifications de stock
   */
  async getStockHistory(productId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('stock_updates')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erreur récupération historique stock:', error);
      return [];
    }
  }

  /**
   * Obtenir les alertes de stock bas
   */
  async getLowStockAlerts(threshold = null) {
    try {
      const stockThreshold = threshold || this.lowStockThreshold;
      
      const { data, error } = await this.supabase
        .from('product_stock')
        .select(`
          product_id,
          quantity,
          reserved_quantity,
          products (
            name,
            sku,
            price,
            images
          )
        `)
        .lte('quantity', stockThreshold)
        .gt('quantity', 0) // Exclure les ruptures de stock
        .order('quantity', { ascending: true });

      if (error) throw error;

      return data.map(item => ({
        productId: item.product_id,
        productName: item.products?.name,
        sku: item.products?.sku,
        currentStock: item.quantity,
        reserved: item.reserved_quantity,
        available: item.quantity - item.reserved_quantity,
        status: item.quantity <= this.criticalStockThreshold ? 'critical' : 'low',
        price: item.products?.price,
        image: item.products?.images?.[0]
      }));
    } catch (error) {
      console.error('Erreur récupération alertes stock:', error);
      return [];
    }
  }

  /**
   * Obtenir les produits en rupture de stock
   */
  async getOutOfStockProducts() {
    try {
      const { data, error } = await this.supabase
        .from('product_stock')
        .select(`
          product_id,
          quantity,
          products (
            name,
            sku,
            price,
            images,
            category_id
          )
        `)
        .eq('quantity', 0)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        productId: item.product_id,
        productName: item.products?.name,
        sku: item.products?.sku,
        categoryId: item.products?.category_id,
        price: item.products?.price,
        image: item.products?.images?.[0],
        outSince: item.updated_at
      }));
    } catch (error) {
      console.error('Erreur récupération ruptures stock:', error);
      return [];
    }
  }

  /**
   * Synchroniser l'inventaire physique
   */
  async syncPhysicalInventory(updates) {
    try {
      const results = [];

      for (const update of updates) {
        const { productId, physicalCount, notes } = update;
        
        const currentStock = await this.getCurrentQuantity(productId);
        const discrepancy = physicalCount - currentStock;

        // Enregistrer la synchronisation
        const { data, error } = await this.supabase
          .from('inventory_sync')
          .insert({
            product_id: productId,
            system_quantity: currentStock,
            physical_quantity: physicalCount,
            discrepancy,
            notes,
            synced_by: 'system' // En production, utiliser l'ID utilisateur
          })
          .select()
          .single();

        if (error) {
          results.push({
            productId,
            success: false,
            error: error.message
          });
          continue;
        }

        // Mettre à jour le stock si nécessaire
        if (discrepancy !== 0) {
          await this.updateStock(productId, physicalCount, 'inventory_sync');
        }

        results.push({
          productId,
          success: true,
          systemQuantity: currentStock,
          physicalQuantity: physicalCount,
          discrepancy,
          syncId: data.id
        });
      }

      return {
        success: true,
        results,
        totalProcessed: updates.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Erreur synchronisation inventaire:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Générer un rapport de stock
   */
  async generateStockReport(options = {}) {
    try {
      const {
        categoryId = null,
        lowStockOnly = false,
        outOfStockOnly = false,
        dateRange = null
      } = options;

      let query = this.supabase
        .from('product_stock')
        .select(`
          product_id,
          quantity,
          reserved_quantity,
          updated_at,
          products (
            name,
            sku,
            price,
            category_id,
            categories (name),
            created_at
          )
        `);

      // Appliquer les filtres
      if (categoryId) {
        query = query.eq('products.category_id', categoryId);
      }

      if (lowStockOnly) {
        query = query.lte('quantity', this.lowStockThreshold).gt('quantity', 0);
      }

      if (outOfStockOnly) {
        query = query.eq('quantity', 0);
      }

      if (dateRange) {
        query = query.gte('updated_at', dateRange.start).lte('updated_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Traiter les données pour le rapport
      const report = {
        generatedAt: new Date().toISOString(),
        totalProducts: data.length,
        totalInStock: data.filter(item => item.quantity > 0).length,
        totalOutOfStock: data.filter(item => item.quantity === 0).length,
        totalLowStock: data.filter(item => item.quantity > 0 && item.quantity <= this.lowStockThreshold).length,
        totalValue: data.reduce((sum, item) => sum + (item.quantity * (item.products?.price || 0)), 0),
        products: data.map(item => ({
          productId: item.product_id,
          name: item.products?.name,
          sku: item.products?.sku,
          category: item.products?.categories?.name,
          quantity: item.quantity,
          reserved: item.reserved_quantity,
          available: item.quantity - item.reserved_quantity,
          price: item.products?.price,
          value: item.quantity * (item.products?.price || 0),
          status: item.quantity === 0 ? 'out_of_stock' : 
                  item.quantity <= this.criticalStockThreshold ? 'critical' :
                  item.quantity <= this.lowStockThreshold ? 'low' : 'normal',
          lastUpdated: item.updated_at
        }))
      };

      return report;
    } catch (error) {
      console.error('Erreur génération rapport stock:', error);
      throw new Error('Impossible de générer le rapport de stock');
    }
  }

  /**
   * Surveiller les changements de stock en temps réel
   */
  subscribeToStockChanges(callback) {
    return this.supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_stock'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }

  /**
   * Méthodes utilitaires privées
   */

  async getCurrentQuantity(productId) {
    try {
      const { data, error } = await this.supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data.quantity;
    } catch (error) {
      console.error('Erreur récupération quantité:', error);
      return 0;
    }
  }
}

// Instance singleton
const stockService = new StockService();

export default stockService;
