const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

class ReportJobs {
  /**
   * Génère les rapports quotidiens
   */
  async generateDailyReports() {
    try {
      logger.info('📊 Génération des rapports quotidiens...');

      const reportDate = new Date().toISOString().split('T')[0];
      
      const tasks = [
        this.generateSalesReport(reportDate),
        this.generateUserActivityReport(reportDate),
        this.generateProductPerformanceReport(reportDate)
      ];

      const results = await Promise.allSettled(tasks);

      // Envoyer le rapport résumé aux administrateurs
      await this.sendDailySummaryToAdmins(results, reportDate);

      logger.info('✅ Rapports quotidiens générés avec succès');

    } catch (error) {
      logger.error('❌ Erreur job generateDailyReports:', error);
      throw error;
    }
  }

  /**
   * Génère les rapports hebdomadaires
   */
  async generateWeeklyReports() {
    try {
      logger.info('📈 Génération des rapports hebdomadaires...');

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const weeklyReport = {
        period: 'weekly',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        sales: await this.getWeeklySalesData(startDate, endDate),
        users: await this.getWeeklyUserData(startDate, endDate),
        products: await this.getWeeklyProductData(startDate, endDate)
      };

      // Sauvegarder le rapport
      const { error } = await supabase
        .from('reports')
        .insert({
          type: 'weekly',
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          data: weeklyReport,
          generated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Envoyer aux administrateurs
      await this.sendWeeklyReportToAdmins(weeklyReport);

      logger.info('✅ Rapport hebdomadaire généré avec succès');

    } catch (error) {
      logger.error('❌ Erreur job generateWeeklyReports:', error);
      throw error;
    }
  }

  /**
   * Génère le rapport des ventes quotidiennes
   */
  async generateSalesReport(date) {
    try {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .in('status', ['completed', 'delivered']);

      if (error) {
        throw error;
      }

      const salesData = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
        average_order_value: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) / orders.length : 0,
        orders_by_status: this.groupBy(orders, 'status'),
        payment_methods: this.groupBy(orders, 'payment_method')
      };

      // Sauvegarder le rapport
      await supabase
        .from('reports')
        .insert({
          type: 'daily_sales',
          period_start: startOfDay.toISOString(),
          period_end: endOfDay.toISOString(),
          data: salesData,
          generated_at: new Date().toISOString()
        });

      logger.debug(`💰 Rapport ventes du ${date}: ${salesData.total_orders} commandes, ${salesData.total_revenue}€`);

      return salesData;

    } catch (error) {
      logger.error('❌ Erreur generateSalesReport:', error);
      throw error;
    }
  }

  /**
   * Génère le rapport d'activité des utilisateurs
   */
  async generateUserActivityReport(date) {
    try {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      // Nouveaux utilisateurs
      const { data: newUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (usersError) {
        throw usersError;
      }

      // Connexions utilisateurs
      const { data: userSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('user_id')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (sessionsError) {
        throw sessionsError;
      }

      const userData = {
        new_users: newUsers.length,
        active_users: [...new Set(userSessions.map(s => s.user_id))].length,
        user_registrations: this.groupByTime(newUsers, 'created_at', 'hour')
      };

      await supabase
        .from('reports')
        .insert({
          type: 'daily_users',
          period_start: startOfDay.toISOString(),
          period_end: endOfDay.toISOString(),
          data: userData,
          generated_at: new Date().toISOString()
        });

      logger.debug(`👥 Rapport utilisateurs du ${date}: ${userData.new_users} nouveaux, ${userData.active_users} actifs`);

      return userData;

    } catch (error) {
      logger.error('❌ Erreur generateUserActivityReport:', error);
      throw error;
    }
  }

  /**
   * Envoie le résumé quotidien aux administrateurs
   */
  async sendDailySummaryToAdmins(results, date) {
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (!admins || admins.length === 0) return;

      const reportData = {
        date,
        sales: results[0].status === 'fulfilled' ? results[0].value : null,
        users: results[1].status === 'fulfilled' ? results[1].value : null,
        products: results[2].status === 'fulfilled' ? results[2].value : null
      };

      for (const admin of admins) {
        try {
          await emailService.sendDailyReport({
            to: admin.email,
            name: admin.first_name,
            report: reportData
          });
        } catch (error) {
          logger.error(`❌ Erreur envoi rapport à ${admin.email}:`, error);
        }
      }

      logger.info(`📨 Rapport quotidien envoyé à ${admins.length} administrateurs`);

    } catch (error) {
      logger.error('❌ Erreur sendDailySummaryToAdmins:', error);
    }
  }

  // Méthodes helpers
  groupBy(array, key) {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item);
      return result;
    }, {});
  }

  groupByTime(array, dateKey, interval = 'hour') {
    return array.reduce((result, item) => {
      const date = new Date(item[dateKey]);
      let key;
      
      if (interval === 'hour') {
        key = `${date.getHours()}:00`;
      } else if (interval === 'day') {
        key = date.toISOString().split('T')[0];
      }
      
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }
}

module.exports = new ReportJobs();
