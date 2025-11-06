
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class PaymentController {
  // Créer une intention de paiement
  async createPaymentIntent(req, res) {
    try {
      const userId = req.user.id;
      const { order_id, payment_method = 'card', save_payment_method = false } = req.body;

      // Validation
      if (!order_id) {
        return res.status(400).json({
          error: 'Commande manquante',
          message: 'L\'ID de la commande est requis'
        });
      }

      // Vérifier que la commande existe et appartient à l'utilisateur
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          error: 'Commande non trouvée',
          message: 'La commande spécifiée n\'existe pas'
        });
      }

      // Vérifier que la commande est en attente de paiement
      if (order.status !== 'pending') {
        return res.status(400).json({
          error: 'Commande non payable',
          message: 'Cette commande ne peut pas être payée'
        });
      }

      // Vérifier s'il y a déjà un paiement en cours
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', order_id)
        .in('status', ['requires_payment_method', 'requires_confirmation', 'processing'])
        .single();

      if (existingPayment) {
        return res.json({
          success: true,
          data: {
            payment_intent_id: existingPayment.payment_intent_id,
            client_secret: existingPayment.client_secret,
            status: existingPayment.status
          }
        });
      }

      // Créer l'intention de paiement via la fonction Supabase
      const { data: paymentIntent, error: paymentError } = await supabase.rpc('create_payment_intent', {
        order_id: order_id,
        payment_method: payment_method,
        save_payment_method: save_payment_method
      });

      if (paymentError || !paymentIntent.success) {
        throw new Error(paymentIntent?.error || 'Erreur création intention de paiement');
      }

      logger.info('Intention de paiement créée', { 
        orderId: order_id, 
        userId,
        amount: order.total_amount 
      });

      res.status(201).json({
        success: true,
        message: 'Intention de paiement créée',
        data: paymentIntent
      });

    } catch (error) {
      logger.error('Erreur contrôleur createPaymentIntent:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de l\'intention de paiement'
      });
    }
  }

  // Confirmer un paiement
  async confirmPayment(req, res) {
    try {
      const userId = req.user.id;
      const { payment_intent_id, payment_method_id } = req.body;

      if (!payment_intent_id) {
        return res.status(400).json({
          error: 'Intention de paiement manquante',
          message: 'L\'ID de l\'intention de paiement est requis'
        });
      }

      // Traiter le paiement via la fonction Supabase
      const { data: paymentResult, error: paymentError } = await supabase.rpc('process_payment', {
        payment_intent_id: payment_intent_id,
        payment_method_id: payment_method_id
      });

      if (paymentError || !paymentResult.success) {
        return res.status(400).json({
          error: 'Paiement échoué',
          message: paymentResult?.error || 'Erreur lors du traitement du paiement'
        });
      }

      // Récupérer les détails mis à jour
      const { data: payment } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            id,
            order_number,
            status,
            total_amount
          )
        `)
        .eq('payment_intent_id', payment_intent_id)
        .single();

      logger.info('Paiement traité', { 
        paymentIntentId: payment_intent_id,
        userId,
        status: paymentResult.status 
      });

      res.json({
        success: true,
        message: paymentResult.status === 'succeeded' ? 
          'Paiement confirmé avec succès' : 'Paiement échoué',
        data: {
          payment,
          result: paymentResult
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur confirmPayment:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la confirmation du paiement'
      });
    }
  }

  // Obtenir l'historique des paiements
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_number,
            total_amount,
            status
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: payments, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getPaymentHistory:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'historique des paiements'
      });
    }
  }

  // Obtenir les détails d'un paiement
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            *,
            order_items (
              *,
              products (
                id,
                name,
                slug,
                images
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Paiement non trouvé',
            message: 'Le paiement demandé n\'existe pas'
          });
        }
        throw error;
      }

      // Vérifier les permissions
      if (payment.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous n\'avez pas accès à ce paiement'
        });
      }

      res.json({
        success: true,
        data: { payment }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getPaymentById:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du paiement'
      });
    }
  }

  // Rembourser un paiement
  async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      // Vérifier que le paiement existe
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single();

      if (!payment) {
        return res.status(404).json({
          error: 'Paiement non trouvé',
          message: 'Le paiement demandé n\'existe pas'
        });
      }

      // Vérifier que le paiement peut être remboursé
      if (payment.status !== 'succeeded') {
        return res.status(400).json({
          error: 'Paiement non remboursable',
          message: 'Seuls les paiements réussis peuvent être remboursés'
        });
      }

      const refundAmount = amount || payment.amount;

      // Effectuer le remboursement via la fonction Supabase
      const { data: refundResult, error: refundError } = await supabase.rpc('process_refund', {
        payment_id: id,
        refund_amount: refundAmount,
        refund_reason: reason
      });

      if (refundError || !refundResult.success) {
        return res.status(400).json({
          error: 'Remboursement échoué',
          message: refundResult?.error || 'Erreur lors du remboursement'
        });
      }

      logger.info('Paiement remboursé', { 
        paymentId: id,
        amount: refundAmount,
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Remboursement effectué avec succès',
        data: { refund: refundResult }
      });

    } catch (error) {
      logger.error('Erreur contrôleur refundPayment:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du remboursement'
      });
    }
  }
}

module.exports = new PaymentController();
