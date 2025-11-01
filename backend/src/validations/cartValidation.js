const Joi = require('joi');

const cartValidation = {
  addItem: Joi.object({
    product_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'L\'ID du produit est requis',
        'string.guid': 'ID de produit invalide'
      }),
    quantity: Joi.number().integer().min(1).max(1000).required()
      .messages({
        'any.required': 'La quantité est requise',
        'number.min': 'La quantité doit être au moins 1',
        'number.max': 'La quantité ne peut pas dépasser 1000'
      }),
    variant: Joi.object({
      color: Joi.string().max(50).optional(),
      size: Joi.string().max(50).optional(),
      material: Joi.string().max(50).optional()
    }).optional()
  }),

  updateItem: Joi.object({
    quantity: Joi.number().integer().min(0).max(1000).required()
      .messages({
        'any.required': 'La quantité est requise',
        'number.min': 'La quantité ne peut pas être négative',
        'number.max': 'La quantité ne peut pas dépasser 1000'
      })
  }),

  applyCoupon: Joi.object({
    code: Joi.string().max(50).required().trim().uppercase()
      .messages({
        'any.required': 'Le code promo est requis',
        'string.empty': 'Le code promo ne peut pas être vide'
      })
  }),

  shippingMethod: Joi.object({
    shipping_method: Joi.string().max(100).required()
      .messages({
        'any.required': 'La méthode de livraison est requise'
      }),
    shipping_address_id: Joi.string().uuid().optional()
  })
};

module.exports = cartValidation;
