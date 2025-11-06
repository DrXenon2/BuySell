const Joi = require('joi');

const categoryValidation = {
  create: Joi.object({
    name: Joi.string().max(100).required().trim()
      .messages({
        'any.required': 'Le nom de la catégorie est requis',
        'string.max': 'Le nom ne doit pas dépasser 100 caractères',
        'string.empty': 'Le nom ne peut pas être vide'
      }),
    description: Joi.string().max(1000).optional().allow('').trim(),
    parent_id: Joi.string().uuid().optional().allow(null),
    image_url: Joi.string().uri().optional().allow(''),
    icon: Joi.string().max(50).optional().allow(''),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    is_active: Joi.boolean().default(true),
    meta_title: Joi.string().max(255).optional().allow('').trim(),
    meta_description: Joi.string().max(500).optional().allow('').trim(),
    sort_order: Joi.number().integer().min(0).default(0)
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional().trim(),
    description: Joi.string().max(1000).optional().allow('').trim(),
    parent_id: Joi.string().uuid().optional().allow(null),
    image_url: Joi.string().uri().optional().allow(''),
    icon: Joi.string().max(50).optional().allow(''),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    is_active: Joi.boolean().optional(),
    meta_title: Joi.string().max(255).optional().allow('').trim(),
    meta_description: Joi.string().max(500).optional().allow('').trim(),
    sort_order: Joi.number().integer().min(0).optional()
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional().allow(''),
    parent_id: Joi.string().uuid().optional().allow(''),
    is_active: Joi.boolean().optional(),
    include_products: Joi.boolean().default(false),
    sort_by: Joi.string().valid('name', 'created_at', 'sort_order').default('sort_order'),
    sort_order: Joi.string().valid('asc', 'desc').default('asc')
  })
};

module.exports = categoryValidation;
