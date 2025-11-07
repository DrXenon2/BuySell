/**
 * Utilitaires de validation étendus
 */

const Joi = require('joi');
const constants = require('../config/constants');

const validation = {
  // ==================== VALIDATIONS DE BASE ====================
  
  /**
   * Validation d'email
   */
  validateEmail: (email) => {
    const schema = Joi.string().email().required();
    const { error } = schema.validate(email);
    
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value: email
    };
  },

  /**
   * Validation de mot de passe
   */
  validatePassword: (password) => {
    const schema = Joi.string()
      .min(constants.LIMITS.MIN_PASSWORD_LENGTH)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
        'string.min': `Le mot de passe doit contenir au moins ${constants.LIMITS.MIN_PASSWORD_LENGTH} caractères`,
        'string.max': 'Le mot de passe ne peut pas dépasser 100 caractères'
      });

    const { error, value } = schema.validate(password);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value
    };
  },

  /**
   * Validation de téléphone
   */
  validatePhone: (phone) => {
    const schema = Joi.string()
      .pattern(/^(\+225|225)?[0-9]{8,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide. Format attendu: +225XXXXXXXX ou 225XXXXXXXX'
      });

    const { error, value } = schema.validate(phone);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value
    };
  },

  // ==================== VALIDATIONS MÉTIER ====================
  
  /**
   * Validation de produit
   */
  validateProduct: (productData) => {
    const schema = Joi.object({
      title: Joi.string()
        .min(3)
        .max(constants.LIMITS.MAX_PRODUCT_TITLE)
        .required()
        .messages({
          'string.min': 'Le titre doit contenir au moins 3 caractères',
          'string.max': `Le titre ne peut pas dépasser ${constants.LIMITS.MAX_PRODUCT_TITLE} caractères`
        }),
        
      description: Joi.string()
        .min(10)
        .max(constants.LIMITS.MAX_PRODUCT_DESCRIPTION)
        .required()
        .messages({
          'string.min': 'La description doit contenir au moins 10 caractères',
          'string.max': `La description ne peut pas dépasser ${constants.LIMITS.MAX_PRODUCT_DESCRIPTION} caractères`
        }),
        
      price: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Le prix ne peut pas être négatif'
        }),
        
      category_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'ID de catégorie invalide'
        }),
        
      condition: Joi.string()
        .valid(...Object.values(constants.PRODUCT_TYPES || {}))
        .required()
        .messages({
          'any.only': 'Condition de produit invalide'
        }),
        
      stock: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
          'number.min': 'Le stock ne peut pas être négatif'
        }),
        
      images: Joi.array()
        .items(Joi.string().uri())
        .max(constants.LIMITS.MAX_PRODUCT_IMAGES)
        .messages({
          'array.max': `Vous ne pouvez pas ajouter plus de ${constants.LIMITS.MAX_PRODUCT_IMAGES} images`
        }),
        
      specifications: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .default({}),
        
      tags: Joi.array()
        .items(Joi.string().max(50))
        .max(10)
        .default([]),
        
      is_published: Joi.boolean().default(false),
      is_featured: Joi.boolean().default(false),
    });

    const { error, value } = schema.validate(productData, { abortEarly: false });
    
    return {
      isValid: !error,
      error: error ? error.details.map(detail => detail.message) : null,
      value,
      errors: error ? error.details : null
    };
  },

  /**
   * Validation de commande
   */
  validateOrder: (orderData) => {
    const schema = Joi.object({
      items: Joi.array()
        .items(
          Joi.object({
            product_id: Joi.string().uuid().required(),
            quantity: Joi.number().integer().min(1).max(100).required(),
            price: Joi.number().min(0).required()
          })
        )
        .min(1)
        .max(constants.LIMITS.MAX_ORDER_ITEMS)
        .required()
        .messages({
          'array.min': 'La commande doit contenir au moins un article',
          'array.max': `La commande ne peut pas contenir plus de ${constants.LIMITS.MAX_ORDER_ITEMS} articles`
        }),
        
      shipping_address_id: Joi.string().uuid().required(),
      billing_address_id: Joi.string().uuid().required(),
      
      payment_method: Joi.string()
        .valid(...Object.values(constants.PAYMENT_METHODS))
        .required()
        .messages({
          'any.only': 'Méthode de paiement non supportée'
        }),
        
      shipping_method: Joi.string()
        .valid(...Object.values(constants.DELIVERY_OPTIONS))
        .required()
        .messages({
          'any.only': 'Méthode de livraison non supportée'
        }),
        
      notes: Joi.string().max(500).allow('').default(''),
      
      coupon_code: Joi.string().max(20).allow('').default(''),
    });

    const { error, value } = schema.validate(orderData, { abortEarly: false });
    
    return {
      isValid: !error,
      error: error ? error.details.map(detail => detail.message) : null,
      value,
      errors: error ? error.details : null
    };
  },

  /**
   * Validation d'adresse
   */
  validateAddress: (addressData) => {
    const schema = Joi.object({
      full_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'Le nom complet doit contenir au moins 2 caractères',
          'string.max': 'Le nom complet ne peut pas dépasser 100 caractères'
        }),
        
      phone: Joi.string()
        .required()
        .custom((value, helpers) => {
          const phoneValidation = validation.validatePhone(value);
          return phoneValidation.isValid ? value : helpers.error('any.custom');
        }, 'Validation de téléphone'),
        
      street: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
          'string.min': 'La rue doit contenir au moins 5 caractères',
          'string.max': 'La rue ne peut pas dépasser 200 caractères'
        }),
        
      city: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'La ville doit contenir au moins 2 caractères',
          'string.max': 'La ville ne peut pas dépasser 100 caractères'
        }),
        
      state: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'La région doit contenir au moins 2 caractères',
          'string.max': 'La région ne peut pas dépasser 100 caractères'
        }),
        
      country: Joi.string()
        .valid(...Object.keys(constants.COUNTRIES))
        .required()
        .messages({
          'any.only': 'Pays non supporté'
        }),
        
      postal_code: Joi.string().max(20).allow('').default(''),
      is_default: Joi.boolean().default(false),
      
      landmark: Joi.string().max(100).allow('').default(''),
      instructions: Joi.string().max(200).allow('').default(''),
    });

    const { error, value } = schema.validate(addressData, { abortEarly: false });
    
    return {
      isValid: !error,
      error: error ? error.details.map(detail => detail.message) : null,
      value,
      errors: error ? error.details : null
    };
  },

  /**
   * Validation d'avis
   */
  validateReview: (reviewData) => {
    const schema = Joi.object({
      product_id: Joi.string().uuid().required(),
      order_id: Joi.string().uuid().required(),
      
      rating: Joi.number()
        .integer()
        .min(constants.LIMITS.MIN_RATING || 1)
        .max(constants.LIMITS.MAX_RATING || 5)
        .required()
        .messages({
          'number.min': `La note doit être au moins ${constants.LIMITS.MIN_RATING || 1}`,
          'number.max': `La note ne peut pas dépasser ${constants.LIMITS.MAX_RATING || 5}`
        }),
        
      title: Joi.string()
        .max(100)
        .required()
        .messages({
          'string.max': 'Le titre ne peut pas dépasser 100 caractères'
        }),
        
      comment: Joi.string()
        .max(constants.LIMITS.MAX_REVIEW_LENGTH)
        .required()
        .messages({
          'string.max': `Le commentaire ne peut pas dépasser ${constants.LIMITS.MAX_REVIEW_LENGTH} caractères`
        }),
        
      images: Joi.array()
        .items(Joi.string().uri())
        .max(3)
        .default([]),
    });

    const { error, value } = schema.validate(reviewData, { abortEarly: false });
    
    return {
      isValid: !error,
      error: error ? error.details.map(detail => detail.message) : null,
      value,
      errors: error ? error.details : null
    };
  },

  // ==================== UTILITAIRES ====================
  
  /**
   * Valide un objet avec un schéma Joi personnalisé
   */
  validateWithSchema: (data, schema) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    
    return {
      isValid: !error,
      error: error ? error.details.map(detail => detail.message) : null,
      value,
      errors: error ? error.details : null
    };
  },

  /**
   * Nettoie et valide les données d'entrée
   */
  sanitizeAndValidate: (data, schema) => {
    // Nettoyage basique
    const sanitized = JSON.parse(JSON.stringify(data));
    
    return validation.validateWithSchema(sanitized, schema);
  },

  /**
   * Valide un ID UUID
   */
  validateUUID: (id) => {
    const schema = Joi.string().uuid().required();
    const { error } = schema.validate(id);
    
    return {
      isValid: !error,
      error: error ? 'ID invalide' : null
    };
  },
};

module.exports = validation;
