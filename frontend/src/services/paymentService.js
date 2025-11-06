/**
 * Payment service
 */

import { apiService } from './api';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

class PaymentService {
  /**
   * Create payment intent
   */
  async createPaymentIntent(amount, currency = 'xof', metadata = {}) {
    return await apiService.post('/payments/create-intent', {
      amount,
      currency,
      metadata,
    });
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    return await apiService.post('/payments/confirm', {
      paymentIntentId,
      paymentMethodId,
    });
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(paymentMethodId, amount, orderId, metadata = {}) {
    try {
      // Create payment intent
      const { clientSecret, paymentIntent } = await this.createPaymentIntent(
        amount,
        'xof',
        { ...metadata, orderId }
      );

      // Confirm payment with Stripe
      const stripe = await stripePromise;
      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethodId,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      return confirmedIntent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process mobile money payment
   */
  async processMobileMoneyPayment(provider, phoneNumber, amount, orderId) {
    return await apiService.post('/payments/mobile-money', {
      provider,
      phoneNumber,
      amount,
      orderId,
    });
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(amount, orderId, returnUrl, cancelUrl) {
    return await apiService.post('/payments/paypal', {
      amount,
      orderId,
      returnUrl,
      cancelUrl,
    });
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId) {
    return await apiService.get(`/payments/${paymentId}/verify`);
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId) {
    return await apiService.get(`/payments/${paymentId}`);
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrder(orderId) {
    return await apiService.get(`/payments/order/${orderId}`);
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount = null, reason = '') {
    return await apiService.post(`/payments/${paymentId}/refund`, {
      amount,
      reason,
    });
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(customerId = null) {
    const endpoint = customerId 
      ? `/payments/methods?customerId=${customerId}`
      : '/payments/methods';
    
    return await apiService.get(endpoint);
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(paymentMethodData) {
    return await apiService.post('/payments/methods', paymentMethodData);
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(methodId) {
    return await apiService.delete(`/payments/methods/${methodId}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId) {
    return await apiService.patch(`/payments/methods/${methodId}/default`);
  }

  /**
   * Create subscription
   */
  async createSubscription(planId, paymentMethodId, trialDays = 0) {
    return await apiService.post('/payments/subscriptions', {
      planId,
      paymentMethodId,
      trialDays,
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    return await apiService.delete(`/payments/subscriptions/${subscriptionId}`);
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    return await apiService.patch(`/payments/subscriptions/${subscriptionId}`, updates);
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    return await apiService.get(`/payments/subscriptions/${subscriptionId}`);
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId) {
    return await apiService.get(`/payments/users/${userId}/subscriptions`);
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId) {
    return await apiService.get(`/payments/invoices/${invoiceId}`);
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId) {
    const response = await apiService.get(`/payments/invoices/${invoiceId}/download`);
    
    // Create download link for PDF
    const blob = new Blob([response], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(options = {}) {
    const {
      page = 1,
      limit = 20,
      startDate = '',
      endDate = '',
      type = '',
    } = options;

    const params = {
      page,
      limit,
      startDate,
      endDate,
      type,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/payments/history', params);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(options = {}) {
    const {
      startDate = '',
      endDate = '',
      sellerId = '',
    } = options;

    const params = {
      startDate,
      endDate,
      sellerId,
    };

    // Clean undefined parameters
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return await apiService.get('/payments/stats', params);
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransferPayment(amount, orderId, bankDetails) {
    return await apiService.post('/payments/bank-transfer', {
      amount,
      orderId,
      bankDetails,
    });
  }

  /**
   * Confirm bank transfer payment
   */
  async confirmBankTransferPayment(paymentId, proofImage) {
    const formData = new FormData();
    formData.append('proofImage', proofImage);

    return await apiService.upload(`/payments/${paymentId}/confirm-transfer`, formData);
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies() {
    return await apiService.get('/payments/currencies');
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    return await apiService.post('/payments/convert', {
      amount,
      fromCurrency,
      toCurrency,
    });
  }

  /**
   * Get payment gateway status
   */
  async getGatewayStatus() {
    return await apiService.get('/payments/gateway-status');
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(payload, signature) {
    return await apiService.post('/payments/webhook', {
      payload,
      signature,
    });
  }

  /**
   * Create payment link
   */
  async createPaymentLink(amount, description, metadata = {}) {
    return await apiService.post('/payments/payment-links', {
      amount,
      description,
      metadata,
    });
  }

  /**
   * Get payment link
   */
  async getPaymentLink(linkId) {
    return await apiService.get(`/payments/payment-links/${linkId}`);
  }

  /**
   * Disable payment link
   */
  async disablePaymentLink(linkId) {
    return await apiService.patch(`/payments/payment-links/${linkId}/disable`);
  }
}

// Create singleton instance
export const paymentService = new PaymentService();

export default paymentService;
