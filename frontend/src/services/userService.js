/**
 * User service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';
import { PAGINATION } from '../utils/constants';

class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId = null) {
    const endpoint = userId ? `/users/${userId}/profile` : '/users/profile';
    return await apiService.get(endpoint);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    if (!profileData) throw new Error('Profile data is required');
    
    return await apiService.put('/users/profile', profileData);
  }

  /**
   * Update user avatar
   */
  async updateAvatar(imageFile) {
    if (!imageFile) throw new Error('Image file is required');
    
    const formData = new FormData();
    formData.append('avatar', imageFile);

    return await apiService.upload('/users/avatar', formData);
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar() {
    return await apiService.delete('/users/avatar');
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    if (!currentPassword) throw new Error('Current password is required');
    if (!newPassword) throw new Error('New password is required');
    
    return await apiService.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId = null) {
    const endpoint = userId ? `/users/${userId}/addresses` : '/users/addresses';
    return await apiService.get(endpoint);
  }

  /**
   * Add address
   */
  async addAddress(addressData) {
    if (!addressData) throw new Error('Address data is required');
    
    return await apiService.post('/users/addresses', addressData);
  }

  /**
   * Update address
   */
  async updateAddress(addressId, addressData) {
    if (!addressId) throw new Error('Address ID is required');
    if (!addressData) throw new Error('Address data is required');
    
    return await apiService.put(`/users/addresses/${addressId}`, addressData);
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId) {
    if (!addressId) throw new Error('Address ID is required');
    
    return await apiService.delete(`/users/addresses/${addressId}`);
  }

  /**
   * Set default address
   */
  async setDefaultAddress(addressId) {
    if (!addressId) throw new Error('Address ID is required');
    
    return await apiService.patch(`/users/addresses/${addressId}/default`);
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId = null, options = {}) {
    const endpoint = userId ? `/users/${userId}/orders` : '/users/orders';
    
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = '',
    } = options;

    return await apiService.get(endpoint, {
      page,
      limit,
      status,
    });
  }

  /**
   * Get user wishlist
   */
  async getWishlist(userId = null) {
    const endpoint = userId ? `/users/${userId}/wishlist` : '/users/wishlist';
    return await apiService.get(endpoint);
  }

  /**
   * Add to wishlist
   */
  async addToWishlist(productId) {
    if (!productId) throw new Error('Product ID is required');
    
    return await apiService.post('/users/wishlist', { productId });
  }

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(productId) {
    if (!productId) throw new Error('Product ID is required');
    
    return await apiService.delete(`/users/wishlist/${productId}`);
  }

  /**
   * Clear wishlist
   */
  async clearWishlist() {
    return await apiService.delete('/users/wishlist');
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(productId) {
    if (!productId) throw new Error('Product ID is required');
    
    const wishlist = await this.getWishlist();
    return wishlist.some(item => item.productId === productId);
  }

  /**
   * Get user notifications
   */
  async getNotifications(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      unreadOnly = false,
    } = options;

    return await apiService.get('/users/notifications', {
      page,
      limit,
      unreadOnly,
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    if (!notificationId) throw new Error('Notification ID is required');
    
    return await apiService.patch(`/users/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    return await apiService.patch('/users/notifications/read-all');
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    if (!notificationId) throw new Error('Notification ID is required');
    
    return await apiService.delete(`/users/notifications/${notificationId}`);
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    return await apiService.get('/users/notification-preferences');
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    if (!preferences) throw new Error('Preferences are required');
    
    return await apiService.put('/users/notification-preferences', preferences);
  }

  /**
   * Get user settings
   */
  async getSettings() {
    return await apiService.get('/users/settings');
  }

  /**
   * Update user settings
   */
  async updateSettings(settings) {
    if (!settings) throw new Error('Settings are required');
    
    return await apiService.put('/users/settings', settings);
  }

  /**
   * Delete user account
   */
  async deleteAccount(password) {
    if (!password) throw new Error('Password is required');
    
    return await apiService.post('/users/delete-account', { password });
  }

  /**
   * Get user activity log
   */
  async getActivityLog(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      type = '',
    } = options;

    return await apiService.get('/users/activity', {
      page,
      limit,
      type,
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId = null) {
    const endpoint = userId ? `/users/${userId}/stats` : '/users/stats';
    return await apiService.get(endpoint);
  }

  /**
   * Search users (admin)
   */
  async searchUsers(query, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      role = '',
    } = options;

    return await apiService.get('/users/search', {
      q: query,
      page,
      limit,
      role,
    });
  }

  /**
   * Get all users (admin)
   */
  async getAllUsers(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      role = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const params = {
      page,
      limit,
      role,
      status,
      sortBy,
      sortOrder,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/users', params);
  }

  /**
   * Update user role (admin)
   */
  async updateUserRole(userId, role) {
    if (!userId) throw new Error('User ID is required');
    if (!role) throw new Error('Role is required');
    
    return await apiService.patch(`/users/${userId}/role`, { role });
  }

  /**
   * Update user status (admin)
   */
  async updateUserStatus(userId, status) {
    if (!userId) throw new Error('User ID is required');
    if (!status) throw new Error('Status is required');
    
    return await apiService.patch(`/users/${userId}/status`, { status });
  }

  /**
   * Ban user (admin)
   */
  async banUser(userId, reason = '') {
    if (!userId) throw new Error('User ID is required');
    
    return await apiService.post(`/users/${userId}/ban`, { reason });
  }

  /**
   * Unban user (admin)
   */
  async unbanUser(userId) {
    if (!userId) throw new Error('User ID is required');
    
    return await apiService.post(`/users/${userId}/unban`);
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId = null) {
    const endpoint = userId ? `/users/${userId}/sessions` : '/users/sessions';
    return await apiService.get(endpoint);
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId) {
    if (!sessionId) throw new Error('Session ID is required');
    
    return await apiService.delete(`/users/sessions/${sessionId}`);
  }

  /**
   * Revoke all sessions
   */
  async revokeAllSessions() {
    return await apiService.delete('/users/sessions');
  }

  /**
   * Get user security log
   */
  async getSecurityLog(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options;

    return await apiService.get('/users/security-log', {
      page,
      limit,
    });
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor() {
    return await apiService.post('/users/two-factor/enable');
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor() {
    return await apiService.post('/users/two-factor/disable');
  }

  /**
   * Verify two-factor authentication
   */
  async verifyTwoFactor(token) {
    if (!token) throw new Error('Token is required');
    
    return await apiService.post('/users/two-factor/verify', { token });
  }

  /**
   * Get two-factor backup codes
   */
  async getTwoFactorBackupCodes() {
    return await apiService.get('/users/two-factor/backup-codes');
  }

  /**
   * Generate new two-factor backup codes
   */
  async generateTwoFactorBackupCodes() {
    return await apiService.post('/users/two-factor/backup-codes');
  }

  /**
   * Export user data
   */
  async exportUserData() {
    const response = await apiService.get('/users/export-data');
    
    // Create download link for JSON
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion() {
    return await apiService.post('/users/request-data-deletion');
  }
}

// Create singleton instance
export const userService = new UserService();

export default userService;
