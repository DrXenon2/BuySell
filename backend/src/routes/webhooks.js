const express = require('express');
const router = express.Router();

// Contrôleurs
const webhookController = require('../controllers/webhookController');

// Webhook Stripe
router.post('/stripe', webhookController.stripeWebhook);

// Webhook Supabase Auth
router.post('/supabase-auth', webhookController.supabaseAuthWebhook);

// Webhook de notification push
router.post('/push', webhookController.pushNotificationWebhook);

module.exports = router;
