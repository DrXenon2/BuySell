const Joi = require('joi');

const productValidation = {
  create: Joi.object({
    name: Joi.string().max(255).required().trim()
      .messages({
        'any.required': 'Le nom du produit est requis',
        'string.max': 'Le nom ne doit pas dépasser 255 caractères',
        'string.empty': 'Le nom ne peut pas être vide'
      }),
    description: Joi.string().max(10000).required().trim()
      .messages({
        'any.required': 'La description est requise',
        'string.max': 'La description ne doit pas dépasser 10000 caractères',
        'string.empty': 'La description ne peut pas être vide'
      }),
    short_description: Joi.string().max(500).optional().allow('').trim(),
    price: Joi.number().min(0).precision(2).required()
      .messages({
        'any.required': 'Le prix est requis',
        'number.min': 'Le prix ne peut pas être négatif',
        'number.precision': 'Le prix doit avoir au maximum 2 décimales'
      }),
    compare_price: Joi.number().min(0).precision(2).optional().allow(null),
    cost_price: Joi.number().min(0).precision(2).optional().allow(null),
    sku: Joi.string().max(100).optional().allow('').trim().uppercase(),
    barcode: Joi.string().max(100).optional().allow('').trim(),
    quantity: Joi.number().integer().min(0).required()
      .messages({
        'any.required': 'La quantité est requise',
        'number.min': 'La quantité ne peut pas être négative'
      }),
    category_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'La catégorie est requise',
        'string.guid': 'ID de catégorie invalide'
      }),
    brand: Joi.string().max(100).optional().allow('').trim(),
    weight: Joi.number().min(0).precision(3).optional().allow(null),
    dimensions: Joi.object({
      length: Joi.number().min(0).precision(2).optional(),
      width: Joi.number().min(0).precision(2).optional(),
      height: Joi.number().min(0).precision(2).optional(),
      unit: Joi.string().valid('cm', 'm', 'in').default('cm')
    }).optional(),
    features: Joi.array().items(Joi.string().max(200)).optional(),
    specifications: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    is_published: Joi.boolean().default(false),
    is_featured: Joi.boolean().default(false),
    meta_title: Joi.string().max(255).optional().allow('').trim(),
    meta_description: Joi.string().max(500).optional().allow('').trim()
  }),

  update: Joi.object({
    name: Joi.string().max(255).optional().trim(),
    description: Joi.string().max(10000).optional().trim(),
    short_description: Joi.string().max(500).optional().allow('').trim(),
    price: Joi.number().min(0).precision(2).optional(),
    compare_price: Joi.number().min(0).precision(2).optional().allow(null),
    cost_price: Joi.number().min(0).precision(2).optional().allow(null),
    sku: Joi.string().max(100).optional().allow('').trim().uppercase(),
    barcode: Joi.string().max(100).optional().allow('').trim(),
    quantity: Joi.number().integer().min(0).optional(),
    category_id: Joi.string().uuid().optional(),
    brand: Joi.string().max(100).optional().allow('').trim(),
    weight: Joi.number().min(0).precision(3).optional().allow(null),
    dimensions: Joi.object({
      length: Joi.number().min(0).precision(2).optional(),
      width: Joi.number().min(0).precision(2).optional(),
      height: Joi.number().min(0).precision(2).optional(),
      unit: Joi.string().valid('cm', 'm', 'in').default('cm')
    }).optional(),
    features: Joi.array().items(Joi.string().max(200)).optional(),
    specifications: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    is_published: Joi.boolean().optional(),
    is_featured: Joi.boolean().optional(),
    meta_title: Joi.string().max(255).optional().allow('').trim(),
    meta_description: Joi.string().max(500).optional().allow('').trim()
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional().allow(''),
    category: Joi.string().uuid().optional(),
    brand: Joi.string().max(100).optional().allow(''),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    in_stock: Joi.boolean().optional(),
    is_featured: Joi.boolean().optional(),
    is_published: Joi.boolean().optional(),
    sort_by: Joi.string().valid(
      'name', 'price', 'created_at', 'updated_at', 'rating', 'popularity'
    ).default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional()
  }),

  variants: Joi.object({
    name: Joi.string().max(100).required(),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().max(50).required(),
        value: Joi.string().max(100).required(),
        price_modifier: Joi.number().precision(2).optional().default(0),
        quantity: Joi.number().integer().min(0).optional().default(0)
      })
    ).min(1)
  })
};

module.exports = productValidation;
