const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;
    this.fromEmail = config.email.from;
    this.appName = config.app.name;
    this.appUrl = config.app.url;
  }

  /**
   * Vérifier la configuration email
   */
  isConfigured() {
    return !!this.resend;
  }

  /**
   * Envoyer un email générique
   */
  async sendEmail(to, subject, html, text = null) {
    if (!this.isConfigured()) {
      logger.warn('Service email non configuré - email non envoyé', { to, subject });
      return { success: false, error: 'Service email non configuré' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      });

      if (error) {
        throw new Error(error.message);
      }

      logger.info('Email envoyé avec succès', { to, subject, emailId: data.id });
      return { success: true, data };

    } catch (error) {
      logger.error('Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email de vérification
   */
  async sendVerificationEmail(email, verificationToken, firstName) {
    const verificationUrl = `${this.appUrl}/auth/verify-email?token=${verificationToken}`;
    
    const subject = `Vérifiez votre adresse email - ${this.appName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Merci de vous être inscrit sur ${this.appName} !</p>
            <p>Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </p>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>Ce lien expirera dans 24 heures.</p>
            <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${resetToken}`;
    
    const subject = `Réinitialisation de votre mot de passe - ${this.appName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .warning { background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Si le bouton ne fonctionne pas, copiez-collez ce lien :</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <p><strong>Important :</strong> Ce lien expirera dans 1 heure.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Email de confirmation de commande
   */
  async sendOrderConfirmationEmail(order, user) {
    const subject = `Confirmation de commande #${order.order_number} - ${this.appName}`;
    const orderUrl = `${this.appUrl}/orders/${order.id}`;
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(item.unit_price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(item.unit_price * item.quantity)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .order-table th { background: #4F46E5; color: white; padding: 12px; text-align: left; }
          .order-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: bold; background: #f0f0f0; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Commande confirmée !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.first_name},</h2>
            <p>Merci pour votre commande ! Voici le récapitulatif :</p>
            
            <table class="order-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style="text-align: center;">Quantité</th>
                  <th style="text-align: right;">Prix unitaire</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Sous-total :</td>
                  <td style="text-align: right;">${this.formatPrice(order.subtotal_amount)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Livraison :</td>
                  <td style="text-align: right;">${this.formatPrice(order.shipping_amount)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total :</td>
                  <td style="text-align: right;">${this.formatPrice(order.total_amount)}</td>
                </tr>
              </tbody>
            </table>

            <p style="text-align: center;">
              <a href="${orderUrl}" class="button">Voir ma commande</a>
            </p>

            <p>Nous vous tiendrons informé de l'avancement de votre commande.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Email de notification de vente pour le vendeur
   */
  async sendNewOrderNotification(sellerEmail, order, sellerName) {
    const subject = `Nouvelle commande reçue - ${this.appName}`;
    const orderUrl = `${this.appUrl}/seller/orders/${order.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle commande ! 🎉</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${sellerName},</h2>
            <p>Félicitations ! Vous avez reçu une nouvelle commande.</p>
            <p><strong>Numéro de commande :</strong> #${order.order_number}</p>
            <p><strong>Montant :</strong> ${this.formatPrice(order.total_amount)}</p>
            <p style="text-align: center;">
              <a href="${orderUrl}" class="button">Voir la commande</a>
            </p>
            <p>N'oubliez pas de préparer et d'expédier la commande dans les délais.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(sellerEmail, subject, html);
  }

  /**
   * Email de notification de statut de commande
   */
  async sendOrderStatusUpdate(order, user, newStatus) {
    const statusMessages = {
      'shipped': 'a été expédiée',
      'delivered': 'a été livrée',
      'cancelled': 'a été annulée'
    };

    const statusMessage = statusMessages[newStatus] || 'a été mise à jour';
    const subject = `Mise à jour de votre commande #${order.order_number} - ${this.appName}`;
    const orderUrl = `${this.appUrl}/orders/${order.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mise à jour de commande</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.first_name},</h2>
            <p>Votre commande #${order.order_number} ${statusMessage}.</p>
            <p style="text-align: center;">
              <a href="${orderUrl}" class="button">Voir ma commande</a>
            </p>
            ${newStatus === 'shipped' ? `
              <p>Vous pouvez suivre l'acheminement de votre colis depuis votre espace client.</p>
            ` : ''}
            ${newStatus === 'delivered' ? `
              <p>Nous espérons que vous êtes satisfait de votre achat ! N'hésitez pas à laisser un avis sur les produits.</p>
            ` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Convertir HTML en texte brut
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Formater un prix
   */
  formatPrice(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}

module.exports = new EmailService();
