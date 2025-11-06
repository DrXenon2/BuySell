/**
 * Client Stripe pour les paiements
 */

import { loadStripe } from '@stripe/stripe-js';

// Clé publique Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialiser Stripe
let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

/**
 * Créer un intent de paiement
 */
export const createPaymentIntent = async (amount, currency = 'eur', metadata = {}) => {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convertir en cents
        currency,
        metadata,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la création du paiement');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirmer un paiement
 */
export const confirmPayment = async (paymentIntentId) => {
  try {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la confirmation du paiement');
    }

    return data.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

/**
 * Créer un setup intent pour enregistrer une carte
 */
export const createSetupIntent = async (customerId) => {
  try {
    const response = await fetch('/api/payments/setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la création du setup intent');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
};

/**
 * Rembourser un paiement
 */
export const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    const response = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : null,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors du remboursement');
    }

    return data.data;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};

/**
 * Obtenir les méthodes de paiement d'un client
 */
export const getPaymentMethods = async (customerId) => {
  try {
    const response = await fetch(`/api/payments/customers/${customerId}/payment-methods`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la récupération des méthodes de paiement');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
};

/**
 * Supprimer une méthode de paiement
 */
export const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const response = await fetch('/api/payments/detach-payment-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethodId }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la suppression de la méthode de paiement');
    }

    return data.data;
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw error;
  }
};

// Types de cartes supportées
export const SUPPORTED_CARD_BRANDS = {
  visa: 'Visa',
  mastercard: 'MasterCard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

// Validation des cartes
export const cardValidation = {
  // Valider un numéro de carte (algorithme de Luhn)
  validateCardNumber: (number) => {
    const cleaned = number.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // Valider une date d'expiration
  validateExpiry: (month, year) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;

    return true;
  },

  // Valider un CVC
  validateCVC: (cvc, cardType) => {
    const cleaned = cvc.replace(/\s+/g, '');
    
    if (!/^\d+$/.test(cleaned)) return false;

    // American Express a 4 chiffres, les autres 3
    if (cardType === 'amex') {
      return cleaned.length === 4;
    }
    
    return cleaned.length === 3;
  },
};

export default getStripe;
