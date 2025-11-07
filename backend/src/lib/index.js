/**
 * Librairies et services partagés
 */

const supabase = require('./supabase');
const validation = require('./validation');
const emailService = require('./email-service');
const storageService = require('./storage-service');
const paymentService = require('./payment-service');
const notificationService = require('./notification-service');

module.exports = {
  // Base de données
  supabase,
  
  // Validation
  validation,
  
  // Services
  emailService,
  storageService,
  paymentService,
  notificationService,
  
  // Utilitaires
  logger: require('./logger'),
  formatters: require('./formatters'),
  helpers: require('./helpers')
};
