/**
 * Notification service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';

class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = '',
    } = options;

    const params = {
      page,
      limit,
      unreadOnly,
      type,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/notifications', params);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    if (!notificationId) throw new Error('Notification ID is required');
    
    return await apiService.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return await apiService.patch('/notifications/read-all');
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    if (!notificationId) throw new Error('Notification ID is required');
    
    return await apiService.delete(`/notifications/${notificationId}`);
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    return await apiService.delete('/notifications');
  }

  /**
   * Get notification count
   */
  async getUnreadCount() {
    const response = await apiService.get('/notifications/unread-count');
    return response.count;
  }

  /**
   * Create notification
   */
  async createNotification(notificationData) {
    if (!notificationData) throw new Error('Notification data is required');
    
    return await apiService.post('/notifications', notificationData);
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, title, body, data = {}) {
    if (!userId) throw new Error('User ID is required');
    if (!title) throw new Error('Title is required');
    if (!body) throw new Error('Body is required');
    
    return await apiService.post('/notifications/push', {
      userId,
      title,
      body,
      data,
    });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, subject, template, data = {}) {
    if (!userId) throw new Error('User ID is required');
    if (!subject) throw new Error('Subject is required');
    if (!template) throw new Error('Template is required');
    
    return await apiService.post('/notifications/email', {
      userId,
      subject,
      template,
      data,
    });
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(phoneNumber, message) {
    if (!phoneNumber) throw new Error('Phone number is required');
    if (!message) throw new Error('Message is required');
    
    return await apiService.post('/notifications/sms', {
      phoneNumber,
      message,
    });
  }

  /**
   * Get notification templates
   */
  async getTemplates() {
    return await apiService.get('/notifications/templates');
  }

  /**
   * Create notification template
   */
  async createTemplate(templateData) {
    if (!templateData) throw new Error('Template data is required');
    
    return await apiService.post('/notifications/templates', templateData);
  }

  /**
   * Update notification template
   */
  async updateTemplate(templateId, templateData) {
    if (!templateId) throw new Error('Template ID is required');
    if (!templateData) throw new Error('Template data is required');
    
    return await apiService.put(`/notifications/templates/${templateId}`, templateData);
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(templateId) {
    if (!templateId) throw new Error('Template ID is required');
    
    return await apiService.delete(`/notifications/templates/${templateId}`);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId = null) {
    const endpoint = userId ? `/notifications/preferences/${userId}` : '/notifications/preferences';
    return await apiService.get(endpoint);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    if (!preferences) throw new Error('Preferences are required');
    
    return await apiService.put('/notifications/preferences', preferences);
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription) {
    if (!subscription) throw new Error('Subscription is required');
    
    return await apiService.post('/notifications/push/subscribe', { subscription });
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush() {
    return await apiService.post('/notifications/push/unsubscribe');
  }

  /**
   * Get notification statistics
   */
  async getStats(options = {}) {
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

    return await apiService.get('/notifications/stats', params);
  }

  /**
   * Bulk send notifications
   */
  async bulkSend(notificationData, userIds = []) {
    if (!notificationData) throw new Error('Notification data is required');
    
    return await apiService.post('/notifications/bulk-send', {
      notificationData,
      userIds,
    });
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(notificationData, scheduleAt) {
    if (!notificationData) throw new Error('Notification data is required');
    if (!scheduleAt) throw new Error('Schedule date is required');
    
    return await apiService.post('/notifications/schedule', {
      ...notificationData,
      scheduleAt,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId) {
    if (!notificationId) throw new Error('Notification ID is required');
    
    return await apiService.delete(`/notifications/schedule/${notificationId}`);
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(options = {}) {
    const {
      page = 1,
      limit = 20,
    } = options;

    return await apiService.get('/notifications/scheduled', {
      page,
      limit,
    });
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToRealtime(callback) {
    return supabaseService.subscribe(
      'notifications',
      'INSERT',
      (payload) => {
        callback(payload.new);
      }
    );
  }

  /**
   * Request browser permission for notifications
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission has been denied');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Create browser notification
   */
  createBrowserNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(error => {
      console.warn('Failed to play notification sound:', error);
    });
  }

  /**
   * Vibrate device (for mobile)
   */
  vibrateDevice(pattern = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

export default notificationService;
