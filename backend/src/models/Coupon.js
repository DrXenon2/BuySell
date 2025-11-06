const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Coupon pour la gestion des codes promo
 */
class Coupon {
  constructor() {
    this.table = 'coupons';
  }

  // Créer un coupon
  async create(couponData) {
    const coupon = {
      ...couponData,
      code: couponData.code.toUpperCase(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(coupon)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(couponId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', couponId)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par code
  async findByCode(code) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un coupon
  async update(couponId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        code: updates.code ? updates.code.toUpperCase() : undefined,
        updated_at: new Date()
      })
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un coupon
  async delete(couponId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', couponId);

    if (error) throw error;
    return true;
  }

  // Rechercher des coupons
  async find(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*', { count: 'exact' });

    // Filtres
    if (query.is_active !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_active', query.is_active);
    }

    if (query.type) {
      supabaseQuery = supabaseQuery.eq('discount_type', query.type);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`code.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    // Tri
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Valider un coupon
  async validate(code, cartTotal = 0, userId = null) {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      throw new Error('Code promo invalide');
    }

    if (!coupon.is_active) {
      throw new Error('Ce code promo n\'est plus actif');
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new Error('Ce code promo n\'est pas encore valide');
    }

    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      throw new Error('Ce code promo a expiré');
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      throw new Error('Ce code promo a atteint sa limite d\'utilisation');
    }

    if (coupon.minimum_amount && cartTotal < coupon.minimum_amount) {
      throw new Error(`Le montant minimum pour ce code promo est de ${coupon.minimum_amount}€`);
    }

    if (coupon.maximum_amount && cartTotal > coupon.maximum_amount) {
      throw new Error(`Le montant maximum pour ce code promo est de ${coupon.maximum_amount}€`);
    }

    if (userId && coupon.single_use) {
      const hasUsed = await this.hasUserUsedCoupon(code, userId);
      if (hasUsed) {
        throw new Error('Vous avez déjà utilisé ce code promo');
      }
    }

    return coupon;
  }

  // Vérifier si un utilisateur a déjà utilisé un coupon
  async hasUserUsedCoupon(code, userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', userId)
      .eq('coupon_code', code.toUpperCase())
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  }

  // Appliquer un coupon
  async apply(code, cartTotal, userId = null) {
    const coupon = await this.validate(code, cartTotal, userId);

    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
      
      // Limiter le montant maximum si spécifié
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    // S'assurer que la réduction ne dépasse pas le total du panier
    discountAmount = Math.min(discountAmount, cartTotal);

    return {
      coupon,
      discount_amount: discountAmount,
      final_amount: cartTotal - discountAmount
    };
  }

  // Incrémenter le compteur d'utilisation
  async incrementUsage(code) {
    const { data, error } = await supabase.rpc('increment_coupon_usage', {
      coupon_code: code.toUpperCase()
    });

    if (error) throw error;
    return data;
  }

  // Générer un code promo unique
  async generateUniqueCode(length = 8, prefix = '') {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = prefix;
      for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existing = await this.findByCode(code);
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer un code unique');
      }
    } while (existing);

    return code;
  }

  // Statistiques d'utilisation
  async getUsageStats(couponId) {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('coupon_code', couponId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stats = {
      total_orders: data.length,
      total_revenue: data.reduce((sum, order) => sum + order.total_amount, 0),
      average_order_value: data.length > 0 ? data.reduce((sum, order) => sum + order.total_amount, 0) / data.length : 0,
      usage_by_month: {}
    };

    // Regrouper par mois
    data.forEach(order => {
      const month = new Date(order.created_at).toISOString().substring(0, 7);
      if (!stats.usage_by_month[month]) {
        stats.usage_by_month[month] = 0;
      }
      stats.usage_by_month[month]++;
    });

    return stats;
  }
}

module.exports = new Coupon();
