const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class AnalyticsController {
  // Obtenir les analytics générales
  async getAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

      const dateRange = this.getDateRange(period);

      const [
        revenueData,
        ordersData,
        usersData,
        topProducts,
        salesByCategory
      ] = await Promise.all([
        this.getRevenueAnalytics(dateRange),
        this.getOrdersAnalytics(dateRange),
        this.getUsersAnalytics(dateRange),
        this.getTopProducts(10),
        this.getSalesByCategory()
      ]);

      res.json({
        success: true,
        data: {
          period,
          date_range: dateRange,
          revenue: revenueData,
          orders: ordersData,
          users: usersData,
          top_products: topProducts,
          sales_by_category: salesByCategory
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getAnalytics:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des analytics'
      });
    }
  }

  // Obtenir les analytics pour vendeur
  async getSellerAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const dateRange = this.getDateRange(period);

      const [
        revenueData,
        ordersData,
        topProducts,
        salesData
      ] = await Promise.all([
        this.getSellerRevenueAnalytics(userId, dateRange),
        this.getSellerOrdersAnalytics(userId, dateRange),
        this.getSellerTopProducts(userId, 10),
        this.getSellerSalesData(userId, dateRange)
      ]);

      res.json({
        success: true,
        data: {
          period,
          date_range: dateRange,
          revenue: revenueData,
          orders: ordersData,
          top_products: topProducts,
          sales_data: salesData
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getSellerAnalytics:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des analytics vendeur'
      });
    }
  }

  // Méthodes helper
  getDateRange(period) {
    const now = new Date();
    const from = new Date();

    switch (period) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      case '1y':
        from.setFullYear(now.getFullYear() - 1);
        break;
      default:
        from.setDate(now.getDate() - 30);
    }

    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  }

  async getRevenueAnalytics(dateRange) {
    const { data } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('status', 'delivered')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    const totalRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const averageOrderValue = data?.length ? totalRevenue / data.length : 0;

    // Données pour graphique (groupé par jour/semaine)
    const revenueByPeriod = this.groupDataByPeriod(data || [], 'created_at', 'total_amount');

    return {
      total: parseFloat(totalRevenue.toFixed(2)),
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      chart_data: revenueByPeriod
    };
  }

  async getOrdersAnalytics(dateRange) {
    const { data, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    const completedOrders = data?.filter(order => order.status === 'delivered').length || 0;
    const conversionRate = data?.length ? (completedOrders / data.length) * 100 : 0;

    return {
      total: count || 0,
      completed: completedOrders,
      conversion_rate: parseFloat(conversionRate.toFixed(2))
    };
  }

  async getUsersAnalytics(dateRange) {
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', dateRange.from)
      .lte('last_login', dateRange.to);

    return {
      new_users: newUsers || 0,
      active_users: activeUsers || 0
    };
  }

  async getTopProducts(limit = 10) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products (
          id,
          name,
          slug,
          images
        )
      `)
      .limit(limit);

    const productSales = data?.reduce((acc, item) => {
      const productId = item.products.id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.products,
          total_sold: 0
        };
      }
      acc[productId].total_sold += item.quantity;
      return acc;
    }, {});

    return Object.values(productSales || {}).sort((a, b) => b.total_sold - a.total_sold);
  }

  async getSalesByCategory() {
    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        products (
          categories (id, name)
        )
      `);

    const categorySales = data?.reduce((acc, item) => {
      const category = item.products.categories;
      if (category) {
        if (!acc[category.id]) {
          acc[category.id] = {
            category: category.name,
            total_sales: 0,
            total_quantity: 0
          };
        }
        acc[category.id].total_sales += item.quantity * item.unit_price;
        acc[category.id].total_quantity += item.quantity;
      }
      return acc;
    }, {});

    return Object.values(categorySales || {});
  }

  // Méthodes pour vendeurs
  async getSellerRevenueAnalytics(sellerId, dateRange) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        total_price,
        created_at,
        products!inner (user_id)
      `)
      .eq('products.user_id', sellerId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    const totalRevenue = data?.reduce((sum, item) => sum + item.total_price, 0) || 0;

    return {
      total: parseFloat(totalRevenue.toFixed(2)),
      chart_data: this.groupDataByPeriod(data || [], 'created_at', 'total_price')
    };
  }

  async getSellerOrdersAnalytics(sellerId, dateRange) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        order_id,
        products!inner (user_id)
      `)
      .eq('products.user_id', sellerId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    const uniqueOrders = new Set(data?.map(item => item.order_id)).size;

    return {
      total_orders: uniqueOrders,
      total_items: data?.length || 0
    };
  }

  async getSellerTopProducts(sellerId, limit = 10) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products!inner (
          id,
          name,
          slug,
          images,
          user_id
        )
      `)
      .eq('products.user_id', sellerId)
      .limit(limit);

    const productSales = data?.reduce((acc, item) => {
      const product = item.products;
      if (!acc[product.id]) {
        acc[product.id] = {
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            images: product.images
          },
          total_sold: 0
        };
      }
      acc[product.id].total_sold += item.quantity;
      return acc;
    }, {});

    return Object.values(productSales || {}).sort((a, b) => b.total_sold - a.total_sold);
  }

  async getSellerSalesData(sellerId, dateRange) {
    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        created_at,
        products!inner (user_id)
      `)
      .eq('products.user_id', sellerId)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    return this.groupDataByPeriod(data || [], 'created_at', null, (item) => item.quantity * item.unit_price);
  }

  groupDataByPeriod(data, dateField, valueField, valueFn = null) {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const periodKey = date.toISOString().split('T')[0]; // Group by day

      if (!acc[periodKey]) {
        acc[periodKey] = 0;
      }

      const value = valueFn ? valueFn(item) : (valueField ? item[valueField] : 1);
      acc[periodKey] += value;

      return acc;
    }, {});

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      value: parseFloat(value.toFixed(2))
    }));
  }
}

module.exports = new AnalyticsController();
