/**
 * Export centralisé de tous les schémas
 */

const authSchemas = require('./auth');
const productSchemas = require('./products');
const orderSchemas = require('./orders');

module.exports = {
  ...authSchemas,
  ...productSchemas,
  ...orderSchemas,
  
  // Schémas communs supplémentaires
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'utilisateur@example.com'
      },
      firstName: {
        type: 'string',
        example: 'Jean'
      },
      lastName: {
        type: 'string',
        example: 'Dupont'
      },
      role: {
        type: 'string',
        enum: ['customer', 'seller', 'admin'],
        example: 'customer'
      },
      avatar: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/avatars/user123.jpg'
      },
      phone: {
        type: 'string',
        example: '+33123456789'
      },
      dateOfBirth: {
        type: 'string',
        format: 'date',
        example: '1990-01-15'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      emailVerified: {
        type: 'boolean',
        example: true
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T14:25:00Z'
      }
    }
  },

  Category: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1
      },
      name: {
        type: 'string',
        example: 'Électronique'
      },
      description: {
        type: 'string',
        example: 'Appareils électroniques et gadgets'
      },
      slug: {
        type: 'string',
        example: 'electronique'
      },
      parentId: {
        type: 'integer',
        example: null
      },
      image: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/categories/electronics.jpg'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      productCount: {
        type: 'integer',
        example: 150
      },
      children: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Category'
        }
      }
    }
  },

  Error: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        description: 'Type d\'erreur'
      },
      message: {
        type: 'string',
        description: 'Message d\'erreur détaillé'
      },
      errors: {
        type: 'array',
        description: 'Erreurs de validation détaillées',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Champ en erreur'
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            value: {
              type: 'string',
              description: 'Valeur fournie'
            }
          }
        }
      },
      requestId: {
        type: 'string',
        description: 'ID de requête pour le debugging'
      }
    }
  },

  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        description: 'Message de succès'
      },
      data: {
        type: 'object',
        description: 'Données de réponse'
      }
    }
  },

  Pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        description: 'Page actuelle'
      },
      limit: {
        type: 'integer',
        description: 'Nombre d\'éléments par page'
      },
      total: {
        type: 'integer',
        description: 'Nombre total d\'éléments'
      },
      pages: {
        type: 'integer',
        description: 'Nombre total de pages'
      }
    }
  }
};
