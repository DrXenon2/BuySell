const { DataTypes } = require('sequelize');
const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle User pour l'authentification
 * Ce modèle représente les utilisateurs dans le système d'authentification Supabase
 */
class User {
  constructor() {
    this.model = null;
  }

  async initialize() {
    // Dans Supabase, la table 'auth.users' est gérée automatiquement
    // Ce modèle sert d'interface pour les opérations utilisateur
    logger.info('📦 Modèle User initialisé (Supabase Auth)');
  }

  // Méthodes pour interagir avec Supabase Auth
  async findById(userId) {
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) throw error;
    return user;
  }

  async findByEmail(email) {
    const { data: users, error } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return users;
  }

  async updateUser(userId, attributes) {
    const { data: user, error } = await supabase.auth.admin.updateUserById(
      userId,
      attributes
    );

    if (error) throw error;
    return user;
  }

  async deleteUser(userId) {
    const { data: user, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;
    return user;
  }

  // Méthodes utilitaires
  async isEmailVerified(userId) {
    const user = await this.findById(userId);
    return user.email_confirmed_at !== null;
  }

  async getRole(userId) {
    const user = await this.findById(userId);
    return user.user_metadata?.role || 'customer';
  }

  async setRole(userId, role) {
    return await this.updateUser(userId, {
      user_metadata: { role }
    });
  }
}

module.exports = new User();
