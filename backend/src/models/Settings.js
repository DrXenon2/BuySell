const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Settings pour la gestion des paramètres
 */
class Settings {
  constructor() {
    this.table = 'settings';
    this.cache = new Map();
  }

  // Obtenir un paramètre
  async get(key, defaultValue = null) {
    // Vérifier le cache d'abord
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const { data, error } = await supabase
      .from(this.table)
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Retourner la valeur par défaut si le paramètre n'existe pas
        return defaultValue;
      }
      throw error;
    }

    // Parser la valeur (stockée en JSON)
    let value;
    try {
      value = JSON.parse(data.value);
    } catch {
      value = data.value;
    }

    // Mettre en cache
    this.cache.set(key, value);

    return value;
  }

  // Définir un paramètre
  async set(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const { data, error } = await supabase
      .from(this.table)
      .upsert({
        key,
        value: stringValue,
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le cache
    this.cache.set(key, value);

    logger.info('Paramètre mis à jour', { key, value });
    return data;
  }

  // Obtenir plusieurs paramètres
  async getMultiple(keys) {
    const { data, error } = await supabase
      .from(this.table)
      .select('key, value')
      .in('key', keys);

    if (error) throw error;

    const result = {};
    keys.forEach(key => {
      const setting = data.find(s => s.key === key);
      if (setting) {
        try {
          result[key] = JSON.parse(setting.value);
        } catch {
          result[key] = setting.value;
        }
      } else {
        result[key] = null;
      }
    });

    return result;
  }

  // Obtenir tous les paramètres
  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('key, value, description, category')
      .order('category')
      .order('key');

    if (error) throw error;

    const settings = {};
    data.forEach(setting => {
      try {
        settings[setting.key] = JSON.parse(setting.value);
      } catch {
        settings[setting.key] = setting.value;
      }
    });

    return settings;
  }

  // Paramètres de l'application
  async getAppSettings() {
    return await this.getMultiple([
      'app_name',
      'app_url',
      'support_email',
      'contact_email',
      'default_currency',
      'default_language',
      'timezone',
      'maintenance_mode'
    ]);
  }

  // Paramètres de paiement
  async getPaymentSettings() {
    return await this.getMultiple([
      'stripe_enabled',
      'stripe_test_mode',
      'paypal_enabled',
      'cash_on_delivery_enabled',
      'mobile_money_enabled',
      'default_payment_method'
    ]);
  }

  // Paramètres de livraison
  async getShippingSettings() {
    return await this.getMultiple([
      'free_shipping_threshold',
      'shipping_cost',
      'shipping_methods',
      'delivery_days',
      'international_shipping'
    ]);
  }

  // Paramètres de taxes
  async getTaxSettings() {
    return await this.getMultiple([
      'tax_enabled',
      'tax_rate',
      'tax_inclusive',
      'eu_vat_enabled'
    ]);
  }

  // Paramètres de commission
  async getCommissionSettings() {
    return await this.getMultiple([
      'commission_rate',
      'commission_type',
      'minimum_payout',
      'payout_schedule'
    ]);
  }

  // Paramètres d'email
  async getEmailSettings() {
    return await this.getMultiple([
      'smtp_host',
      'smtp_port',
      'smtp_username',
      'smtp_password',
      'from_email',
      'from_name',
      'email_verification_required'
    ]);
  }

  // Paramètres de notification
  async getNotificationSettings() {
    return await this.getMultiple([
      'notify_new_orders',
      'notify_low_stock',
      'notify_new_reviews',
      'email_notifications',
      'push_notifications',
      'sms_notifications'
    ]);
  }

  // Paramètres SEO
  async getSeoSettings() {
    return await this.getMultiple([
      'meta_title',
      'meta_description',
      'meta_keywords',
      'google_analytics_id',
      'facebook_pixel_id'
    ]);
  }

  // Paramètres sociaux
  async getSocialSettings() {
    return await this.getMultiple([
      'facebook_url',
      'twitter_url',
      'instagram_url',
      'youtube_url',
      'linkedin_url'
    ]);
  }

  // Vider le cache
  clearCache() {
    this.cache.clear();
    logger.info('Cache des paramètres vidé');
  }

  // Réinitialiser les paramètres par défaut
  async resetToDefaults() {
    const defaultSettings = {
      // Application
      'app_name': 'BuySell Platform',
      'app_url': 'http://localhost:3000',
      'support_email': 'support@buysell.com',
      'contact_email': 'contact@buysell.com',
      'default_currency': 'EUR',
      'default_language': 'fr',
      'timezone': 'Europe/Paris',
      'maintenance_mode': false,

      // Paiement
      'stripe_enabled': true,
      'stripe_test_mode': true,
      'paypal_enabled': false,
      'cash_on_delivery_enabled': true,
      'mobile_money_enabled': true,
      'default_payment_method': 'card',

      // Livraison
      'free_shipping_threshold': 50.00,
      'shipping_cost': 5.00,
      'shipping_methods': JSON.stringify(['standard', 'express']),
      'delivery_days': 3,
      'international_shipping': false,

      // Taxes
      'tax_enabled': true,
      'tax_rate': 20.0,
      'tax_inclusive': false,
      'eu_vat_enabled': false,

      // Commission
      'commission_rate': 5.0,
      'commission_type': 'percentage',
      'minimum_payout': 50.00,
      'payout_schedule': 'monthly',

      // Notification
      'notify_new_orders': true,
      'notify_low_stock': true,
      'notify_new_reviews': true,
      'email_notifications': true,
      'push_notifications': true,
      'sms_notifications': false
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await this.set(key, value);
    }

    logger.info('Paramètres réinitialisés aux valeurs par défaut');
    return true;
  }

  // Exporter les paramètres
  async exportSettings() {
    const settings = await this.getAll();
    return {
      export_date: new Date().toISOString(),
      version: '1.0',
      settings: settings
    };
  }

  // Importer les paramètres
  async importSettings(settingsData) {
    if (!settingsData.settings || typeof settingsData.settings !== 'object') {
      throw new Error('Format de données invalide');
    }

    for (const [key, value] of Object.entries(settingsData.settings)) {
      await this.set(key, value);
    }

    logger.info('Paramètres importés avec succès');
    return true;
  }
}

module.exports = new Settings();
