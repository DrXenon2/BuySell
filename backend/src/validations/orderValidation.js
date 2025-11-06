const Joi = require('joi');

const orderValidation = {
  create: Joi.object({
    shipping_address_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'L\'adresse de livraison est requise',
        'string.guid': 'ID d\'adresse invalide'
      }),
    billing_address_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'L\'adresse de facturation est requise',
        'string.guid': 'ID d\'adresse invalide'
      }),
    shipping_method: Joi.string().max(100).required()
      .messages({
        'any.required': 'La méthode de livraison est requise'
      }),
    payment_method: Joi.string().valid('card', 'mobile_money', 'cash_on_delivery').required()
      .messages({
        'any.required': 'La méthode de paiement est requise',
        'any.only': 'Méthode de paiement non supportée'
      }),
    notes: Joi.string().max(1000).optional().allow('').trim(),
    use_separate_billing: Joi.boolean().default(false)
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'pending', 
      'confirmed', 
      'processing', 
      'shipped', 
      'delivered', 
      'cancelled', 
      'refunded'
    ).required()
      .messages({
        'any.required': 'Le statut est requis',
        'any.only': 'Statut invalide'
      }),
    notes: Joi.string().max(500).optional().allow('')
  }),

  updateShipping: Joi.object({
    tracking_number: Joi.string().max(100).optional().allow('').trim(),
    carrier: Joi.string().max(100).optional().allow('').trim(),
    shipped_at: Joi.date().optional(),
    estimated_delivery: Joi.date().optional()
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    ).optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional(),
    customer_id: Joi.string().uuid().optional(),
    sort_by: Joi.string().valid('created_at', 'updated_at', 'total_amount').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  sellerQueryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    ).optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional(),
    sort_by: Joi.string().valid('created_at', 'updated_at', 'total_amount').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

module.exports = orderValidation;
