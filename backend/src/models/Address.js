const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Address pour la gestion des adresses
 */
class Address {
  constructor() {
    this.table = 'addresses';
  }

  // Créer une adresse
  async create(addressData) {
    const address = {
      ...addressData,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Si c'est l'adresse par défaut, désactiver les autres adresses par défaut
    if (addressData.is_default) {
      await this.clearDefaultAddress(addressData.user_id);
    }

    const { data, error } = await supabase
      .from(this.table)
      .insert(address)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(addressId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', addressId)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour une adresse
  async update(addressId, updates) {
    // Si on définit cette adresse comme par défaut, désactiver les autres
    if (updates.is_default) {
      const address = await this.findById(addressId);
      await this.clearDefaultAddress(address.user_id);
    }

    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer une adresse
  async delete(addressId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', addressId);

    if (error) throw error;
    return true;
  }

  // Obtenir les adresses d'un utilisateur
  async findByUserId(userId, query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.type) {
      supabaseQuery = supabaseQuery.eq('type', query.type);
    }

    if (query.is_default !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_default', query.is_default);
    }

    supabaseQuery = supabaseQuery.order('is_default', { ascending: false })
                               .order('created_at', { ascending: false });

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    return {
      data,
      total: count
    };
  }

  // Obtenir l'adresse par défaut
  async getDefaultAddress(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Définir une adresse comme par défaut
  async setDefaultAddress(addressId) {
    const address = await this.findById(addressId);
    
    // Désactiver toutes les autres adresses par défaut
    await this.clearDefaultAddress(address.user_id);

    // Définir cette adresse comme par défaut
    const { data, error } = await supabase
      .from(this.table)
      .update({
        is_default: true,
        updated_at: new Date()
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Désactiver toutes les adresses par défaut d'un utilisateur
  async clearDefaultAddress(userId) {
    const { error } = await supabase
      .from(this.table)
      .update({
        is_default: false,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) throw error;
    return true;
  }

  // Valider une adresse
  async validateAddress(addressData) {
    // Implémentation simplifiée de validation d'adresse
    const requiredFields = ['street', 'city', 'state', 'postal_code', 'country'];
    const missingFields = requiredFields.filter(field => !addressData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
    }

    // Validation du code postal (exemple pour la France)
    if (addressData.country === 'FR' && addressData.postal_code) {
      const postalCodeRegex = /^\d{5}$/;
      if (!postalCodeRegex.test(addressData.postal_code)) {
        throw new Error('Code postal français invalide');
      }
    }

    return true;
  }

  // Formater une adresse pour l'affichage
  formatAddress(address) {
    const parts = [
      address.street,
      address.street2,
      `${address.postal_code} ${address.city}`,
      address.state,
      address.country
    ].filter(part => part && part.trim());

    return parts.join(', ');
  }

  // Calculer les frais de livraison
  async calculateShipping(address, cartTotal) {
    // Implémentation simplifiée des frais de livraison
    const baseShipping = 5.00; // Frais de base
    let shippingCost = baseShipping;

    // Livraison gratuite au-dessus d'un certain montant
    if (cartTotal >= 50.00) {
      shippingCost = 0;
    }

    // Majoration pour les zones éloignées
    const remoteAreas = ['CORSE', 'OUTRE-MER'];
    if (remoteAreas.includes(address.state)) {
      shippingCost += 10.00;
    }

    return {
      cost: shippingCost,
      estimated_days: this.getEstimatedDeliveryDays(address),
      carrier: 'Colissimo'
    };
  }

  // Obtenir les jours de livraison estimés
  getEstimatedDeliveryDays(address) {
    const deliveryTimes = {
      'FR': { standard: 2, express: 1 },
      'BE': { standard: 3, express: 2 },
      'CH': { standard: 4, express: 2 },
      'default': { standard: 5, express: 3 }
    };

    const country = address.country.toUpperCase();
    const times = deliveryTimes[country] || deliveryTimes.default;
    
    return times;
  }
}

module.exports = new Address();
