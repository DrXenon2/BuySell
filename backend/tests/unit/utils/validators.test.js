/**
 * Tests unitaires pour les validateurs
 */

const {
  validateEmail,
  validatePassword,
  validateProduct,
  validateOrder
} = require('../../../src/utils/validators');

describe('Validateurs', () => {
  describe('validateEmail', () => {
    test('devrait valider un email correct', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('devrait rejeter un email incorrect', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('devrait valider un mot de passe fort', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    test('devrait rejeter un mot de passe faible', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(3);
    });

    test('devrait rejeter un mot de passe trop court', () => {
      const result = validatePassword('Ab1!');
      expect(result.isValid).toBe(false);
      expect(result.minLength).toBe(false);
    });
  });

  describe('validateProduct', () => {
    test('devrait valider un produit correct', () => {
      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10000,
        category_id: 'cat-123',
        condition: 'new',
        stock: 10
      };

      const result = validateProduct(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('devrait rejeter un produit avec prix négatif', () => {
      const product = {
        name: 'Test Product',
        price: -100,
        category_id: 'cat-123'
      };

      const result = validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.price).toBeDefined();
    });

    test('devrait rejeter un produit sans nom', () => {
      const product = {
        price: 10000,
        category_id: 'cat-123'
      };

      const result = validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('validateOrder', () => {
    test('devrait valider une commande correcte', () => {
      const order = {
        items: [
          { product_id: 'prod-123', quantity: 2, price: 5000 }
        ],
        shipping_address: {
          street: '123 Test St',
          city: 'Test City',
          country: 'SN'
        },
        payment_method: 'card'
      };

      const result = validateOrder(order);
      expect(result.isValid).toBe(true);
    });

    test('devrait rejeter une commande sans articles', () => {
      const order = {
        shipping_address: {
          street: '123 Test St',
          city: 'Test City',
          country: 'SN'
        }
      };

      const result = validateOrder(order);
      expect(result.isValid).toBe(false);
      expect(result.errors.items).toBeDefined();
    });
  });
});
