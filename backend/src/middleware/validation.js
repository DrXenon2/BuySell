const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Schémas de validation pour l'authentification
 */
const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
    first_name: Joi.string().max(50).required().messages({
      'string.max': 'Le prénom ne doit pas dépasser 50 caractères',
      'any.required': 'Le prénom est requis'
    }),
    last_name: Joi.string().max(50).required().messages({
      'string.max': 'Le nom ne doit pas dépasser 50 caractères',
      'any.required': 'Le nom est requis'
    }),
    phone: Joi.string().max(20).optional().allow(''),
    role: Joi.string().valid('customer', 'seller').default('customer')
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Le mot de passe est requis'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'L\'email est requis'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Le token est requis'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'any.required': 'Le mot de passe est requis'
    })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Le token est requis'
    })
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'L\'email est requis'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Le mot de passe actuel est requis'
    }),
    newPassword: Joi.string().min(8).required().messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      'any.required': 'Le nouveau mot de passe est requis'
    })
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().max(50).optional(),
    last_name: Joi.string().max(50).optional(),
    phone: Joi.string().max(20).optional().allow(''),
    avatar_url: Joi.string().uri().optional().allow(''),
    bio: Joi.string().max(500).optional().allow('')
  })
};

/**
 * Schémas de validation pour les utilisateurs
 */
const userValidation = {
  updateProfile: Joi.object({
    first_name: Joi.string().max(50).optional(),
    last_name: Joi.string().max(50).optional(),
    phone: Joi.string().max(20).optional().allow(''),
    avatar_url: Joi.string().uri().optional().allow(''),
    bio: Joi.string().max(500).optional().allow('')
  }),

  createAddress: Joi.object({
    type: Joi.string().valid('home', 'work', 'other').default('home'),
    street: Joi.string().max(255).required(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).required(),
    postal_code: Joi.string().max(20).required(),
    country: Joi.string().max(100).required(),
    is_default: Joi.boolean().default(false)
  }),

  updateAddress: Joi.object({
    type: Joi.string().valid('home', 'work', 'other').optional(),
    street: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    is_default: Joi.boolean().optional()
  }),

  updateUser: Joi.object({
    role: Joi.string().valid('customer', 'seller', 'admin').optional(),
    is_active: Joi.boolean().optional()
  })
};

/**
 * Schémas de validation pour les produits
 */
const productValidation = {
  create: Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().max(5000).required(),
    price: Joi.number().min(0).required(),
    compare_price: Joi.number().min(0).optional().allow(null),
    cost_price: Joi.number().min(0).optional().allow(null),
    sku: Joi.string().max(100).optional().allow(''),
    barcode: Joi.string().max(100).optional().allow(''),
    quantity: Joi.number().integer().min(0).required(),
    category_id: Joi.string().uuid().required(),
    brand: Joi.string().max(100).optional().allow(''),
    weight: Joi.number().min(0).optional().allow(null),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    specifications: Joi.object().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    is_published: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().max(255).optional(),
    description: Joi.string().max(5000).optional(),
    price: Joi.number().min(0).optional(),
    compare_price: Joi.number().min(0).optional().allow(null),
    cost_price: Joi.number().min(0).optional().allow(null),
    sku: Joi.string().max(100).optional().allow(''),
    barcode: Joi.string().max(100).optional().allow(''),
    quantity: Joi.number().integer().min(0).optional(),
    category_id: Joi.string().uuid().optional(),
    brand: Joi.string().max(100).optional().allow(''),
    weight: Joi.number().min(0).optional().allow(null),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    specifications: Joi.object().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    is_published: Joi.boolean().optional()
  })
};

/**
 * Schémas de validation pour les commandes
 */
const orderValidation = {
  create: Joi.object({
    shipping_address_id: Joi.string().uuid().required(),
    billing_address_id: Joi.string().uuid().required(),
    shipping_method: Joi.string().required(),
    payment_method: Joi.string().required(),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    ).required()
  }),

  updateShipping: Joi.object({
    tracking_number: Joi.string().max(100).optional().allow(''),
    carrier: Joi.string().max(100).optional().allow(''),
    shipped_at: Joi.date().optional()
  })
};

/**
 * Schémas de validation pour le panier
 */
const cartValidation = {
  addItem: Joi.object({
    product_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    variant: Joi.object().optional()
  }),

  updateItem: Joi.object({
    quantity: Joi.number().integer().min(0).required()
  }),

  applyCoupon: Joi.object({
    code: Joi.string().max(50).required()
  })
};

/**
 * Schémas de validation pour les avis
 */
const reviewValidation = {
  create: Joi.object({
    product_id: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(200).optional().allow(''),
    comment: Joi.string().max(2000).required(),
    images: Joi.array().items(Joi.string().uri()).optional()
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    title: Joi.string().max(200).optional().allow(''),
    comment: Joi.string().max(2000).optional(),
    images: Joi.array().items(Joi.string().uri()).optional()
  }),

  report: Joi.object({
    reason: Joi.string().max(500).required()
  })
};

/**
 * Schémas de validation pour les paiements
 */
const paymentValidation = {
  createIntent: Joi.object({
    order_id: Joi.string().uuid().required(),
    payment_method: Joi.string().valid('card', 'mobile_money').default('card'),
    save_payment_method: Joi.boolean().default(false)
  }),

  confirm: Joi.object({
    payment_intent_id: Joi.string().required(),
    payment_method_id: Joi.string().optional()
  }),

  refund: Joi.object({
    amount: Joi.number().min(0).optional(),
    reason: Joi.string().max(500).optional().allow('')
  })
};

/**
 * Middleware de validation générique
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', { errors, path: req.path });

      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        message: 'Certains champs sont invalides',
        details: errors
      });
    }

    // Remplacer les données validées
    req[property] = value;
    next();
  };
};

// Export des validateurs
const validateAuth = (method) => validate(authValidation[method]);
const validateUser = (method) => validate(userValidation[method]);
const validateProduct = (method) => validate(productValidation[method]);
const validateOrder = (method) => validate(orderValidation[method]);
const validateCart = (method) => validate(cartValidation[method]);
const validateReview = (method) => validate(reviewValidation[method]);
const validatePayment = (method) => validate(paymentValidation[method]);

module.exports = {
  validateAuth,
  validateUser,
  validateProduct,
  validateOrder,
  validateCart,
  validateReview,
  validatePayment
};
