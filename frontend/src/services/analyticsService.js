/**
 * Analytics service
 */

import { apiService } from './api';

class AnalyticsService {
  /**
   * Track page view
   */
  async trackPageView(page, title, additionalParams = {}) {
    // Send to your analytics backend
    try {
      await apiService.post('/analytics/pageview', {
        page,
        title,
        ...additionalParams,
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }

    // Also send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('config', process.env.NEXT_PUBLIC_GA_TRACKING_ID, {
        page_title: title,
        page_location: page,
      });
    }
  }

  /**
   * Track event
   */
  async trackEvent(category, action, label = '', value = 0) {
    // Send to your analytics backend
    try {
      await apiService.post('/analytics/event', {
        category,
        action,
        label,
        value,
      });
    } catch (error) {
      console.warn('Failed to track event:', error);
    }

    // Also send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }

  /**
   * Track ecommerce event
   */
  async trackEcommerceEvent(event, data) {
    // Send to your analytics backend
    try {
      await apiService.post('/analytics/ecommerce', {
        event,
        ...data,
      });
    } catch (error) {
      console.warn('Failed to track ecommerce event:', error);
    }

    // Also send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      switch (event) {
        case 'view_item':
          gtag('event', 'view_item', {
            items: [data.items],
          });
          break;
        case 'add_to_cart':
          gtag('event', 'add_to_cart', {
            items: [data.items],
          });
          break;
        case 'remove_from_cart':
          gtag('event', 'remove_from_cart', {
            items: [data.items],
          });
          break;
        case 'begin_checkout':
          gtag('event', 'begin_checkout', {
            items: data.items,
          });
          break;
        case 'purchase':
          gtag('event', 'purchase', {
            transaction_id: data.transaction_id,
            value: data.value,
            currency: data.currency,
            items: data.items,
          });
          break;
      }
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(options = {}) {
    const {
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/dashboard', params);
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/sales', params);
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId, options = {}) {
    if (!productId) throw new Error('Product ID is required');

    const {
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get(`/analytics/products/${productId}`, params);
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId, options = {}) {
    if (!userId) throw new Error('User ID is required');

    const {
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get(`/analytics/users/${userId}`, params);
  }

  /**
   * Get traffic analytics
   */
  async getTrafficAnalytics(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/traffic', params);
  }

  /**
   * Get conversion analytics
   */
  async getConversionAnalytics(options = {}) {
    const {
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/conversion', params);
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/revenue', params);
  }

  /**
   * Get popular products
   */
  async getPopularProducts(options = {}) {
    const {
      limit = 10,
      startDate = '',
      endDate = '',
      category = '',
    } = options;

    const params = {
      limit,
      startDate,
      endDate,
      category,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/popular-products', params);
  }

  /**
   * Get customer acquisition metrics
   */
  async getCustomerAcquisition(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/customer-acquisition', params);
  }

  /**
   * Get retention metrics
   */
  async getRetentionMetrics(options = {}) {
    const {
      period = 'monthly',
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      period,
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/retention', params);
  }

  /**
   * Get geographic analytics
   */
  async getGeographicAnalytics(options = {}) {
    const {
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/geographic', params);
  }

  /**
   * Get device analytics
   */
  async getDeviceAnalytics(options = {}) {
    const {
      startDate = '',
      endDate = '',
    } = options;

    const params = {
      startDate,
      endDate,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/analytics/devices', params);
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(options = {}) {
    const {
      format = 'csv',
      type = 'sales',
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      format,
      type,
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiService.get('/analytics/export', params);
    
    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return response;
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics() {
    return await apiService.get('/analytics/realtime');
  }

  /**
   * Track user behavior
   */
  async trackUserBehavior(sessionId, behavior, data = {}) {
    try {
      await apiService.post('/analytics/behavior', {
        sessionId,
        behavior,
        ...data,
      });
    } catch (error) {
      console.warn('Failed to track user behavior:', error);
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId) {
    if (!testId) throw new Error('Test ID is required');
    
    return await apiService.get(`/analytics/ab-test/${testId}`);
  }

  /**
   * Track A/B test conversion
   */
  async trackABTestConversion(testId, variant, conversion) {
    if (!testId) throw new Error('Test ID is required');
    if (!variant) throw new Error('Variant is required');
    if (!conversion) throw new Error('Conversion is required');
    
    try {
      await apiService.post('/analytics/ab-test/conversion', {
        testId,
        variant,
        conversion,
      });
    } catch (error) {
      console.warn('Failed to track A/B test conversion:', error);
    }
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

export default analyticsService;
