const database = require('../config/database');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.supabase = require('../config/supabase').getClient();
  }

  /**
   * Obtenir les statistiques du tableau de bord
   */
  async getDashboardStats(userId, userRole, period = '30d') {
    try {
      const stats = {
        overview: {},
        sales: {},
        products: {},
        customers: {}
      };

      // Statistiques générales selon le rôle
      if (userRole === 'admin') {
        stats.overview = await this.getAdminOverview(period);
        stats.sales = await this.getSalesAnalytics(period);
        stats.products = await this.getProductAnalytics(period);
        stats.customers = await this.getCustomerAnalytics(period);
      } else if (userRole === 'seller') {
        stats.overview = await this.getSellerOverview(userId, period);
        stats.sales = await this.getSellerSalesAnalytics(userId, period);
        stats.products = await this.getSellerProductAnalytics(userId, period);
      } else {
        throw new Error('Accès non autorisé aux analytics');
      }

      return stats;

    } catch (error) {
      logger.error('Erreur service analytics getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Aperçu admin
   */
  async getAdminOverview(period) {
    const { data, error } = await this.supabase.rpc('get_admin_overview', {
      period_param: period
    });

    if (error) throw error;

    return {
      total_revenue: data?.total_revenue || 0,
      total_orders: data?.total_orders || 0,
      total_customers: data?.total_customers || 0,
      total_products: data?.total_products || 0,
      average_order_value: data?.average_order_value || 0,
      conversion_rate: data?.conversion_rate || 0
    };
  }

  /**
   * Aperçu vendeur
   */
  async getSellerOverview(sellerId, period) {
    const { data, error } = await this.supabase.rpc('get_seller_overview', {
      seller_id: sellerId,
      period_param: period
    });

    if (error) throw error;

    return {
      total_revenue: data?.total_revenue || 0,
      total_orders: data?.total_orders || 0,
      total_products: data?.total_products || 0,
      average_order_value: data?.average_order_value || 0,
      commission_earned: data?.commission_earned || 0
    };
  }

  /**
   * Analytics des ventes
   */
  async getSalesAnalytics(period) {
    const { data, error } = await this.supabase.rpc('get_sales_analytics', {
      period_param: period
    });

    if (error) throw error;

    return {
      revenue_trend: data?.revenue_trend || [],
      orders_trend: data?.orders_trend || [],
      average_order_value_trend: data?.average_order_value_trend || [],
      top_categories: data?.top_categories || []
    };
  }

  /**
   * Analytics des ventes vendeur
   */
  async getSellerSalesAnalytics(sellerId, period) {
    const { data, error } = await this.supabase.rpc('get_seller_sales_analytics', {
      seller_id: sellerId,
      period_param: period
    });

    if (error) throw error;

    return {
      revenue_trend: data?.revenue_trend || [],
      orders_trend: data?.orders_trend || [],
      top_products: data?.top_products || []
    };
  }

  /**
   * Analytics des produits
   */
  async getProductAnalytics(period) {
    const { data, error } = await this.supabase.rpc('get_product_analytics', {
      period_param: period
    });

    if (error) throw error;

    return {
      top_selling_products: data?.top_selling_products || [],
      low_stock_products: data?.low_stock_products || [],
      product_performance: data?.product_performance || []
    };
  }

  /**
   * Analytics des produits vendeur
   */
  async getSellerProductAnalytics(sellerId, period) {
    const { data, error } = await this.supabase.rpc('get_seller_product_analytics', {
      seller_id: sellerId,
      period_param: period
    });

    if (error) throw error;

    return {
      top_selling_products: data?.top_selling_products || [],
      low_stock_products: data?.low_stock_products || [],
      inventory_value: data?.inventory_value || 0
    };
  }

  /**
   * Analytics des clients
   */
  async getCustomerAnalytics(period) {
    const { data, error } = await this.supabase.rpc('get_customer_analytics', {
      period_param: period
    });

    if (error) throw error;

    return {
      new_customers: data?.new_customers || 0,
      returning_customers: data?.returning_customers || 0,
      customer_acquisition: data?.customer_acquisition || [],
      customer_lifetime_value: data?.customer_lifetime_value || 0
    };
  }

  /**
   * Rapports personnalisés
   */
  async generateCustomReport(reportType, filters = {}) {
    try {
      const reportTypes = {
        sales: this.generateSalesReport,
        products: this.generateProductsReport,
        customers: this.generateCustomersReport,
        inventory: this.generateInventoryReport
      };

      const reportGenerator = reportTypes[reportType];
      if (!reportGenerator) {
        throw new Error(`Type de rapport non supporté: ${reportType}`);
      }

      return await reportGenerator(filters);

    } catch (error) {
      logger.error('Erreur service analytics generateCustomReport:', error);
      throw error;
    }
  }

  /**
   * Rapport des ventes
   */
  async generateSalesReport(filters) {
    const { data, error } = await this.supabase.rpc('generate_sales_report', {
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id,
      seller_id: filters.seller_id
    });

    if (error) throw error;

    return {
      summary: data?.summary || {},
      daily_sales: data?.daily_sales || [],
      top_products: data?.top_products || [],
      sales_by_category: data?.sales_by_category || [],
      sales_by_region: data?.sales_by_region || []
    };
  }

  /**
   * Rapport des produits
   */
  async generateProductsReport(filters) {
    const { data, error } = await this.supabase.rpc('generate_products_report', {
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id
    });

    if (error) throw error;

    return {
      performance: data?.performance || [],
      inventory: data?.inventory || [],
      reviews: data?.reviews || [],
      categories: data?.categories || []
    };
  }

  /**
   * Rapport des clients
   */
  async generateCustomersReport(filters) {
    const { data, error } = await this.supabase.rpc('generate_customers_report', {
      date_from: filters.date_from,
      date_to: filters.date_to
    });

    if (error) throw error;

    return {
      acquisition: data?.acquisition || [],
      retention: data?.retention || [],
      lifetime_value: data?.lifetime_value || [],
      segmentation: data?.segmentation || []
    };
  }

  /**
   * Rapport d'inventaire
   */
  async generateInventoryReport(filters) {
    const { data, error } = await this.supabase.rpc('generate_inventory_report', {
      low_stock_threshold: filters.low_stock_threshold || 10
    });

    if (error) throw error;

    return {
      stock_levels: data?.stock_levels || [],
      low_stock_alerts: data?.low_stock_alerts || [],
      inventory_turnover: data?.inventory_turnover || [],
      valuation: data?.valuation || {}
    };
  }

  /**
   * Métriques en temps réel
   */
  async getRealtimeMetrics() {
    const { data, error } = await this.supabase.rpc('get_realtime_metrics');

    if (error) throw error;

    return {
      active_users: data?.active_users || 0,
      pending_orders: data?.pending_orders || 0,
      today_revenue: data?.today_revenue || 0,
      cart_abandonment_rate: data?.cart_abandonment_rate || 0
    };
  }

  /**
   * Tracer un événement
   */
  async trackEvent(userId, eventType, eventData = {}) {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          user_agent: eventData.user_agent,
          ip_address: eventData.ip_address,
          created_at: new Date()
        });

      if (error) throw error;

      logger.debug('Événement analytics tracé', { userId, eventType });

    } catch (error) {
      logger.error('Erreur service analytics trackEvent:', error);
      // Ne pas bloquer l'application en cas d'erreur d'analytics
    }
  }

  /**
   * Obtenir les tendances
   */
  async getTrends(metric, period = '7d') {
    const { data, error } = await this.supabase.rpc('get_metric_trends', {
      metric_name: metric,
      period_param: period
    });

    if (error) throw error;

    return {
      current: data?.current_value || 0,
      previous: data?.previous_value || 0,
      trend: data?.trend_direction || 'stable',
      percentage_change: data?.percentage_change || 0
    };
  }

  /**
   * Analytics de performance du site
   */
  async getPerformanceMetrics(period = '7d') {
    const { data, error } = await this.supabase.rpc('get_performance_metrics', {
      period_param: period
    });

    if (error) throw error;

    return {
      page_views: data?.page_views || 0,
      unique_visitors: data?.unique_visitors || 0,
      bounce_rate: data?.bounce_rate || 0,
      session_duration: data?.session_duration || 0,
      top_pages: data?.top_pages || []
    };
  }
}

module.exports = new AnalyticsService();
