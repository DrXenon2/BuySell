const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modèle Payment pour la gestion des paiements
 */
class Payment {
  constructor() {
    this.table = 'payments';
  }

  // Créer un paiement
  async create(paymentData) {
    const payment = {
      ...paymentData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(payment)
      .select(`
        *,
        order:orders(*),
        user:profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par ID
  async findById(paymentId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        order:orders(*),
        user:profiles(*)
      `)
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  // Trouver par intention de paiement Stripe
  async findByPaymentIntent(paymentIntentId) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        order:orders(*),
        user:profiles(*)
      `)
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un paiement
  async update(paymentId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', paymentId)
      .select(`
        *,
        order:orders(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour le statut
  async updateStatus(paymentId, status, metadata = {}) {
    const updateData = {
      status,
      updated_at: new Date(),
      ...metadata
    };

    // Dates spécifiques selon le statut
    if (status === 'succeeded') {
      updateData.processed_at = new Date();
    } else if (status === 'failed') {
      updateData.failed_at = new Date();
    } else if (status === 'refunded') {
      updateData.refunded_at = new Date();
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Historique des paiements d'un utilisateur
  async findByUserId(userId, query = {}) {
    let supabaseQuery = supabase
      .from(this.table)
      .select(`
        *,
        order:orders(
          order_number,
          total_amount,
          status
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Filtres
    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('created_at', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('created_at', query.date_to);
    }

    // Tri
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? true : false;

    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
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

  // Traiter un remboursement
  async refund(paymentId, refundData = {}) {
    const payment = await this.findById(paymentId);

    if (payment.status !== 'succeeded') {
      throw new Error('Seuls les paiements réussis peuvent être remboursés');
    }

    const refundAmount = refundData.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error('Le montant du remboursement ne peut pas dépasser le montant original');
    }

    // Mettre à jour le statut du paiement
    const updatedPayment = await this.updateStatus(paymentId, 'refunded', {
      refund_amount: refundAmount,
      refund_reason: refundData.reason,
      refund_processed_at: new Date()
    });

    // Mettre à jour le statut de la commande
    const orderModel = require('./Order');
    await orderModel.updateStatus(payment.order_id, 'refunded');

    logger.info('Paiement remboursé', {
      paymentId,
      amount: refundAmount,
      orderId: payment.order_id
    });

    return updatedPayment;
  }

  // Créer une intention de paiement
  async createPaymentIntent(orderId, paymentMethod = 'card') {
    const orderModel = require('./Order');
    const order = await orderModel.findById(orderId);

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    if (order.status !== 'pending') {
      throw new Error('La commande ne peut pas être payée');
    }

    // Vérifier s'il y a déjà un paiement en cours
    const existingPayment = await this.findByOrderId(orderId, ['requires_payment_method', 'requires_confirmation', 'processing']);
    
    if (existingPayment) {
      return existingPayment;
    }

    // Créer l'intention de paiement via Stripe (implémentation simplifiée)
    const paymentIntent = {
      order_id: orderId,
      user_id: order.customer_id,
      amount: order.total_amount,
      currency: 'eur',
      payment_method: paymentMethod,
      status: 'requires_payment_method',
      payment_intent_id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(paymentIntent)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Confirmer un paiement
  async confirmPayment(paymentIntentId, paymentMethodId = null) {
    const payment = await this.findByPaymentIntent(paymentIntentId);

    if (!payment) {
      throw new Error('Intention de paiement non trouvée');
    }

    // Simuler le traitement du paiement
    // En production, cette logique interagirait avec Stripe
    const isSuccess = Math.random() > 0.1; // 90% de succès pour la démo

    if (isSuccess) {
      await this.updateStatus(payment.id, 'succeeded', {
        payment_method_id: paymentMethodId,
        processed_at: new Date()
      });

      // Mettre à jour la commande
      const orderModel = require('./Order');
      await orderModel.updateStatus(payment.order_id, 'confirmed');

      logger.info('Paiement confirmé avec succès', {
        paymentId: payment.id,
        orderId: payment.order_id
      });
    } else {
      await this.updateStatus(payment.id, 'failed', {
        failure_message: 'Échec du traitement du paiement'
      });

      logger.error('Échec du paiement', {
        paymentId: payment.id,
        orderId: payment.order_id
      });
    }

    return await this.findById(payment.id);
  }

  // Trouver par ID de commande
  async findByOrderId(orderId, statuses = []) {
    let supabaseQuery = supabase
      .from(this.table)
      .select('*')
      .eq('order_id', orderId);

    if (statuses.length > 0) {
      supabaseQuery = supabaseQuery.in('status', statuses);
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
                               .limit(1);

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data[0] || null;
  }

  // Statistiques des paiements
  async getStats(period = 'month') {
    const { data, error } = await supabase.rpc('get_payment_stats', {
      stats_period: period
    });

    if (error) throw error;
    return data;
  }
}

module.exports = new Payment();
