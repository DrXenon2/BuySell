/**
 * Utilitaires de validation
 */

const Joi = require('joi');

const validation = {
  // Validation d'email
  validateEmail: (email) => {
    const schema = Joi.string().email().required();
    const { error } = schema.validate(email);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null
    };
  },

  // Validation de mot de passe
  validatePassword: (password) => {
    const schema = Joi.string()
      .min(8)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.max': 'Le mot de passe ne peut pas dépasser 100 caractères'
      });

    const { error } = schema.validate(password);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null
    };
  },

  // Validation de téléphone
  validatePhone: (phone) => {
    const schema = Joi.string()
      .pattern(/^(\+225|225)?[0-9]{8,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide'
      });

    const { error } = schema.validate(phone);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null
    };
  },

  // Validation de produit
  validateProduct: (productData) => {
    const schema = Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().min(10).max(2000).required(),
      price: Joi.number().min(0).required(),
      category_id: Joi.string().uuid().required(),
      condition: Joi.string().valid('new', 'used', 'refurbished').required(),
      stock: Joi.number().integer().min(0).default(0),
      images: Joi.array().items(Joi.string().uri()).max(8),
      specifications: Joi.object().pattern(Joi.string(), Joi.any())
    });

    const { error, value } = schema.validate(productData);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value
    };
  },

  // Validation d'adresse
  validateAddress: (addressData) => {
    const schema = Joi.object({
      full_name: Joi.string().min(2).max(100).required(),
      phone: Joi.string().required(),
      street: Joi.string().min(5).max(200).required(),
      city: Joi.string().min(2).max(100).required(),
      state: Joi.string().min(2).max(100).required(),
      country: Joi.string().min(2).max(100).required(),
      postal_code: Joi.string().max(20),
      is_default: Joi.boolean().default(false)
    });

    const { error, value } = schema.validate(addressData);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value
    };
  },

  // Validation de commande
  validateOrder: (orderData) => {
    const schema = Joi.object({
      items: Joi.array().items(
        Joi.object({
          product_id: Joi.string().uuid().required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required()
        })
      ).min(1).required(),
      shipping_address_id: Joi.string().uuid().required(),
      billing_address_id: Joi.string().uuid().required(),
      payment_method: Joi.string().valid('card', 'mobile_money', 'wave', 'orange_money', 'mtn_money').required(),
      shipping_method: Joi.string().valid('standard', 'express', 'pickup').required()
    });

    const { error, value } = schema.validate(orderData);
    return {
      isValid: !error,
      error: error ? error.details[0].message : null,
      value
    };
  }
};

module.exports = validation;
