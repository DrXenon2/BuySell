const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Order pour la gestion des commandes
 */
class Order {
  constructor() {
    this.table = 'orders';
  }

  // Créer une commande
  async create(orderData) {
    const order = {
      ...orderData,
      order_number: await this.generateOrderNumber(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(order)
      .select(`
        *,
        shipping_address:addresses(*),
        billing_address:addresses(*),
        items:order_items(*),
        payment:payments(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(orderId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        shipping_address:addresses(*),
        billing_address:addresses(*),
        items:order_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            images
          )
        ),
        payment:payments(*),
        customer:profiles(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par numéro de commande
  async findByOrderNumber(orderNumber) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        shipping_address:addresses(*),
        billing_address:addresses(*),
        items:order_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            images
          )
        ),
        payment:payments(*),
        customer:profiles(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour une commande
  async update(orderId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', orderId)
      .select(`
        *,
        shipping_address:addresses(*),
        billing_address:addresses(*),
        items:order_items(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour le statut
  async updateStatus(orderId, status, notes = '') {
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (notes) {
      updateData.status_notes = notes;
    }

    // Dates spécifiques selon le statut
    if (status === 'paid') {
      updateData.paid_at = new Date();
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Annuler une commande
  async cancel(orderId, reason = '') {
    return await this.updateStatus(orderId, 'cancelled', reason);
  }

  // Rechercher des commandes
  async find(query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        shipping_address:addresses(*),
        billing_address:addresses(*),
        items:order_items(*),
        payment:payments(*),
        customer:profiles(*)
      `, { count: 'exact' });

    // Filtres
    if (query.customer_id) {
      supabaseQuery = supabaseQuery.eq('customer_id', query.customer_id);
    }

    if (query.seller_id) {
      // Pour les vendeurs, filtrer par les produits de leur commande
      // Cette logique serait implémentée via une fonction RPC
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('created_at', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('created_at', query.date_to);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`order_number.ilike.%${query.search}%,customer_email.ilike.%${query.search}%`);
    }

    // Tri
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? true : false;

    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder });

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

  // Commandes d'un vendeur
  async findBySeller(sellerId, query = {}) {
    const { data, error } = await supabase.rpc('get_seller_orders', {
      seller_id: sellerId,
      p_status: query.status,
      p_date_from: query.date_from,
      p_date_to: query.date_to,
      p_page: query.page || 1,
      p_limit: query.limit || 20
    });

    if (error) throw error;
    return data;
  }

  // Générer un numéro de commande unique
  async generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // Calculer les statistiques des commandes
  async getStats(userId, period = 'month') {
    const { data, error } = await supabase.rpc('get_order_stats', {
      user_id: userId,
      stats_period: period
    });

    if (error) throw error;
    return data;
  }

  // Obtenir le suivi de commande
  async getTracking(orderId) {
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Ajouter un événement de suivi
  async addTrackingEvent(orderId, status, description, location = '') {
    const { data, error } = await supabase
      .from('order_tracking')
      .insert({
        order_id: orderId,
        status,
        description,
        location,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new Order();
