// Export centralisé de tous les services
const authService = require('./authService');
const emailService = require('./emailService');
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');
const storageService = require('./storageService');
const analyticsService = require('./analyticsService');
const cacheService = require('./cacheService');
const supabaseService = require('./supabaseService');
const reportService = require('./reportService');
const imageService = require('./imageService');
const validationService = require('./validationService');

module.exports = {
  authService,
  emailService,
  paymentService,
  notificationService,
  storageService,
  analyticsService,
  cacheService,
  supabaseService,
  reportService,
  imageService,
  validationService
};
