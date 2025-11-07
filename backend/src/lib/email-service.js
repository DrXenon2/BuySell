/**
 * Service d'envoi d'emails avec Resend
 */

const { Resend } = require('resend');
const { generateEmail } = require('./email-templates');
const logger = require('./logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  // Envoyer un email de bienvenue
  sendWelcomeEmail: async (user) => {
    try {
      const email = generateEmail('WELCOME', {
        user: {
          firstName: user.first_name || user.full_name?.split(' ')[0] || 'Cher client',
          email: user.email
        }
      });

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
        to: user.email,
        subject: email.subject,
        html: email.html
      });

      if (error) {
        logger.error('Erreur envoi email bienvenue:', error);
        throw error;
      }

      logger.info(`Email de bienvenue envoyé à ${user.email}`);
      return data;
    } catch (error) {
      logger.error('Erreur service email bienvenue:', error);
      throw error;
    }
  },

  // Envoyer un email de vérification
  sendVerificationEmail: async (user, verificationToken) => {
    try {
      const email = generateEmail('VERIFICATION', {
        user: {
          firstName: user.first_name || user.full_name?.split(' ')[0] || 'Cher client',
          email: user.email
        },
        verificationUrl: `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`
      });

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
        to: user.email,
        subject: email.subject,
        html: email.html
      });

      if (error) throw error;

      logger.info(`Email de vérification envoyé à ${user.email}`);
      return data;
    } catch (error) {
      logger.error('Erreur service email vérification:', error);
      throw error;
    }
  },

  // Envoyer un email de réinitialisation de mot de passe
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const email = generateEmail('PASSWORD_RESET', {
        user: {
          firstName: user.first_name || user.full_name?.split(' ')[0] || 'Cher client',
          email: user.email
        },
        resetUrl: `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
      });

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
        to: user.email,
        subject: email.subject,
        html: email.html
      });

      if (error) throw error;

      logger.info(`Email de réinitialisation envoyé à ${user.email}`);
      return data;
    } catch (error) {
      logger.error('Erreur service email réinitialisation:', error);
      throw error;
    }
  },

  // Envoyer un email de confirmation de commande
  sendOrderConfirmationEmail: async (user, order) => {
    try {
      const email = generateEmail('ORDER_CONFIRMATION', {
        user: {
          firstName: user.first_name || user.full_name?.split(' ')[0] || 'Cher client',
          email: user.email
        },
        order: {
          id: order.id,
          total: order.total_amount,
          items: order.items
        }
      });

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
        to: user.email,
        subject: email.subject,
        html: email.html
      });

      if (error) throw error;

      logger.info(`Email de confirmation de commande envoyé à ${user.email}`);
      return data;
    } catch (error) {
      logger.error('Erreur service email confirmation commande:', error);
      throw error;
    }
  },

  // Envoyer un email de notification au vendeur
  sendSellerNotificationEmail: async (seller, order) => {
    try {
      const email = generateEmail('SELLER_ORDER_NOTIFICATION', {
        seller: {
          firstName: seller.first_name || seller.full_name?.split(' ')[0] || 'Cher vendeur',
          email: seller.email
        },
        order: {
          id: order.id,
          total: order.total_amount,
          items: order.items
        }
      });

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BuySell <noreply@buysell.africa>',
        to: seller.email,
        subject: email.subject,
        html: email.html
      });

      if (error) throw error;

      logger.info(`Email de notification vendeur envoyé à ${seller.email}`);
      return data;
    } catch (error) {
      logger.error('Erreur service email notification vendeur:', error);
      throw error;
    }
  }
};

module.exports = emailService;
