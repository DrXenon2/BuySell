import { http } from './api';
import supabaseClient, { supabaseHelpers } from './supabaseClient';

class AuthService {
  // Inscription
  async register(userData) {
    try {
      const response = await http.post('/auth/register', userData);
      
      if (response.success) {
        // Connecter automatiquement après l'inscription
        await this.login({
          email: userData.email,
          password: userData.password
        });
      }
      
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Connexion
  async login(credentials) {
    try {
      // Option 1: Utiliser Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Option 2: Utiliser l'API backend traditionnelle
      // const response = await http.post('/auth/login', credentials);
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Connexion avec provider (Google, GitHub, etc.)
  async loginWithProvider(provider) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Déconnexion
  async logout() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) throw error;

      // Nettoyer le storage local
      localStorage.removeItem('cart');
      localStorage.removeItem('userPreferences');
      
      return { success: true, message: 'Déconnexion réussie' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Mot de passe oublié
  async forgotPassword(email) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Instructions envoyées par email' 
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Réinitialisation du mot de passe
  async resetPassword(newPassword) {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Mot de passe mis à jour' 
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Rafraîchissement du token
  async refreshToken() {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Vérification d'email
  async verifyEmail() {
    try {
      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: 'user@email.com',
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Email de vérification envoyé' 
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Récupérer le profil utilisateur
  async getProfile() {
    try {
      const user = await supabaseHelpers.getCurrentUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const response = await http.get('/users/profile');
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Mettre à jour le profil
  async updateProfile(profileData) {
    try {
      const response = await http.put('/users/profile', profileData);
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await http.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Gestion centralisée des erreurs d'authentification
  handleAuthError(error) {
    console.error('Auth Error:', error);

    const authErrors = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Weak password': 'Le mot de passe est trop faible',
      'Password reset required': 'Réinitialisation du mot de passe requise',
      'Network error': 'Erreur de connexion. Vérifiez votre internet.',
    };

    const message = authErrors[error.message] || 
                   error.message || 
                   'Erreur d\'authentification';

    return {
      success: false,
      error: error.error || 'Authentication Error',
      message,
      code: error.code,
      originalError: error,
    };
  }

  // Vérifier les permissions
  async checkPermission(permission) {
    try {
      const user = await supabaseHelpers.getCurrentUser();
      
      if (!user) return false;

      const response = await http.get('/auth/permissions');
      
      if (response.success) {
        return response.data.permissions.includes(permission);
      }
      
      return false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
}

export default new AuthService();
