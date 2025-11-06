/**
 * Tests unitaires pour le service des paiements
 */

const paymentService = require('../../../src/services/paymentService');
const stripe = require('../../../src/config/stripe');
const supabase = require('../../../src/config/supabase');

jest.mock('../../../src/config/stripe');
jest.mock('../../../src/config/supabase');

describe('Service des paiements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    test('devrait créer un intent de paiement Stripe', async () => {
      const paymentData = {
        amount: 25000,
        currency: 'xof',
        order_id: 'order-123',
        user_id: 'user-123'
      };

      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 25000,
        currency: 'xof',
        status: 'requires_payment_method'
      };

      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            ...paymentData,
            payment_intent_id: 'pi_123',
            status: 'pending'
          },
          error: null
        })
      });

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(result.success).toBe(true);
      expect(result.data.client_secret).toBe('secret_123');
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 25000,
        currency: 'xof',
        metadata: {
          order_id: 'order-123',
          user_id: 'user-123'
        }
      });
    });

    test('devrait échouer si le montant est invalide', async () => {
      const paymentData = {
        amount: 0,
        currency: 'xof',
        order_id: 'order-123'
      };

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Montant invalide');
    });
  });

  describe('confirmPayment', () => {
    test('devrait confirmer un paiement réussi', async () => {
      const paymentIntentId = 'pi_123';
      const mockPaymentIntent = {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 25000,
        metadata: { order_id: 'order-123' }
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            status: 'completed',
            order_id: 'order-123'
          },
          error: null
        })
      });

      // Mock pour mettre à jour la commande
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'order-123', status: 'confirmed' },
          error: null
        })
      });

      const result = await paymentService.confirmPayment(paymentIntentId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
    });

    test('devrait gérer un paiement échoué', async () => {
      const paymentIntentId = 'pi_123';
      const mockPaymentIntent = {
        id: paymentIntentId,
        status: 'failed',
        last_payment_error: { message: 'Card declined' }
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            status: 'failed',
            error_message: 'Card declined'
          },
          error: null
        })
      });

      const result = await paymentService.confirmPayment(paymentIntentId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('failed');
    });
  });

  describe('processMobileMoneyPayment', () => {
    test('devrait traiter un paiement mobile money', async () => {
      const paymentData = {
        provider: 'orange_money',
        phone_number: '+221701234567',
        amount: 15000,
        order_id: 'order-123',
        user_id: 'user-123'
      };

      // Mock pour la création du paiement
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            ...paymentData,
            status: 'pending'
          },
          error: null
        })
      });

      // Mock pour l'appel à l'API mobile money
      const mockMobileMoneyResponse = {
        transaction_id: 'txn_123',
        status: 'pending'
      };

      // Simuler l'appel API externe
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMobileMoneyResponse)
      });
      global.fetch = mockFetch;

      const result = await paymentService.processMobileMoneyPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('pending');
      expect(mockFetch).toHaveBeenCalled();

      // Nettoyer le mock
      delete global.fetch;
    });

    test('devrait échouer avec un fournisseur non supporté', async () => {
      const paymentData = {
        provider: 'unsupported_provider',
        phone_number: '+221701234567',
        amount: 15000
      };

      const result = await paymentService.processMobileMoneyPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Fournisseur non supporté');
    });
  });

  describe('refundPayment', () => {
    test('devrait effectuer un remboursement', async () => {
      const paymentId = 'payment-123';
      const refundData = {
        amount: 10000,
        reason: 'customer_request'
      };

      const mockRefund = {
        id: 're_123',
        amount: 10000,
        status: 'succeeded'
      };

      stripe.refunds.create.mockResolvedValue(mockRefund);

      // Mock pour récupérer le paiement
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            payment_intent_id: 'pi_123',
            amount: 25000,
            status: 'completed'
          },
          error: null
        })
      });

      // Mock pour créer l'enregistrement de remboursement
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'refund-123',
            payment_id: 'payment-123',
            amount: 10000,
            status: 'completed'
          },
          error: null
        })
      });

      const result = await paymentService.refundPayment(paymentId, refundData);

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(10000);
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 10000,
        reason: 'customer_request'
      });
    });

    test('ne devrait pas rembourser un paiement déjà remboursé', async () => {
      const paymentId = 'payment-123';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'payment-123',
            status: 'refunded'
          },
          error: null
        })
      });

      const result = await paymentService.refundPayment(paymentId, { amount: 10000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('déjà remboursé');
    });
  });

  describe('getPaymentMethods', () => {
    test('devrait retourner les méthodes de paiement d\'un utilisateur', async () => {
      const userId = 'user-123';
      const mockPaymentMethods = [
        {
          id: 'pm_123',
          type: 'card',
          card: { last4: '4242', brand: 'visa' }
        },
        {
          id: 'pm_456',
          type: 'orange_money',
          orange_money: { phone: '+221701234567' }
        }
      ];

      // Mock Stripe pour les cartes
      stripe.paymentMethods.list.mockResolvedValue({
        data: [mockPaymentMethods[0]]
      });

      // Mock Supabase pour mobile money
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockPaymentMethods[1]],
          error: null
        })
      });

      const result = await paymentService.getPaymentMethods(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(stripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: userId,
        type: 'card'
      });
    });
  });

  describe('validatePaymentData', () => {
    test('devrait valider les données de paiement carte', () => {
      const cardData = {
        type: 'card',
        card_number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      };

      const result = paymentService.validatePaymentData(cardData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('devrait rejeter une carte expirée', () => {
      const cardData = {
        type: 'card',
        card_number: '4242424242424242',
        exp_month: 1,
        exp_year: 2020, // Date passée
        cvc: '123'
      };

      const result = paymentService.validatePaymentData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors.exp_year).toBeDefined();
    });

    test('devrait valider les données mobile money', () => {
      const mobileData = {
        type: 'orange_money',
        phone_number: '+221701234567'
      };

      const result = paymentService.validatePaymentData(mobileData);

      expect(result.isValid).toBe(true);
    });

    test('devrait rejeter un numéro de téléphone invalide', () => {
      const mobileData = {
        type: 'orange_money',
        phone_number: 'invalid-phone'
      };

      const result = paymentService.validatePaymentData(mobileData);

      expect(result.isValid).toBe(false);
      expect(result.errors.phone_number).toBeDefined();
    });
  });
});
