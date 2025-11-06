/**
 * Documentation principale de l'API BuySell Platform
 * Point d'entrée pour la documentation Swagger/OpenAPI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../../config');

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuySell Platform API',
      version: '1.0.0',
      description: `
# 🛍️ BuySell Platform - Documentation API

Bienvenue dans la documentation de l'API BuySell Platform, une marketplace complète avec système de vente entre particuliers et professionnels.

## 📋 Aperçu

Cette API RESTful permet de gérer :
- **Authentification** et gestion des utilisateurs
- **Catalogue de produits** avec catégories
- **Système de panier** et commandes
- **Paiements sécurisés** via Stripe
- **Avis et notations** des produits
- **Tableaux de bord** vendeurs et administrateurs
- **Analytics** et rapports

## 🔐 Authentification

La plupart des endpoints nécessitent une authentification JWT. Incluez le token dans le header :
\`\`\`
Authorization: Bearer <votre_token_jwt>
\`\`\`

## 🚀 Démarrage rapide

1. **Inscription** : \`POST /api/auth/register\`
2. **Connexion** : \`POST /api/auth/login\`
3. **Explorer les produits** : \`GET /api/products\`
4. **Créer une commande** : \`POST /api/orders\`

## 📞 Support

- Email : ${config.app.supportEmail}
- Documentation : ${config.app.backendUrl}/api/docs
- Statut API : ${config.app.backendUrl}/health
      `,
      contact: {
        name: 'Support API',
        email: config.app.supportEmail,
        url: config.app.backendUrl
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `${config.app.backendUrl}/api`,
        description: 'Serveur de production'
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Serveur de développement local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT dans le format: Bearer <token>'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Non authentifié',
                message: 'Token d\'authentification manquant'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Données invalides',
                message: 'Veuillez corriger les erreurs de validation',
                errors: [
                  {
                    field: 'email',
                    message: 'Email invalide',
                    value: 'invalid-email'
                  }
                ]
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Non trouvé',
                message: 'La ressource demandée n\'existe pas'
              }
            }
          }
        }
      },
      schemas: {
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
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion des utilisateurs'
      },
      {
        name: 'Users',
        description: 'Gestion des profils utilisateurs'
      },
      {
        name: 'Products',
        description: 'Gestion du catalogue produits'
      },
      {
        name: 'Categories',
        description: 'Gestion des catégories'
      },
      {
        name: 'Orders',
        description: 'Gestion des commandes'
      },
      {
        name: 'Cart',
        description: 'Gestion du panier'
      },
      {
        name: 'Payments',
        description: 'Gestion des paiements'
      },
      {
        name: 'Reviews',
        description: 'Gestion des avis et notations'
      },
      {
        name: 'Uploads',
        description: 'Upload de fichiers'
      },
      {
        name: 'Admin',
        description: 'Administration du système'
      },
      {
        name: 'Analytics',
        description: 'Statistiques et analytics'
      },
      {
        name: 'Webhooks',
        description: 'Webhooks externes'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/docs/schemas/*.js',
    './src/docs/endpoints/*.js'
  ]
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware pour servir la documentation
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BuySell Platform API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions
};
