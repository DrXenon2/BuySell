import { http } from './api';
import { loadStripe } from '@stripe/stripe-js';

class PaymentService {
  constructor() {
    this.stripePromise = null;
    this.initializeStripe();
  }

  // Initialiser Stripe
  initializeStripe() {
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey && !this.stripePromise) {
      this.stripePromise = loadStripe(stripeKey);
    }
  }

  // Créer une intention de paiement
  async createPaymentIntent(orderId, paymentMethod = 'card') {
    try {
      const response = await http.post('/payments/create-intent', {
        order_id: orderId,
        payment_method: paymentMethod
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Confirmer un paiement
  async confirmPayment(paymentIntentId, paymentMethodId = null) {
    try {
      const response = await http.post('/payments/confirm', {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Traiter le paiement avec Stripe
  async processStripePayment(orderId, elements, card) {
    try {
      if (!this.stripePromise) {
        throw new Error('Stripe non initialisé');
      }

      const stripe = await this.stripePromise;

      // Créer l'intention de paiement
      const intentResponse = await this.createPaymentIntent(orderId);
      
      if (!intentResponse.success) {
        throw new Error(intentResponse.message);
      }

      const { client_secret, payment_intent_id } = intentResponse.data;

      // Confirmer le paiement avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: card,
            billing_details: {
              // Les détails de facturation peuvent être ajoutés ici
            },
          },
          return_url: `${window.location.origin}/checkout/success`,
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Confirmer le paiement côté serveur
      if (paymentIntent.status === 'succeeded') {
        const confirmResponse = await this.confirmPayment(payment_intent_id);
        return confirmResponse;
      }

      return {
        success: true,
        data: { paymentIntent },
        message: 'Paiement en attente de confirmation'
      };

    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer l'historique des paiements
  async getPaymentHistory(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status
      } = filters;

      const params = {
        page,
        limit,
        ...(status && { status })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/payments/history?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer un paiement par ID
  async getPaymentById(paymentId) {
    try {
      const response = await http.get(`/payments/${paymentId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Rembourser un paiement (admin)
  async refundPayment(paymentId, amount = null, reason = '') {
    try {
      const response = await http.post(`/payments/${paymentId}/refund`, {
        amount,
        reason
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sauvegarder une méthode de paiement
  async savePaymentMethod(paymentMethodId) {
    try {
      const response = await http.post('/payments/methods', {
        payment_method_id: paymentMethodId
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les méthodes de paiement sauvegardées
  async getPaymentMethods() {
    try {
      const response = await http.get('/payments/methods');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer une méthode de paiement
  async deletePaymentMethod(methodId) {
    try {
      const response = await http.delete(`/payments/methods/${methodId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vérifier le statut d'un paiement
  async checkPaymentStatus(paymentIntentId) {
    try {
      const response = await http.get(`/payments/status/${paymentIntentId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Traiter un paiement hors ligne
  async processOfflinePayment(orderId, paymentData) {
    try {
      const response = await http.post('/payments/offline', {
        order_id: orderId,
        ...paymentData
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Payment Service Error:', error);
    
    const paymentErrors = {
      'Payment intent not found': 'Intention de paiement non trouvée',
      'Payment failed': 'Paiement échoué',
      'Insufficient funds': 'Fonds insuffisants',
      'Card declined': 'Carte refusée',
      'Invalid card': 'Carte invalide',
      'Expired card': 'Carte expirée',
    };

    const message = paymentErrors[error.message] || 
                   error.message || 
                   'Erreur lors du traitement du paiement';

    return {
      success: false,
      error: error.error || 'Payment Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new PaymentService();
