const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle OrderItem pour les éléments de commande
 */
class OrderItem {
  constructor() {
    this.table = 'order_items';
  }

  // Créer un élément de commande
  async create(orderItemData) {
    const orderItem = {
      ...orderItemData,
      created_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(orderItem)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Créer plusieurs éléments de commande
  async createMultiple(orderId, items) {
    const orderItems = items.map(item => ({
      order_id: orderId,
      ...item,
      created_at: new Date()
    }));

    const { data, error } = await supabase
      .from(this.table)
      .insert(orderItems)
      .select(`
        *,
        product:products(*)
      `);

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(itemId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product:products(*),
        order:orders(*)
      `)
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver les éléments d'une commande
  async findByOrder(orderId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          price,
          images,
          seller_id
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Mettre à jour un élément
  async update(itemId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', itemId)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un élément
  async delete(itemId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  }

  // Calculer le total des éléments d'une commande
  async calculateOrderTotal(orderId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('unit_price, quantity, discount')
      .eq('order_id', orderId);

    if (error) throw error;

    const total = data.reduce((sum, item) => {
      const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);
      return sum + itemTotal;
    }, 0);

    return total;
  }

  // Obtenir les éléments par vendeur
  async findBySeller(sellerId, query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        product:products(*),
        order:orders(*)
      `, { count: 'exact' })
      .eq('product.seller_id', sellerId);

    // Filtres
    if (query.order_status) {
      supabaseQuery = supabaseQuery.eq('order.status', query.order_status);
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('created_at', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('created_at', query.date_to);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

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
}

module.exports = new OrderItem();
