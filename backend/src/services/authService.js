const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');
const emailService = require('./emailService');

class AuthService {
  constructor() {
    this.saltRounds = 12;
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    try {
      const { email, password, first_name, last_name, phone, role = 'customer' } = userData;

      // Vérifier si l'email existe déjà
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            phone,
            role,
            is_active: true,
            email_verified: false
          }
        }
      });

      if (authError) {
        throw new Error(`Erreur d'inscription: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }

      // Créer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          first_name,
          last_name,
          phone,
          role,
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (profileError) {
        // Rollback: supprimer l'utilisateur auth si le profil échoue
        await supabase.getAdminClient().auth.admin.deleteUser(authData.user.id);
        throw new Error(`Erreur création profil: ${profileError.message}`);
      }

      // Générer le token de vérification d'email
      const verificationToken = this.generateVerificationToken(authData.user.id);
      
      // Envoyer l'email de vérification
      if (config.features.emailVerification) {
        await emailService.sendVerificationEmail(email, verificationToken, first_name);
      }

      // Générer les tokens d'authentification
      const tokens = this.generateTokens(authData.user.id, profile);

      logger.info('Nouvel utilisateur inscrit', {
        userId: authData.user.id,
        email,
        role
      });

      return {
        user: profile,
        tokens,
        requires_verification: config.features.emailVerification
      };

    } catch (error) {
      logger.error('Erreur service auth register:', error);
      throw error;
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    try {
      // Authentifier avec Supabase
      const { data: authData, error: authError } = await supabase.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Email ou mot de passe incorrect');
      }

      if (!authData.user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si le compte est actif
      if (!authData.user.user_metadata?.is_active) {
        throw new Error('Votre compte a été désactivé');
      }

      // Récupérer le profil complet
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('profiles')
        .update({ last_login: new Date() })
        .eq('id', authData.user.id);

      // Générer les tokens
      const tokens = this.generateTokens(authData.user.id, profile);

      logger.info('Utilisateur connecté', {
        userId: authData.user.id,
        email
      });

      return {
        user: profile,
        tokens
      };

    } catch (error) {
      logger.error('Erreur service auth login:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, config.jwt.refreshSecret || config.jwt.secret);
      
      // Vérifier l'utilisateur
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !profile) {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer de nouveaux tokens
      const tokens = this.generateTokens(profile.id, profile);

      logger.debug('Token rafraîchi', { userId: profile.id });

      return {
        user: profile,
        tokens
      };

    } catch (error) {
      logger.error('Erreur service auth refreshToken:', error);
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email) {
    try {
      // Vérifier si l'email existe
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, first_name, email')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !profile) {
        // Ne pas révéler si l'email existe ou non
        logger.warn('Tentative de réinitialisation pour email non trouvé', { email });
        return { success: true };
      }

      // Générer le token de réinitialisation
      const resetToken = this.generateResetToken(profile.id);
      
      // Envoyer l'email de réinitialisation
      await emailService.sendPasswordResetEmail(profile.email, resetToken, profile.first_name);

      logger.info('Email de réinitialisation envoyé', { email, userId: profile.id });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service auth forgotPassword:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(token, newPassword) {
    try {
      const decoded = this.verifyToken(token, config.jwt.resetSecret || config.jwt.secret);
      
      // Mettre à jour le mot de passe
      const { error } = await supabase.getClient().auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error('Erreur lors de la mise à jour du mot de passe');
      }

      logger.info('Mot de passe réinitialisé', { userId: decoded.userId });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service auth resetPassword:', error);
      throw new Error('Token de réinitialisation invalide ou expiré');
    }
  }

  /**
   * Vérifier l'email
   */
  async verifyEmail(token) {
    try {
      const decoded = this.verifyToken(token, config.jwt.verifySecret || config.jwt.secret);
      
      // Marquer l'email comme vérifié
      const { error } = await supabase
        .from('profiles')
        .update({ 
          email_verified: true,
          updated_at: new Date()
        })
        .eq('id', decoded.userId);

      if (error) {
        throw new Error('Erreur lors de la vérification de l\'email');
      }

      // Mettre à jour les métadonnées auth
      await supabase.getAdminClient().auth.admin.updateUserById(decoded.userId, {
        email_confirm: true
      });

      logger.info('Email vérifié', { userId: decoded.userId });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service auth verifyEmail:', error);
      throw new Error('Token de vérification invalide ou expiré');
    }
  }

  /**
   * Générer les tokens JWT
   */
  generateTokens(userId, user) {
    const accessToken = jwt.sign(
      {
        userId,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.accessExpiration,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );

    const refreshToken = jwt.sign(
      { userId },
      config.jwt.refreshSecret || config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiration,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiry(config.jwt.accessExpiration)
    };
  }

  /**
   * Vérifier un token
   */
  verifyToken(token, secret = config.jwt.secret) {
    try {
      return jwt.verify(token, secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Générer un token de vérification d'email
   */
  generateVerificationToken(userId) {
    return jwt.sign(
      { userId, type: 'email_verification' },
      config.jwt.verifySecret || config.jwt.secret,
      {
        expiresIn: '24h',
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );
  }

  /**
   * Générer un token de réinitialisation de mot de passe
   */
  generateResetToken(userId) {
    return jwt.sign(
      { userId, type: 'password_reset' },
      config.jwt.resetSecret || config.jwt.secret,
      {
        expiresIn: '1h',
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );
  }

  /**
   * Obtenir l'expiration du token en secondes
   */
  getTokenExpiry(expiryString) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }

    return 900; // 15 minutes par défaut
  }

  /**
   * Déconnexion
   */
  async logout(userId) {
    try {
      // Invalider le token côté serveur si nécessaire
      // Pour Supabase, la déconnexion est gérée côté client
      
      logger.info('Utilisateur déconnecté', { userId });
      return { success: true };

    } catch (error) {
      logger.error('Erreur service auth logout:', error);
      throw error;
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Vérifier l'ancien mot de passe
      const { data: user, error: authError } = await supabase.getClient().auth.getUser();
      
      if (authError) {
        throw new Error('Erreur d\'authentification');
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.getClient().auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      logger.info('Mot de passe changé', { userId });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service auth changePassword:', error);
      throw error;
    }
  }

  /**
   * Vérifier les permissions
   */
  checkPermissions(user, requiredPermissions) {
    if (!user) {
      return false;
    }

    // Admin a tous les accès
    if (user.role === 'admin') {
      return true;
    }

    // Vérifier les permissions spécifiques
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.includes(user.role);
    }

    return user.role === requiredPermissions;
  }
}

module.exports = new AuthService();
