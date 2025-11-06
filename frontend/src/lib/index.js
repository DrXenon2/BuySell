/**
 * Export centralisé de toutes les librairies
 */

// Supabase
export {
  supabase,
  storage,
  auth,
  realtime,
  database,
} from './supabase';
export { default as supabaseClient } from './supabase';

// Resend (Emails)
export {
  resend,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendContactEmail,
  EMAIL_TEMPLATES,
} from './resend';
export { default as emailService } from './resend';

// Stripe (Paiements)
export {
  getStripe,
  createPaymentIntent,
  confirmPayment,
  createSetupIntent,
  refundPayment,
  getPaymentMethods,
  detachPaymentMethod,
  SUPPORTED_CARD_BRANDS,
  cardValidation,
} from './stripe';
export { default as stripe } from './stripe';

// Validation
export {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validatePrice,
  validateStock,
  validateProductForm,
  validateAddress,
  validateFile,
  validateCoupon,
  validateDate,
  validateURL,
  sanitizeInput,
  validateSchema,
} from './validation';
export { default as validation } from './validation';

// Utilitaires
export { default as utils } from './utils';
export { default as formatters } from './formatters';
export { default as helpers } from './helpers';

// Types communs
export * from './types';

export default {
  supabase: supabaseClient,
  email: emailService,
  stripe,
  validation,
  utils,
  formatters,
  helpers,
};
