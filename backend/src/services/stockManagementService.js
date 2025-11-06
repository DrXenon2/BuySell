/**
 * Service backend de gestion avancée des stocks
 * Logique métier, validation, et traitement des stocks
 */

const { supabaseService } = require('./supabaseService');
const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

class StockManagementService {
  constructor() {
    this.supabase = supabaseService;
    this.lowStockThreshold = 10;
    this.criticalStockThreshold = 3;
  }

  /**
   * Mettre à jour le stock après une commande
   */
  async updateStockAfterOrder(orderId) {
    try {
      // Récupérer les items de la commande
      const orderItems = await this.getOrderItems(orderId);
      
      if (!orderItems || orderItems.length === 0) {
        throw new AppError('Aucun item trouvé pour cette commande', 404);
      }

      const stockUpdates = [];
      const failedUpdates = [];

      for (const item of orderItems) {
        try {
          // Vérifier la disponibilité avant mise à jour
          const availability = await this.checkProductAvailability(
            item.product_id, 
            item.quantity
          );

          if (!availability.available) {
            failedUpdates.push({
              productId: item.product_id,
              requested: item.quantity,
              available: availability.availableQuantity,
              error: 'Stock insuffisant'
            });
            continue;
          }

          // Mettre à jour le stock
          const updateResult = await this.decrementStock(
            item.product_id, 
            item.quantity,
            `order_${orderId}`
          );

          if (updateResult.success) {
            stockUpdates.push({
              productId: item.product_id,
              quantity: -item.quantity,
              newStock: updateResult.newQuantity
            });
          } else {
            failedUpdates.push({
              productId: item.product_id,
              error: updateResult.error
            });
          }
        } catch (error) {
          logger.error(`Erreur mise à jour stock produit ${item.product_id}:`, error);
          failedUpdates.push({
            productId: item.product_id,
            error: error.message
          });
        }
      }

      // Mettre à jour le statut de la commande
      if (failedUpdates.length === 0) {
        await this.updateOrderStatus(orderId, 'stock_updated');
      } else {
        await this.updateOrderStatus(orderId, 'stock_partially_updated');
      }

      return {
        success: failedUpdates.length === 0,
        orderId,
        stockUpdates,
        failedUpdates,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur mise à jour stock commande:', error);
      throw new AppError(`Échec mise à jour stock: ${error.message}`, 500);
    }
  }

  /**
   * Gérer les réservations de stock
   */
  async reserveStock(reservationData) {
    try {
      const { productId, quantity, reservationId, expiresIn = 900 } = reservationData;

      // Valider les données
      const validation = this.validateReservationData(reservationData);
      if (!validation.valid) {
        throw new AppError(validation.error, 400);
      }

      // Vérifier la disponibilité
      const availability = await this.checkProductAvailability(productId, quantity);
      if (!availability.available) {
        throw new AppError('Stock insuffisant pour la réservation', 409);
      }

      // Créer la réservation
      const reservation = await this.createReservation({
        productId,
        quantity,
        reservationId,
        expiresIn
      });

      // Mettre à jour le stock réservé
      await this.updateReservedStock(productId, quantity, 'increment');

      logger.info(`Stock réservé: ${quantity} unités pour produit ${productId}`);

      return {
        success: true,
        reservationId: reservation.id,
        productId,
        quantity,
        expiresAt: reservation.expires_at,
        availableUntil: reservation.expires_at
      };

    } catch (error) {
      logger.error('Erreur réservation stock:', error);
      throw error;
    }
  }

  /**
   * Libérer une réservation de stock
   */
  async releaseStock(reservationId) {
    try {
      // Récupérer la réservation
      const reservation = await this.getReservation(reservationId);
      
      if (!reservation) {
        throw new AppError('Réservation non trouvée', 404);
      }

      // Vérifier si la réservation est expirée
      if (new Date(reservation.expires_at) < new Date()) {
        logger.warn(`Réservation ${reservationId} déjà expirée`);
      }

      // Libérer le stock réservé
      await this.updateReservedStock(
        reservation.product_id, 
        reservation.quantity, 
        'decrement'
      );

      // Marquer la réservation comme libérée
      await this.updateReservationStatus(reservationId, 'released');

      logger.info(`Stock libéré: ${reservation.quantity} unités pour produit ${reservation.product_id}`);

      return {
        success: true,
        reservationId,
        productId: reservation.product_id,
        releasedQuantity: reservation.quantity,
        releasedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur libération stock:', error);
      throw error;
    }
  }

  /**
   * Vérifier la disponibilité en temps réel
   */
  async checkRealTimeAvailability(productId, quantity = 1) {
    try {
      const stock = await this.getProductStock(productId);
      
      if (!stock) {
        throw new AppError('Produit non trouvé', 404);
      }

      const available = stock.quantity - stock.reserved_quantity;
      const canFulfill = available >= quantity;

      return {
        productId,
        available,
        requested: quantity,
        canFulfill,
        inStock: stock.quantity > 0,
        lowStock: stock.quantity <= this.lowStockThreshold,
        criticalStock: stock.quantity <= this.criticalStockThreshold,
        reserved: stock.reserved_quantity,
        totalStock: stock.quantity,
        lastUpdated: stock.updated_at
      };

    } catch (error) {
      logger.error('Erreur vérification disponibilité:', error);
      throw error;
    }
  }

  /**
   * Générer des alertes de stock bas
   */
  async generateLowStockAlerts(threshold = null) {
    try {
      const alertThreshold = threshold || this.lowStockThreshold;
      
      const lowStockProducts = await this.getLowStockProducts(alertThreshold);
      
      const alerts = await Promise.all(
        lowStockProducts.map(async (product) => {
          const alert = await this.createStockAlert({
            productId: product.product_id,
            currentStock: product.quantity,
            threshold: alertThreshold,
            alertType: product.quantity <= this.criticalStockThreshold ? 'critical' : 'low',
            message: this.generateAlertMessage(product, alertThreshold)
          });

          return {
            productId: product.product_id,
            productName: product.products?.name,
            currentStock: product.quantity,
            reserved: product.reserved_quantity,
            available: product.quantity - product.reserved_quantity,
            alertType: alert.alert_type,
            alertId: alert.id,
            createdAt: alert.created_at
          };
        })
      );

      // Envoyer les notifications
      if (alerts.length > 0) {
        await this.sendStockAlerts(alerts);
      }

      return {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.alertType === 'critical').length,
        lowStockAlerts: alerts.filter(a => a.alertType === 'low').length,
        alerts,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur génération alertes stock:', error);
      throw error;
    }
  }

  /**
   * Synchroniser l'inventaire physique
   */
  async syncPhysicalInventory(syncData) {
    try {
      const { updates, performedBy, notes } = syncData;

      const results = [];
      const discrepancies = [];

      for (const update of updates) {
        try {
          const { productId, physicalCount } = update;

          const currentStock = await this.getProductStock(productId);
          const systemQuantity = currentStock.quantity;
          const discrepancy = physicalCount - systemQuantity;

          // Enregistrer la synchronisation
          const syncRecord = await this.createInventorySyncRecord({
            productId,
            systemQuantity,
            physicalCount,
            discrepancy,
            performedBy,
            notes: update.notes || notes
          });

          // Mettre à jour le stock si nécessaire
          if (discrepancy !== 0) {
            await this.adjustStock(
              productId, 
              physicalCount, 
              'inventory_sync', 
              syncRecord.id
            );

            discrepancies.push({
              productId,
              systemQuantity,
              physicalCount,
              discrepancy,
              adjusted: true,
              syncId: syncRecord.id
            });
          }

          results.push({
            productId,
            success: true,
            systemQuantity,
            physicalCount,
            discrepancy,
            syncId: syncRecord.id
          });

        } catch (error) {
          logger.error(`Erreur synchronisation produit ${update.productId}:`, error);
          results.push({
            productId: update.productId,
            success: false,
            error: error.message
          });
        }
      }

      // Générer un rapport de synchronisation
      const report = await this.generateSyncReport(results, performedBy);

      return {
        success: true,
        totalProcessed: updates.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalDiscrepancies: discrepancies.length,
        discrepancies,
        reportId: report.id,
        results
      };

    } catch (error) {
      logger.error('Erreur synchronisation inventaire:', error);
      throw error;
    }
  }

  /**
   * Méthodes utilitaires privées
   */

  async getOrderItems(orderId) {
    const { data, error } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return data;
  }

  async getProductStock(productId) {
    const { data, error } = await this.supabase
      .from('product_stock')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) throw error;
    return data;
  }

  async decrementStock(productId, quantity, reason) {
    const { data, error } = await this.supabase.rpc('decrement_product_stock', {
      p_product_id: productId,
      p_quantity: quantity,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  }

  async checkProductAvailability(productId, quantity) {
    const stock = await this.getProductStock(productId);
    const available = stock.quantity - stock.reserved_quantity;
    
    return {
      available: available >= quantity,
      availableQuantity: available,
      totalQuantity: stock.quantity,
      reservedQuantity: stock.reserved_quantity
    };
  }

  async getLowStockProducts(threshold) {
    const { data, error } = await this.supabase
      .from('product_stock')
      .select(`
        product_id,
        quantity,
        reserved_quantity,
        products (name, sku, price)
      `)
      .lte('quantity', threshold)
      .gt('quantity', 0);

    if (error) throw error;
    return data;
  }

  validateReservationData(data) {
    const { productId, quantity, reservationId } = data;

    if (!productId) {
      return { valid: false, error: 'ID produit requis' };
    }

    if (!quantity || quantity < 1) {
      return { valid: false, error: 'Quantité invalide' };
    }

    if (!reservationId) {
      return { valid: false, error: 'ID réservation requis' };
    }

    return { valid: true };
  }

  generateAlertMessage(product, threshold) {
    const available = product.quantity - product.reserved_quantity;
    
    if (product.quantity <= this.criticalStockThreshold) {
      return `Stock CRITIQUE: ${available} unités disponibles pour ${product.products?.name}`;
    } else {
      return `Stock BAS: ${available} unités disponibles pour ${product.products?.name} (seuil: ${threshold})`;
    }
  }

  // Méthodes de création (à implémenter selon votre schema DB)
  async createReservation(data) {
    // Implémentation spécifique à votre base de données
    const { data: reservation, error } = await this.supabase
      .from('stock_reservations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return reservation;
  }

  async createStockAlert(data) {
    // Implémentation spécifique
    const { data: alert, error } = await this.supabase
      .from('stock_alerts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return alert;
  }

  async createInventorySyncRecord(data) {
    // Implémentation spécifique
    const { data: record, error } = await this.supabase
      .from('inventory_sync_records')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return record;
  }

  async updateReservedStock(productId, quantity, operation) {
    // Implémentation spécifique
    const { error } = await this.supabase.rpc('update_reserved_stock', {
      p_product_id: productId,
      p_quantity: quantity,
      p_operation: operation
    });

    if (error) throw error;
  }

  async sendStockAlerts(alerts) {
    // Implémentation pour envoyer des notifications (email, webhook, etc.)
    logger.info(`Envoi de ${alerts.length} alertes de stock`);
    // Intégration avec votre système de notification
  }

  async generateSyncReport(results, performedBy) {
    // Implémentation pour générer un rapport
    const report = {
      performed_by: performedBy,
      total_items: results.length,
      successful_syncs: results.filter(r => r.success).length,
      failed_syncs: results.filter(r => !r.success).length,
      generated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('inventory_sync_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Instance singleton
const stockManagementService = new StockManagementService();

module.exports = { stockManagementService };
