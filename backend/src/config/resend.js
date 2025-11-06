const { Resend } = require('resend');
const config = require('./index');
const logger = require('../utils/logger');

class ResendService {
  constructor() {
    this.resend = null;
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      if (!config.email.resendApiKey) {
        logger.warn('⚠️  Clé API Resend manquante - service désactivé');
        return;
      }

      this.resend = new Resend(config.email.resendApiKey);
      this.initialized = true;

      logger.info('✅ Service Resend initialisé');

      // Test de connexion
      this.testConnection();

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de Resend:', error);
      this.initialized = false;
    }
  }

  async testConnection() {
    if (!this.initialized) return;

    try {
      // Resend n'a pas de méthode de test directe, on teste avec une requête simple
      const result = await this.resend.emails.send({
        from: 'test@buysell.com',
        to: 'test@example.com',
        subject: 'Test de connexion Resend',
        html: '<p>Ceci est un test de connexion.</p>',
      });

      // Si on arrive ici sans erreur, la connexion est bonne
      logger.info('✅ Connexion Resend établie');

    } catch (error) {
      // On ignore les erreurs liées à l'envoi d'email (adresse invalide)
      // mais on log pour information
      if (error.message.includes('invalid_parameter')) {
        logger.info('✅ Connexion Resend établie (test d\'envoi ignoré)');
      } else {
        logger.error('❌ Erreur de connexion Resend:', error);
        this.initialized = false;
      }
    }
  }

  // Envoyer un email simple
  async sendEmail(to, subject, html, text = null, options = {}) {
    if (!this.initialized) {
      throw new Error('Service Resend non initialisé');
    }

    try {
      const emailOptions = {
        from: options.from || config.email.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...options
      };

      // Ajouter la version texte si fournie
      if (text) {
        emailOptions.text = text;
      }

      const result = await this.resend.emails.send(emailOptions);

      logger.info('📧 Email envoyé via Resend:', {
        to,
        subject,
        messageId: result.data?.id,
        success: true
      });

      return {
        messageId: result.data?.id,
        success: true,
        data: result.data
      };

    } catch (error) {
      logger.error('❌ Erreur d\'envoi d\'email Resend:', error);
      throw this.handleError(error);
    }
  }

  // Envoyer un email avec template
  async sendTemplateEmail(to, templateId, templateData, options = {}) {
    if (!this.initialized) {
      throw new Error('Service Resend non initialisé');
    }

    try {
      const emailOptions = {
        from: options.from || config.email.from,
        to: Array.isArray(to) ? to : [to],
        templateId,
        data: templateData,
        ...options
      };

      const result = await this.resend.emails.send(emailOptions);

      logger.info('📧 Email template envoyé via Resend:', {
        to,
        templateId,
        messageId: result.data?.id,
        success: true
      });

      return {
        messageId: result.data?.id,
        success: true,
        data: result.data
      };

    } catch (error) {
      logger.error('❌ Erreur d\'envoi d\'email template Resend:', error);
      throw this.handleError(error);
    }
  }

  // Envoyer un email de bienvenue
  async sendWelcomeEmail(to, userName) {
    const subject = 'Bienvenue sur BuySell Platform! 🎉';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur BuySell! 🎉</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            <p>Nous sommes ravis de vous accueillir sur notre plateforme de marketplace.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
            <ul>
              <li>👕 Acheter des produits auprès de nos vendeurs vérifiés</li>
              <li>🏪 Vendre vos propres produits et développer votre business</li>
              <li>⭐ Noter et commenter vos achats</li>
              <li>🔔 Recevoir des notifications personnalisées</li>
            </ul>
            <p>Explorez notre catalogue et commencez votre expérience d'achat/vente dès maintenant !</p>
            <a href="${config.app.frontendUrl}/products" class="button">Découvrir les produits</a>
            <p>Si vous avez des questions, n'hésitez pas à répondre à cet email.</p>
            <p>Bien cordialement,<br>L'équipe BuySell</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bienvenue sur BuySell Platform!
      
      Bonjour ${userName},
      
      Nous sommes ravis de vous accueillir sur notre plateforme de marketplace.
      
      Votre compte a été créé avec succès. Vous pouvez maintenant :
      - Acheter des produits auprès de nos vendeurs vérifiés
      - Vendre vos propres produits et développer votre business
      - Noter et commenter vos achats
      - Recevoir des notifications personnalisées
      
      Explorez notre catalogue : ${config.app.frontendUrl}/products
      
      Bien cordialement,
      L'équipe BuySell
    `;

    return this.sendEmail(to, subject, html, text);
  }

  // Envoyer un email de réinitialisation de mot de passe
  async sendPasswordResetEmail(to, resetToken, userName) {
    const resetUrl = `${config.app.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            <div class="warning">
              <p><strong>⚠️ Important :</strong> Ce lien expirera dans 1 heure.</p>
              <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
            <p><code>${resetUrl}</code></p>
            <p>Bien cordialement,<br>L'équipe BuySell</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Réinitialisation de mot de passe
      
      Bonjour ${userName},
      
      Vous avez demandé la réinitialisation de votre mot de passe.
      
      Cliquez sur ce lien pour créer un nouveau mot de passe :
      ${resetUrl}
      
      ⚠️ Important : Ce lien expirera dans 1 heure.
      Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
      
      Bien cordialement,
      L'équipe BuySell
    `;

    return this.sendEmail(to, subject, html, text);
  }

  // Envoyer un email de confirmation de commande
  async sendOrderConfirmationEmail(to, order, userName) {
    const subject = `Confirmation de commande #${order.order_number}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Commande confirmée! ✅</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            <p>Votre commande a été confirmée avec succès.</p>
            
            <div class="order-details">
              <h3>Détails de la commande</h3>
              <p><strong>Numéro de commande :</strong> ${order.order_number}</p>
              <p><strong>Date :</strong> ${new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
              <p><strong>Total :</strong> ${order.total_amount.toLocaleString('fr-FR')} XOF</p>
              <p><strong>Statut :</strong> ${order.status}</p>
            </div>
            
            <p>Vous pouvez suivre l'état de votre commande dans votre espace personnel.</p>
            <a href="${config.app.frontendUrl}/orders/${order.id}" class="button">Voir ma commande</a>
            
            <p>Merci pour votre confiance !</p>
            <p>Bien cordialement,<br>L'équipe BuySell</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  // Gestion des erreurs Resend
  handleError(error) {
    const resendError = {
      message: error.message,
      name: error.name,
      statusCode: error.statusCode
    };

    logger.error('❌ Erreur Resend:', resendError);
    return resendError;
  }

  // Vérifier si le service est initialisé
  isInitialized() {
    return this.initialized;
  }

  // Getter pour le client Resend
  getClient() {
    if (!this.initialized) {
      throw new Error('Service Resend non initialisé');
    }
    return this.resend;
  }
}

// Instance singleton
const resendService = new ResendService();

module.exports = resendService;
