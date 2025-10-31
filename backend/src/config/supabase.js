const { createClient } = require('@supabase/supabase-js');
const config = require('./index');
const logger = require('../utils/logger');

class SupabaseClient {
  constructor() {
    this.client = null;
    this.adminClient = null;
    this.init();
  }

  init() {
    try {
      // Client public (anon key)
      this.client = createClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },
          db: {
            schema: 'public',
          },
          global: {
            headers: {
              'X-Client-Info': 'buysell-backend',
            },
          },
        }
      );

      // Client admin (service role key - pour les opérations sensibles)
      if (config.supabase.serviceRoleKey) {
        this.adminClient = createClient(
          config.supabase.url,
          config.supabase.serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
      }

      logger.info('✅ Client Supabase initialisé');

      // Test de connexion
      this.testConnection();

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const { data, error } = await this.client.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      logger.info('✅ Connexion Supabase établie avec succès');
    } catch (error) {
      logger.error('❌ Erreur de connexion Supabase:', error);
      throw error;
    }
  }

  // Getters pour les clients
  getClient() {
    return this.client;
  }

  getAdminClient() {
    if (!this.adminClient) {
      throw new Error('Client admin Supabase non configuré');
    }
    return this.adminClient;
  }

  // Méthodes d'authentification
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            role: userData.role || 'customer',
          },
          emailRedirectTo: `${config.app.frontendUrl}/auth/callback`,
        },
      });

      if (error) throw error;

      logger.info('👤 Nouvel utilisateur inscrit:', { email, userId: data.user.id });
      return data;

    } catch (error) {
      logger.error('❌ Erreur d\'inscription:', error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('🔑 Utilisateur connecté:', { email, userId: data.user.id });
      return data;

    } catch (error) {
      logger.error('❌ Erreur de connexion:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;

      logger.info('🚪 Utilisateur déconnecté');
      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur de déconnexion:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.app.frontendUrl}/auth/reset-password`,
      });

      if (error) throw error;

      logger.info('📧 Email de réinitialisation envoyé:', { email });
      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur d\'envoi d\'email de réinitialisation:', error);
      throw error;
    }
  }

  async updatePassword(newPassword) {
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      logger.info('🔐 Mot de passe mis à jour');
      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur de mise à jour du mot de passe:', error);
      throw error;
    }
  }

  // Méthodes pour gérer les sessions
  async getSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) throw error;
      return session;

    } catch (error) {
      logger.error('❌ Erreur de récupération de session:', error);
      throw error;
    }
  }

  async refreshSession() {
    try {
      const { data: { session }, error } = await this.client.auth.refreshSession();
      
      if (error) throw error;
      return session;

    } catch (error) {
      logger.error('❌ Erreur de rafraîchissement de session:', error);
      throw error;
    }
  }

  // Méthodes pour les opérations admin (utilisant le service role)
  async createUser(email, password, userData = {}) {
    try {
      const { data, error } = await this.getAdminClient().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userData,
      });

      if (error) throw error;

      logger.info('👤 Utilisateur créé par admin:', { email, userId: data.user.id });
      return data;

    } catch (error) {
      logger.error('❌ Erreur de création d\'utilisateur par admin:', error);
      throw error;
    }
  }

  async updateUser(userId, attributes) {
    try {
      const { data, error } = await this.getAdminClient().auth.admin.updateUserById(
        userId,
        attributes
      );

      if (error) throw error;

      logger.info('👤 Utilisateur mis à jour par admin:', { userId });
      return data;

    } catch (error) {
      logger.error('❌ Erreur de mise à jour d\'utilisateur par admin:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const { data, error } = await this.getAdminClient().auth.admin.deleteUser(userId);

      if (error) throw error;

      logger.info('👤 Utilisateur supprimé par admin:', { userId });
      return data;

    } catch (error) {
      logger.error('❌ Erreur de suppression d\'utilisateur par admin:', error);
      throw error;
    }
  }

  // Méthodes pour les appels RPC (Remote Procedure Calls)
  async rpc(functionName, params = {}) {
    try {
      const { data, error } = await this.client.rpc(functionName, params);

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error(`❌ Erreur RPC ${functionName}:`, error);
      throw error;
    }
  }

  // Méthodes utilitaires pour les opérations courantes
  async from(table) {
    return this.client.from(table);
  }

  // Gestion des erreurs Supabase
  handleError(error) {
    const supabaseError = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    };

    logger.error('❌ Erreur Supabase:', supabaseError);
    return supabaseError;
  }
}

// Instance singleton
const supabase = new SupabaseClient();

module.exports = supabase;
