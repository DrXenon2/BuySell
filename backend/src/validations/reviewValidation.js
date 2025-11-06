const Joi = require('joi');

const reviewValidation = {
  create: Joi.object({
    product_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'L\'ID du produit est requis',
        'string.guid': 'ID de produit invalide'
      }),
    order_id: Joi.string().uuid().optional(),
    rating: Joi.number().integer().min(1).max(5).required()
      .messages({
        'any.required': 'La note est requise',
        'number.min': 'La note doit être au moins 1',
        'number.max': 'La note ne peut pas dépasser 5'
      }),
    title: Joi.string().max(200).optional().allow('').trim(),
    comment: Joi.string().max(2000).required().trim()
      .messages({
        'any.required': 'Le commentaire est requis',
        'string.max': 'Le commentaire ne doit pas dépasser 2000 caractères',
        'string.empty': 'Le commentaire ne peut pas être vide'
      }),
    images: Joi.array().items(
      Joi.string().uri().max(500)
    ).max(5).optional(),
    is_anonymous: Joi.boolean().default(false)
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    title: Joi.string().max(200).optional().allow('').trim(),
    comment: Joi.string().max(2000).optional().trim(),
    images: Joi.array().items(
      Joi.string().uri().max(500)
    ).max(5).optional(),
    is_anonymous: Joi.boolean().optional()
  }),

  report: Joi.object({
    reason: Joi.string().max(500).required().trim()
      .messages({
        'any.required': 'La raison du signalement est requise',
        'string.max': 'La raison ne doit pas dépasser 500 caractères',
        'string.empty': 'La raison ne peut pas être vide'
      }),
    details: Joi.string().max(1000).optional().allow('').trim()
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    rating: Joi.number().integer().min(1).max(5).optional(),
    sort_by: Joi.string().valid('created_at', 'rating', 'helpful_count').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
    with_images: Joi.boolean().default(false)
  })
};

module.exports = reviewValidation;
