/**
 * Authentication service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';
import { STORAGE_KEYS, ROUTES } from '../utils/constants';
import { setToStorage, removeFromStorage, getFromStorage } from '../utils/localStorage';

class AuthService {
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      // Try Supabase auth first
      const { user, session } = await supabaseService.signIn(email, password);
      
      if (user && session) {
        this.setAuthData(user, session.access_token);
        return { user, session };
      }
    } catch (supabaseError) {
      // Fallback to traditional API auth
      console.log('Supabase auth failed, trying traditional API...');
      
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      if (response.user && response.token) {
        this.setAuthData(response.user, response.token);
        return response;
      }
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      // Try Supabase auth first
      const { user, session } = await supabaseService.signUp(
        userData.email, 
        userData.password,
        {
          full_name: userData.fullName,
          phone: userData.phone,
        }
      );

      if (user && session) {
        this.setAuthData(user, session.access_token);
        return { user, session };
      }
    } catch (supabaseError) {
      // Fallback to traditional API auth
      console.log('Supabase registration failed, trying traditional API...');
      
      const response = await apiService.post('/auth/register', userData);

      if (response.user && response.token) {
        this.setAuthData(response.user, response.token);
        return response;
      }
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Clear Supabase session
      await supabaseService.signOut();
    } catch (error) {
      console.log('Supabase logout failed:', error);
    }

    try {
      // Clear traditional API session
      await apiService.post('/auth/logout');
    } catch (error) {
      console.log('Traditional API logout failed:', error);
    }

    // Clear local storage
    this.clearAuthData();
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    // Check Supabase first
    try {
      const user = await supabaseService.getCurrentUser();
      if (user) return user;
    } catch (error) {
      console.log('Supabase getCurrentUser failed:', error);
    }

    // Fallback to traditional API
    try {
      const userData = getFromStorage(STORAGE_KEYS.USER_DATA);
      if (userData) return userData;

      const response = await apiService.get('/auth/me');
      if (response.user) {
        setToStorage(STORAGE_KEYS.USER_DATA, response.user);
        return response.user;
      }
    } catch (error) {
      console.log('Traditional API getCurrentUser failed:', error);
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role) {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles) {
    const user = await this.getCurrentUser();
    return roles.includes(user?.role);
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      // Try Supabase first
      await supabaseService.resetPassword(email);
      return { success: true, message: 'Email de réinitialisation envoyé' };
    } catch (supabaseError) {
      // Fallback to traditional API
      await apiService.post('/auth/forgot-password', { email });
      return { success: true, message: 'Email de réinitialisation envoyé' };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      // Try Supabase first
      await supabaseService.updatePassword(newPassword);
      return { success: true, message: 'Mot de passe réinitialisé avec succès' };
    } catch (supabaseError) {
      // Fallback to traditional API
      await apiService.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return { success: true, message: 'Mot de passe réinitialisé avec succès' };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      // Try Supabase first
      const { user } = await supabaseService.updateProfile(profileData);
      if (user) {
        this.setAuthData(user, apiService.getToken());
        return user;
      }
    } catch (supabaseError) {
      // Fallback to traditional API
      const response = await apiService.put('/auth/profile', profileData);
      if (response.user) {
        this.setAuthData(response.user, response.token || apiService.getToken());
        return response.user;
      }
    }
  }

  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh');
      if (response.token) {
        apiService.setToken(response.token);
        return response.token;
      }
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Set authentication data in storage
   */
  setAuthData(user, token) {
    apiService.setToken(token);
    setToStorage(STORAGE_KEYS.USER_DATA, user);
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    apiService.removeToken();
    removeFromStorage(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Get stored user data
   */
  getStoredUser() {
    return getFromStorage(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Social login
   */
  async socialLogin(provider) {
    const { data, error } = await supabaseService.signInWithProvider(provider, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const response = await apiService.post('/auth/verify-email', { token });
    return response;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const response = await apiService.post('/auth/resend-verification', { email });
    return response;
  }
}

// Create singleton instance
export const authService = new AuthService();

export default authService;
