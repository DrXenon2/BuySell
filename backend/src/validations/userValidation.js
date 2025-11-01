const Joi = require('joi');

const userValidation = {
  updateProfile: Joi.object({
    first_name: Joi.string().max(50).optional().trim(),
    last_name: Joi.string().max(50).optional().trim(),
    phone: Joi.string().max(20).optional().allow('').trim(),
    avatar_url: Joi.string().uri().optional().allow(''),
    bio: Joi.string().max(500).optional().allow('').trim(),
    date_of_birth: Joi.date().max('now').optional().allow(null),
    gender: Joi.string().valid('male', 'female', 'other').optional().allow('')
  }),

  updateUser: Joi.object({
    role: Joi.string().valid('customer', 'seller', 'admin').optional(),
    is_active: Joi.boolean().optional(),
    is_verified: Joi.boolean().optional(),
    email: Joi.string().email().optional().trim().lowercase()
  }),

  updatePreferences: Joi.object({
    language: Joi.string().valid('fr', 'en', 'ar').default('fr'),
    currency: Joi.string().valid('XOF', 'EUR', 'USD').default('XOF'),
    newsletter: Joi.boolean().default(false),
    marketing_emails: Joi.boolean().default(false),
    sms_notifications: Joi.boolean().default(true),
    email_notifications: Joi.boolean().default(true)
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional().allow(''),
    role: Joi.string().valid('customer', 'seller', 'admin').optional(),
    is_active: Joi.boolean().optional(),
    sort_by: Joi.string().valid('created_at', 'email', 'first_name', 'last_name').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

module.exports = userValidation;
