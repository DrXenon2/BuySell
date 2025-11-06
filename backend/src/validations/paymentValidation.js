const Joi = require('joi');

const paymentValidation = {
  createIntent: Joi.object({
    order_id: Joi.string().uuid().required()
      .messages({
        'any.required': 'L\'ID de commande est requis',
        'string.guid': 'ID de commande invalide'
      }),
    payment_method: Joi.string().valid('card', 'mobile_money', 'wallet').default('card'),
    save_payment_method: Joi.boolean().default(false),
    return_url: Joi.string().uri().optional()
  }),

  confirm: Joi.object({
    payment_intent_id: Joi.string().required()
      .messages({
        'any.required': 'L\'ID d\'intention de paiement est requis'
      }),
    payment_method_id: Joi.string().optional(),
    setup_future_usage: Joi.boolean().default(false)
  }),

  refund: Joi.object({
    amount: Joi.number().min(0).precision(2).optional(),
    reason: Joi.string().max(500).optional().allow('').trim(),
    refund_application_fee: Joi.boolean().default(false),
    reverse_transfer: Joi.boolean().default(false)
  }),

  webhook: Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    data: Joi.object({
      object: Joi.object().required()
    }).required()
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture',
      'canceled',
      'succeeded'
    ).optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional(),
    sort_by: Joi.string().valid('created_at', 'amount').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

module.exports = paymentValidation;
