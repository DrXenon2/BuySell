/**
 * Schémas OpenAPI pour les utilisateurs
 */

module.exports = {
  UserProfile: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      avatar: { type: 'string', format: 'uri' },
      phone: { type: 'string' },
      dateOfBirth: { type: 'string', format: 'date' },
      role: { type: 'string', enum: ['customer', 'seller', 'admin'] }
    }
  },
  
  UserUpdate: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 2, maxLength: 50 },
      lastName: { type: 'string', minLength: 2, maxLength: 50 },
      phone: { type: 'string' },
      dateOfBirth: { type: 'string', format: 'date' },
      avatar: { type: 'string', format: 'uri' }
    }
  }
};
