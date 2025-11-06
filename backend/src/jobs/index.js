const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config');

// Import des jobs
const emailJobs = require('./emailJobs');
const cleanupJobs = require('./cleanupJobs');
const reportJobs = require('./reportJobs');
const notificationJobs = require('./notificationJobs');
const backupJobs = require('./backupJobs');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialise tous les jobs planifiés
   */
  initialize() {
    if (this.isRunning) {
      logger.warn('⚠️ Le planificateur de jobs est déjà en cours d\'exécution');
      return;
    }

    logger.info('🕒 Initialisation des jobs planifiés...');

    try {
      // Jobs de nettoyage - Exécution quotidienne à 2h00
      this.scheduleJob('cleanup', '0 2 * * *', () => {
        logger.info('🧹 Début du job de nettoyage quotidien');
        cleanupJobs.dailyCleanup();
      });

      // Backup de la base de données - Tous les jours à 1h00
      this.scheduleJob('backup', '0 1 * * *', () => {
        logger.info('💾 Début du job de backup quotidien');
        backupJobs.dailyBackup();
      });

      // Rapports quotidiens - À 6h00
      this.scheduleJob('daily-reports', '0 6 * * *', () => {
        logger.info('📊 Début du job de rapports quotidiens');
        reportJobs.generateDailyReports();
      });

      // Notifications de panier abandonné - Toutes les heures
      this.scheduleJob('abandoned-cart', '0 * * * *', () => {
        logger.info('🛒 Début du job de notifications panier abandonné');
        notificationJobs.sendAbandonedCartNotifications();
      });

      // Vérification des stocks bas - Toutes les 30 minutes
      this.scheduleJob('low-stock', '*/30 * * * *', () => {
        logger.info('📦 Début du job de vérification des stocks');
        notificationJobs.checkLowStock();
      });

      // Nettoyage des tokens expirés - Toutes les 6 heures
      this.scheduleJob('token-cleanup', '0 */6 * * *', () => {
        logger.info('🔐 Début du job de nettoyage des tokens');
        cleanupJobs.cleanupExpiredTokens();
      });

      // Statistiques hebdomadaires - Lundi à 7h00
      this.scheduleJob('weekly-stats', '0 7 * * 1', () => {
        logger.info('📈 Début du job de statistiques hebdomadaires');
        reportJobs.generateWeeklyReports();
      });

      // Rappels de paiement - Tous les jours à 10h00
      this.scheduleJob('payment-reminders', '0 10 * * *', () => {
        logger.info('💳 Début du job de rappels de paiement');
        emailJobs.sendPaymentReminders();
      });

      // Vérification des avis en attente - Toutes les 2 heures
      this.scheduleJob('pending-reviews', '0 */2 * * *', () => {
        logger.info('⭐ Début du job de vérification des avis en attente');
        notificationJobs.checkPendingReviews();
      });

      logger.info(`✅ ${this.jobs.size} jobs planifiés avec succès`);
      this.isRunning = true;

      // Log de l'état des jobs
      this.logJobStatus();

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation des jobs:', error);
      throw error;
    }
  }

  /**
   * Planifie un job avec node-cron
   */
  scheduleJob(name, cronExpression, task) {
    try {
      const job = cron.schedule(cronExpression, async () => {
        const startTime = Date.now();
        logger.debug(`▶️ Début du job: ${name}`);

        try {
          await task();
          const duration = Date.now() - startTime;
          logger.debug(`✅ Job ${name} terminé en ${duration}ms`);
        } catch (error) {
          logger.error(`❌ Erreur lors de l'exécution du job ${name}:`, error);
        }
      }, {
        scheduled: false, // On démarre manuellement
        timezone: 'Europe/Paris'
      });

      this.jobs.set(name, job);
      job.start();

      logger.debug(`📅 Job ${name} planifié: ${cronExpression}`);

    } catch (error) {
      logger.error(`❌ Erreur de planification du job ${name}:`, error);
      throw error;
    }
  }

  /**
   * Démarre un job spécifique
   */
  startJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      logger.info(`▶️ Job ${name} démarré manuellement`);
    } else {
      throw new Error(`Job ${name} non trouvé`);
    }
  }

  /**
   * Arrête un job spécifique
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      logger.info(`⏹️ Job ${name} arrêté`);
    } else {
      throw new Error(`Job ${name} non trouvé`);
    }
  }

  /**
   * Exécute un job immédiatement
   */
  async runJobNow(name) {
    const jobTask = this.getJobTask(name);
    if (jobTask) {
      logger.info(`⚡ Exécution immédiate du job: ${name}`);
      await jobTask();
    } else {
      throw new Error(`Tâche du job ${name} non trouvée`);
    }
  }

  /**
   * Obtient la tâche d'un job
   */
  getJobTask(name) {
    const jobs = {
      'cleanup': cleanupJobs.dailyCleanup,
      'backup': backupJobs.dailyBackup,
      'daily-reports': reportJobs.generateDailyReports,
      'abandoned-cart': notificationJobs.sendAbandonedCartNotifications,
      'low-stock': notificationJobs.checkLowStock,
      'token-cleanup': cleanupJobs.cleanupExpiredTokens,
      'weekly-stats': reportJobs.generateWeeklyReports,
      'payment-reminders': emailJobs.sendPaymentReminders,
      'pending-reviews': notificationJobs.checkPendingReviews
    };

    return jobs[name];
  }

  /**
   * Obtient le statut de tous les jobs
   */
  getJobStatus() {
    const status = {};
    
    for (const [name, job] of this.jobs) {
      status[name] = {
        scheduled: job.getStatus() === 'scheduled',
        cron: job.getOptions().rule,
        timezone: job.getOptions().timezone
      };
    }

    return status;
  }

  /**
   * Log le statut des jobs
   */
  logJobStatus() {
    const status = this.getJobStatus();
    logger.info('📋 Statut des jobs planifiés:');
    
    for (const [name, info] of Object.entries(status)) {
      const statusIcon = info.scheduled ? '✅' : '❌';
      logger.info(`   ${statusIcon} ${name}: ${info.cron} (${info.timezone})`);
    }
  }

  /**
   * Arrête tous les jobs
   */
  shutdown() {
    logger.info('🛑 Arrêt de tous les jobs planifiés...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.debug(`⏹️ Job ${name} arrêté`);
    }

    this.jobs.clear();
    this.isRunning = false;
    logger.info('✅ Tous les jobs arrêtés');
  }
}

// Instance singleton
const jobScheduler = new JobScheduler();

module.exports = {
  JobScheduler,
  jobScheduler,
  initializeJobs: () => jobScheduler.initialize(),
  shutdownJobs: () => jobScheduler.shutdown(),
  runJobNow: (name) => jobScheduler.runJobNow(name),
  getJobStatus: () => jobScheduler.getJobStatus()
};
