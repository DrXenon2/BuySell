/**
 * Schémas OpenAPI pour l'authentification
 */

module.exports = {
  UserRegister: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'utilisateur@example.com',
        description: 'Adresse email de l\'utilisateur'
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'MonMot2PasseSecure!',
        description: 'Mot de passe (min 8 caractères, majuscule, minuscule, chiffre)'
      },
      firstName: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        example: 'Jean',
        description: 'Prénom de l\'utilisateur'
      },
      lastName: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        example: 'Dupont',
        description: 'Nom de l\'utilisateur'
      },
      phone: {
        type: 'string',
        example: '+33123456789',
        description: 'Numéro de téléphone (optionnel)'
      },
      acceptTerms: {
        type: 'boolean',
        example: true,
        description: 'Acceptation des conditions d\'utilisation'
      }
    }
  },

  UserLogin: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'utilisateur@example.com'
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'MonMot2PasseSecure!'
      }
    }
  },

  AuthResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: 'Connexion réussie'
      },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '550e8400-e29b-41d4-a716-446655440000'
              },
              email: {
                type: 'string',
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
              isActive: {
                type: 'boolean',
                example: true
              },
              emailVerified: {
                type: 'boolean',
                example: false
              }
            }
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'Token JWT pour l\'accès aux API'
              },
              refreshToken: {
                type: 'string',
                description: 'Token pour rafraîchir l\'accès'
              },
              expiresIn: {
                type: 'integer',
                description: 'Durée de validité en secondes'
              }
            }
          }
        }
      }
    }
  },

  ForgotPassword: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'utilisateur@example.com'
      }
    }
  },

  ResetPassword: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: {
        type: 'string',
        description: 'Token de réinitialisation reçu par email'
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NouveauMot2PasseSecure!'
      }
    }
  }
};
