/**
 * Schémas OpenAPI pour les produits
 */

module.exports = {
  Product: {
    type: 'object',
    required: ['name', 'description', 'price', 'stockQuantity', 'categoryId'],
    properties: {
      id: {
        type: 'integer',
        example: 1,
        description: 'ID unique du produit'
      },
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'iPhone 14 Pro Max',
        description: 'Nom du produit'
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 2000,
        example: 'Smartphone Apple iPhone 14 Pro Max 256Go avec écran Super Retina XDR'
      },
      price: {
        type: 'number',
        format: 'float',
        minimum: 0.01,
        example: 1459.99,
        description: 'Prix du produit en EUR'
      },
      salePrice: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 1399.99,
        description: 'Prix soldé (optionnel)'
      },
      stockQuantity: {
        type: 'integer',
        minimum: 0,
        example: 50,
        description: 'Quantité disponible en stock'
      },
      categoryId: {
        type: 'integer',
        example: 5,
        description: 'ID de la catégorie'
      },
      sellerId: {
        type: 'string',
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'ID du vendeur'
      },
      sku: {
        type: 'string',
        example: 'IPH14PM256-SILVER',
        description: 'SKU unique du produit'
      },
      brand: {
        type: 'string',
        example: 'Apple',
        description: 'Marque du produit'
      },
      weight: {
        type: 'number',
        format: 'float',
        example: 0.240,
        description: 'Poids en kg'
      },
      dimensions: {
        type: 'object',
        properties: {
          length: { type: 'number', example: 16.07 },
          width: { type: 'number', example: 7.81 },
          height: { type: 'number', example: 0.78 }
        }
      },
      images: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uri'
        },
        example: [
          'https://example.com/images/iphone14-1.jpg',
          'https://example.com/images/iphone14-2.jpg'
        ]
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        example: ['smartphone', 'apple', '5g', 'faceid']
      },
      specifications: {
        type: 'object',
        additionalProperties: true,
        example: {
          'Écran': '6.7 pouces Super Retina XDR',
          'Processeur': 'A16 Bionic',
          'RAM': '6GB',
          'Stockage': '256GB',
          'Caméra': '48MP + 12MP + 12MP'
        }
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Produit actif/inactif'
      },
      isFeatured: {
        type: 'boolean',
        example: false,
        description: 'Produit en vedette'
      },
      isOnSale: {
        type: 'boolean',
        example: true,
        description: 'Produit en solde'
      },
      lowStockThreshold: {
        type: 'integer',
        example: 10,
        description: 'Seuil d\'alerte stock bas'
      },
      rating: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 5,
        example: 4.5,
        description: 'Note moyenne'
      },
      reviewCount: {
        type: 'integer',
        example: 125,
        description: 'Nombre d\'avis'
      },
      viewCount: {
        type: 'integer',
        example: 1500,
        description: 'Nombre de vues'
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

  ProductCreate: {
    type: 'object',
    required: ['name', 'description', 'price', 'stockQuantity', 'categoryId'],
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'iPhone 14 Pro Max'
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 2000,
        example: 'Smartphone Apple iPhone 14 Pro Max 256Go...'
      },
      price: {
        type: 'number',
        format: 'float',
        minimum: 0.01,
        example: 1459.99
      },
      salePrice: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 1399.99
      },
      stockQuantity: {
        type: 'integer',
        minimum: 0,
        example: 50
      },
      categoryId: {
        type: 'integer',
        example: 5
      },
      sku: {
        type: 'string',
        example: 'IPH14PM256-SILVER'
      },
      brand: {
        type: 'string',
        example: 'Apple'
      },
      weight: {
        type: 'number',
        format: 'float',
        example: 0.240
      },
      dimensions: {
        type: 'object',
        properties: {
          length: { type: 'number', example: 16.07 },
          width: { type: 'number', example: 7.81 },
          height: { type: 'number', example: 0.78 }
        }
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        example: ['smartphone', 'apple', '5g']
      },
      specifications: {
        type: 'object',
        additionalProperties: true,
        example: {
          'Écran': '6.7 pouces Super Retina XDR',
          'Processeur': 'A16 Bionic'
        }
      },
      isFeatured: {
        type: 'boolean',
        example: false
      },
      isOnSale: {
        type: 'boolean',
        example: true
      },
      lowStockThreshold: {
        type: 'integer',
        example: 10
      }
    }
  },

  ProductUpdate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'iPhone 14 Pro Max (Mise à jour)'
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 2000
      },
      price: {
        type: 'number',
        format: 'float',
        minimum: 0.01,
        example: 1399.99
      },
      salePrice: {
        type: 'number',
        format: 'float',
        minimum: 0
      },
      stockQuantity: {
        type: 'integer',
        minimum: 0,
        example: 25
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      isFeatured: {
        type: 'boolean',
        example: true
      },
      isOnSale: {
        type: 'boolean',
        example: false
      }
    }
  },

  ProductListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Product'
            }
          },
          pagination: {
            $ref: '#/components/schemas/Pagination'
          },
          filters: {
            type: 'object',
            properties: {
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    count: { type: 'integer' }
                  }
                }
              },
              priceRange: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }
};
