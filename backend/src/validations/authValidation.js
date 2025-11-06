const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().trim().lowercase()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis',
        'string.empty': 'L\'email ne peut pas être vide'
      }),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.max': 'Le mot de passe ne doit pas dépasser 128 caractères',
        'any.required': 'Le mot de passe est requis',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Les mots de passe ne correspondent pas',
        'any.required': 'La confirmation du mot de passe est requise'
      }),
    first_name: Joi.string().max(50).required().trim()
      .messages({
        'string.max': 'Le prénom ne doit pas dépasser 50 caractères',
        'any.required': 'Le prénom est requis',
        'string.empty': 'Le prénom ne peut pas être vide'
      }),
    last_name: Joi.string().max(50).required().trim()
      .messages({
        'string.max': 'Le nom ne doit pas dépasser 50 caractères',
        'any.required': 'Le nom est requis',
        'string.empty': 'Le nom ne peut pas être vide'
      }),
    phone: Joi.string().max(20).optional().allow('').trim()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide'
      }),
    role: Joi.string().valid('customer', 'seller').default('customer'),
    accept_terms: Joi.boolean().valid(true).required()
      .messages({
        'any.only': 'Vous devez accepter les conditions d\'utilisation'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required().trim().lowercase()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Le mot de passe est requis'
      }),
    remember_me: Joi.boolean().default(false)
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().trim().lowercase()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Le token de réinitialisation est requis'
      }),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.max': 'Le mot de passe ne doit pas dépasser 128 caractères',
        'any.required': 'Le nouveau mot de passe est requis',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Les mots de passe ne correspondent pas',
        'any.required': 'La confirmation du mot de passe est requise'
      })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Le token de vérification est requis'
      })
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().required().trim().lowercase()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis'
      })
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required()
      .messages({
        'any.required': 'Le mot de passe actuel est requis'
      }),
    new_password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        'string.max': 'Le nouveau mot de passe ne doit pas dépasser 128 caractères',
        'any.required': 'Le nouveau mot de passe est requis',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    new_password_confirmation: Joi.string().valid(Joi.ref('new_password')).required()
      .messages({
        'any.only': 'Les nouveaux mots de passe ne correspondent pas',
        'any.required': 'La confirmation du nouveau mot de passe est requise'
      })
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().max(50).optional().trim()
      .messages({
        'string.max': 'Le prénom ne doit pas dépasser 50 caractères'
      }),
    last_name: Joi.string().max(50).optional().trim()
      .messages({
        'string.max': 'Le nom ne doit pas dépasser 50 caractères'
      }),
    phone: Joi.string().max(20).optional().allow('').trim()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide'
      }),
    avatar_url: Joi.string().uri().optional().allow('')
      .messages({
        'string.uri': 'URL d\'avatar invalide'
      }),
    bio: Joi.string().max(500).optional().allow('').trim()
      .messages({
        'string.max': 'La bio ne doit pas dépasser 500 caractères'
      }),
    date_of_birth: Joi.date().max('now').optional().allow(null)
      .messages({
        'date.max': 'La date de naissance ne peut pas être dans le futur'
      }),
    gender: Joi.string().valid('male', 'female', 'other').optional().allow('')
  })
};

module.exports = authValidation;
