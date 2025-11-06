/**
 * Schémas OpenAPI pour les commandes
 */

module.exports = {
  Order: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1001,
        description: 'ID unique de la commande'
      },
      orderNumber: {
        type: 'string',
        example: 'BS-2024-001-1001',
        description: 'Numéro de commande unique'
      },
      userId: {
        type: 'string',
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'ID de l\'utilisateur'
      },
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        example: 'confirmed',
        description: 'Statut de la commande'
      },
      totalAmount: {
        type: 'number',
        format: 'float',
        example: 159.98,
        description: 'Montant total de la commande'
      },
      subtotal: {
        type: 'number',
        format: 'float',
        example: 149.98,
        description: 'Sous-total avant taxes et frais'
      },
      taxAmount: {
        type: 'number',
        format: 'float',
        example: 29.99,
        description: 'Montant des taxes'
      },
      shippingCost: {
        type: 'number',
        format: 'float',
        example: 4.99,
        description: 'Frais de livraison'
      },
      discountAmount: {
        type: 'number',
        format: 'float',
        example: 10.00,
        description: 'Montant de la réduction'
      },
      paymentMethod: {
        type: 'string',
        enum: ['card', 'paypal', 'bank_transfer', 'cash'],
        example: 'card',
        description: 'Méthode de paiement'
      },
      paymentStatus: {
        type: 'string',
        enum: ['pending', 'paid', 'failed', 'refunded'],
        example: 'paid',
        description: 'Statut du paiement'
      },
      shippingMethod: {
        type: 'string',
        enum: ['standard', 'express', 'pickup'],
        example: 'standard',
        description: 'Méthode de livraison'
      },
      shippingAddress: {
        $ref: '#/components/schemas/Address'
      },
      billingAddress: {
        $ref: '#/components/schemas/Address'
      },
      items: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/OrderItem'
        }
      },
      note: {
        type: 'string',
        example: 'Livrer après 18h',
        description: 'Note pour la commande'
      },
      trackingNumber: {
        type: 'string',
        example: 'TRK123456789',
        description: 'Numéro de suivi colis'
      },
      estimatedDelivery: {
        type: 'string',
        format: 'date',
        example: '2024-01-25',
        description: 'Date de livraison estimée'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T14:30:00Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-16T09:15:00Z'
      }
    }
  },

  OrderItem: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1
      },
      productId: {
        type: 'integer',
        example: 123
      },
      productName: {
        type: 'string',
        example: 'iPhone 14 Pro Max'
      },
      productSlug: {
        type: 'string',
        example: 'iphone-14-pro-max'
      },
      productImage: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/images/iphone14.jpg'
      },
      quantity: {
        type: 'integer',
        example: 2
      },
      unitPrice: {
        type: 'number',
        format: 'float',
        example: 799.99
      },
      totalPrice: {
        type: 'number',
        format: 'float',
        example: 1599.98
      },
      options: {
        type: 'object',
        example: {
          color: 'Silver',
          storage: '256GB'
        }
      },
      sellerId: {
        type: 'string',
        example: '550e8400-e29b-41d4-a716-446655440000'
      }
    }
  },

  Address: {
    type: 'object',
    required: ['street', 'city', 'postalCode', 'country'],
    properties: {
      firstName: {
        type: 'string',
        example: 'Jean'
      },
      lastName: {
        type: 'string',
        example: 'Dupont'
      },
      street: {
        type: 'string',
        example: '123 Avenue des Champs-Élysées'
      },
      city: {
        type: 'string',
        example: 'Paris'
      },
      postalCode: {
        type: 'string',
        example: '75008'
      },
      country: {
        type: 'string',
        example: 'France'
      },
      phone: {
        type: 'string',
        example: '+33123456789'
      },
      isDefault: {
        type: 'boolean',
        example: true
      }
    }
  },

  CreateOrder: {
    type: 'object',
    required: ['shippingAddress', 'paymentMethod', 'shippingMethod', 'items'],
    properties: {
      shippingAddress: {
        $ref: '#/components/schemas/Address'
      },
      billingAddress: {
        $ref: '#/components/schemas/Address'
      },
      paymentMethod: {
        type: 'string',
        enum: ['card', 'paypal', 'bank_transfer', 'cash'],
        example: 'card'
      },
      shippingMethod: {
        type: 'string',
        enum: ['standard', 'express', 'pickup'],
        example: 'standard'
      },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity', 'price'],
          properties: {
            productId: {
              type: 'integer',
              example: 123
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
              example: 799.99
            },
            options: {
              type: 'object',
              example: {
                color: 'Silver',
                storage: '256GB'
              }
            }
          }
        }
      },
      note: {
        type: 'string',
        example: 'Livrer après 18h'
      },
      couponCode: {
        type: 'string',
        example: 'WELCOME10'
      }
    }
  },

  OrderStatusUpdate: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        example: 'shipped'
      },
      note: {
        type: 'string',
        example: 'Colis expédié avec suivi'
      },
      trackingNumber: {
        type: 'string',
        example: 'TRK123456789'
      }
    }
  },

  OrderListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          orders: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Order'
            }
          },
          pagination: {
            $ref: '#/components/schemas/Pagination'
          }
        }
      }
    }
  }
};
